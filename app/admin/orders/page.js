import AdminOrdersManager from "../../../components/admin-orders-manager";
import { mapOrderRow } from "../../../lib/admin-domain.mjs";
import { getAdminClient } from "../../../lib/supabase/admin";

export default async function AdminOrdersPage() {
  const supabase = await getAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id,order_code,customer_name,customer_phone,shipping_address,status,total_vnd,created_at,order_items(product_id,product_name,unit_price_vnd,quantity,line_total_vnd)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Không thể tải đơn hàng trong trang quản trị:", error.message);
    return <AdminOrdersManager orders={[]} initialError="Không thể tải danh sách đơn hàng từ kho dữ liệu." />;
  }

  return <AdminOrdersManager orders={(data || []).map(mapOrderRow)} initialError="" />;
}
