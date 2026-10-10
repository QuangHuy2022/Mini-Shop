import AdminGuard from "../../components/admin-guard";

export default function AdminRootLayout({ children }) {
  return <AdminGuard>{children}</AdminGuard>;
}
