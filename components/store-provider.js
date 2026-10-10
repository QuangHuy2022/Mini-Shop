"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const StoreContext = createContext(null);
const CART_KEY = "mini-shop-cart";
const WISHLIST_KEY = "mini-shop-wishlist";
const SESSION_KEY = "mini-shop-session";
const USERS_KEY = "mini-shop-users";
const DEMO_ADMIN = { name: "Quản trị viên", email: "admin@minishop.vn", password: "admin123", role: "admin" };
const EMPTY_STATE = { cart: [], wishlist: [], session: null, ready: false };
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
      session: readStorage(SESSION_KEY, null),
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
    if (event.key === SESSION_KEY) state = { ...state, session: readStorage(SESSION_KEY, null) };
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

  function signIn(email, password) {
    const normalized = email.trim().toLowerCase();
    const users = readStorage(USERS_KEY, []);
    const user = normalized === DEMO_ADMIN.email
      ? DEMO_ADMIN
      : users.find((account) => account.email === normalized);
    if (!user || user.password !== password) throw new Error("Email hoặc mật khẩu không chính xác.");
    const session = { name: user.name, email: user.email, role: user.role };
    update({ session }, { [SESSION_KEY]: session });
    return session;
  }

  function register({ name, email, password }) {
    const normalized = email.trim().toLowerCase();
    const users = readStorage(USERS_KEY, []);
    if (normalized === DEMO_ADMIN.email || users.some((user) => user.email === normalized)) {
      throw new Error("Email này đã được đăng ký.");
    }
    const user = { name: name.trim(), email: normalized, password, role: "customer" };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
    const session = { name: user.name, email: user.email, role: user.role };
    update({ session }, { [SESSION_KEY]: session });
    return session;
  }

  function signOut() {
    update({ session: null }, { [SESSION_KEY]: null });
  }

  const value = {
    cart: snapshot.cart,
    wishlist: snapshot.wishlist,
    session: snapshot.session,
    ready: snapshot.ready,
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
