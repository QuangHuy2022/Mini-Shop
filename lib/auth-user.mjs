export function toStoreUser(user) {
  if (!user) return null;

  const email = user.email || "";
  const name = user.user_metadata?.full_name?.trim() || email.split("@")[0] || "Khách hàng";

  return {
    name,
    email,
    role: user.app_metadata?.role === "admin" ? "admin" : "customer",
  };
}

export function isAdminClaims(claims) {
  return claims?.app_metadata?.role === "admin";
}
