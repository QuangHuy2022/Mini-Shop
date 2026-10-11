import AdminProductsManager from "../../../components/admin-products-manager";
import { mapProductRow } from "../../../lib/admin-domain.mjs";
import { listProductAssets } from "../../../lib/product-assets.mjs";
import { getAdminClient } from "../../../lib/supabase/admin";

export default async function AdminProductsPage() {
  const supabase = await getAdminClient();
  const [productResult, categoryResult] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,price_vnd,category_id,description,image_path,is_active")
      .eq("is_active", true)
      .order("id"),
    supabase
      .from("categories")
      .select("id,name,icon,sort_order")
      .order("sort_order"),
  ]);

  let loadError = "";
  if (productResult.error) {
    console.error("Không thể tải danh sách sản phẩm quản trị:", productResult.error.message);
    loadError = "Không thể tải danh sách sản phẩm từ kho dữ liệu.";
  } else if (categoryResult.error) {
    console.error("Không thể tải danh mục sản phẩm quản trị:", categoryResult.error.message);
    loadError = "Không thể tải danh mục sản phẩm từ kho dữ liệu.";
  }

  let assets = [];
  try {
    assets = await listProductAssets();
  } catch (error) {
    console.error("Không thể đọc thư viện ảnh sản phẩm:", error);
    loadError ||= "Không thể tải thư viện ảnh sản phẩm.";
  }

  return (
    <AdminProductsManager
      products={(productResult.data || []).map(mapProductRow)}
      categories={categoryResult.data || []}
      assets={assets}
      initialError={loadError}
    />
  );
}
