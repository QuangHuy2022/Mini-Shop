"use server";

import { revalidatePath } from "next/cache";
import { isAllowedOrderTransition } from "../../../lib/admin-domain.mjs";
import { getAdminClient } from "../../../lib/supabase/admin";

function getOrderId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function setOrderStatus(id, nextStatus) {
  const supabase = await getAdminClient();
  const orderId = getOrderId(id);
  if (!orderId) return { success: false, error: "Mã đơn hàng không hợp lệ." };

  const { data: currentOrder, error: readError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  if (readError) {
    console.error("Không thể đọc trạng thái đơn hàng:", readError.message);
    return { success: false, error: "Không thể kiểm tra trạng thái đơn hàng." };
  }
  if (!currentOrder) return { success: false, error: "Không tìm thấy đơn hàng." };
  if (!isAllowedOrderTransition(currentOrder.status, nextStatus)) {
    return { success: false, error: "Đơn hàng đã đổi trạng thái hoặc không thể chuyển sang trạng thái này." };
  }

  const { data, error } = await supabase.rpc("set_store_order_status", {
    p_order_id: orderId,
    p_next_status: nextStatus,
  });

  if (error) {
    console.error("Không thể cập nhật trạng thái đơn hàng:", error.message);
    return { success: false, error: "Không thể cập nhật trạng thái đơn hàng." };
  }
  if (data?.status !== nextStatus) {
    console.error("RPC trạng thái đơn hàng trả về kết quả không hợp lệ:", data);
    return { success: false, error: "Kho dữ liệu không xác nhận trạng thái đơn hàng mới." };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { success: true };
}
