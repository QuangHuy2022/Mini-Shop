import "server-only";

import { isAdminClaims } from "../auth-user.mjs";
import { createClient } from "./server";

export async function getAdminClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error("Không thể xác minh quyền truy cập quản trị:", error.message);
    throw new Error("Không thể xác minh quyền quản trị. Vui lòng đăng nhập lại.");
  }

  if (!isAdminClaims(data?.claims)) {
    throw new Error("Bạn không có quyền thực hiện thao tác quản trị.");
  }

  return supabase;
}
