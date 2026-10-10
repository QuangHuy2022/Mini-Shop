"use client";

import { useEffect } from "react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./store-provider";
import { AdminLayout } from "./common";

export default function AdminGuard({ children }) {
  const { session, ready } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (ready && (!session || session.role !== "admin")) router.replace("/login?next=admin");
  }, [ready, session, router]);
  if (!ready || !session || session.role !== "admin") return null;
  return <div className="admin-body"><Suspense fallback={<main className="admin-content" />}><AdminLayout>{children}</AdminLayout></Suspense></div>;
}
