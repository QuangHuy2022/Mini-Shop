"use client";

import { useSyncExternalStore } from "react";

const KEY = "mini-shop-orders";
const EMPTY_ORDERS = [];
let orders = [];
let loaded = false;
const listeners = new Set();

function getSnapshot() {
  return orders;
}

function getServerSnapshot() {
  return EMPTY_ORDERS;
}

function subscribe(listener) {
  listeners.add(listener);
  if (!loaded) {
    const stored = localStorage.getItem(KEY);
    orders = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(orders)) throw new Error("Dữ liệu đơn hàng đã lưu không hợp lệ.");
    loaded = true;
    listener();
  }
  return () => listeners.delete(listener);
}

export function useOrders() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function addOrder(order) {
  const stored = JSON.parse(localStorage.getItem(KEY) || "[]");
  if (!Array.isArray(stored)) throw new Error("Dữ liệu đơn hàng đã lưu không hợp lệ.");
  orders = [...stored, order];
  loaded = true;
  localStorage.setItem(KEY, JSON.stringify(orders));
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== KEY) return;
    orders = event.newValue ? JSON.parse(event.newValue) : [];
    if (!Array.isArray(orders)) throw new Error("Dữ liệu đơn hàng đã lưu không hợp lệ.");
    loaded = true;
    listeners.forEach((listener) => listener());
  });
}
