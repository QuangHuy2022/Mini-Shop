import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAdminClaims } from "../lib/auth-user.mjs";
import { createClient } from "../lib/supabase/server";
import { AdminLayout } from "./common";

export default async function AdminGuard({ children }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error("Không thể xác minh quyền truy cập khu quản trị:", error.message);
    redirect("/login?next=admin");
  }

  if (!isAdminClaims(data?.claims)) redirect("/login?next=admin");

  return <div className="admin-body"><Suspense fallback={<main className="admin-content" />}><AdminLayout>{children}</AdminLayout></Suspense></div>;
}
