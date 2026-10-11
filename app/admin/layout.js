import { Suspense } from "react";
import AdminGuard from "../../components/admin-guard";

export default function AdminRootLayout({ children }) {
  return <Suspense fallback={null}><AdminGuard>{children}</AdminGuard></Suspense>;
}
