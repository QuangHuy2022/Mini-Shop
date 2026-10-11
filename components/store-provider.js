"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { createClient } from "../lib/supabase/client";
import { toStoreUser } from "../lib/auth-user.mjs";

const StoreContext = createContext(null);
const CART_KEY = "mini-shop-cart";
const WISHLIST_KEY = "mini-shop-wishlist";
const EMPTY_STATE = { cart: [], wishlist: [], session: null, ready: false, authReady: false };
let state = EMPTY_STATE;
let hydrated = false;
const listeners = new Set();

function readStorage(key, fallback) {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : fallback;
}

function subscribe(listener) {
  listeners.add(listener);
  if (!hydrated) {
    state = {
      cart: readStorage(CART_KEY, []),
      wishlist: readStorage(WISHLIST_KEY, []),
      ready: true,
    };
    hydrated = true;
    listener();
  }
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return EMPTY_STATE;
}

function update(patch, storageChanges = {}) {
  for (const [key, value] of Object.entries(storageChanges)) {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  }
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === CART_KEY) state = { ...state, cart: readStorage(CART_KEY, []) };
    if (event.key === WISHLIST_KEY) state = { ...state, wishlist: readStorage(WISHLIST_KEY, []) };
    listeners.forEach((listener) => listener());
  });
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore phải được dùng bên trong StoreProvider.");
  return value;
}

export default function StoreProvider({ children }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    localStorage.removeItem("mini-shop-users");
    localStorage.removeItem("mini-shop-session");

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, authSession) => {
      update({ session: toStoreUser(authSession?.user), authReady: true });
    });

    return () => subscription.unsubscribe();
  }, []);

  function addToCart(productId, quantity = 1) {
    const found = snapshot.cart.find((item) => item.productId === productId);
    const cart = found
      ? snapshot.cart.map((item) => item.productId === productId
        ? { ...item, quantity: Math.min(99, item.quantity + quantity) } : item)
      : [...snapshot.cart, { productId, quantity: Math.min(99, quantity) }];
    update({ cart }, { [CART_KEY]: cart });
  }

  function setQuantity(productId, quantity) {
    const cart = snapshot.cart.map((item) => item.productId === productId
      ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) } : item);
    update({ cart }, { [CART_KEY]: cart });
  }

  function removeFromCart(productId) {
    const cart = snapshot.cart.filter((item) => item.productId !== productId);
    update({ cart }, { [CART_KEY]: cart });
  }

  function toggleWishlist(productId) {
    const wishlist = snapshot.wishlist.includes(productId)
      ? snapshot.wishlist.filter((id) => id !== productId)
      : [...snapshot.wishlist, productId];
    update({ wishlist }, { [WISHLIST_KEY]: wishlist });
  }

  async function signIn(email, password) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;

    const user = toStoreUser(data.user);
    update({ session: user, authReady: true });
    return user;
  }

  async function register({ name, email, password }) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
      },
    });
    if (error) throw error;

    if (data.session) {
      update({ session: toStoreUser(data.user), authReady: true });
    }

    return data;
  }

  async function signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const value = {
    cart: snapshot.cart,
    wishlist: snapshot.wishlist,
    session: snapshot.session,
    ready: snapshot.ready,
    authReady: snapshot.authReady,
    cartCount: snapshot.cart.reduce((sum, item) => sum + item.quantity, 0),
    addToCart,
    setQuantity,
    removeFromCart,
    setCart: (cart) => update({ cart }, { [CART_KEY]: cart }),
    toggleWishlist,
    signIn,
    register,
    signOut,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
