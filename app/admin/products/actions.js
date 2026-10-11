"use server";

import { revalidatePath } from "next/cache";
import { validateProductInput } from "../../../lib/admin-domain.mjs";
import { getAdminClient } from "../../../lib/supabase/admin";

async function checkCategory(supabase, categoryId) {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) {
    console.error("Không thể kiểm tra danh mục sản phẩm:", error.message);
    return { success: false, error: "Không thể xác minh danh mục sản phẩm." };
  }
  if (!data) return { success: false, error: "Danh mục sản phẩm không tồn tại." };
  return { success: true };
}

function refreshCatalog() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/[id]", "page");
  revalidatePath("/admin/products");
}

function getProductId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function createProduct(input) {
  const supabase = await getAdminClient();
  const validation = validateProductInput(input);
  if (!validation.success) return validation;

  const category = await checkCategory(supabase, validation.data.category_id);
  if (!category.success) return category;

  const { error } = await supabase.from("products").insert({
    ...validation.data,
    is_active: true,
  });

  if (error) {
    console.error("Không thể thêm sản phẩm:", error.message);
    return { success: false, error: "Không thể thêm sản phẩm vào kho dữ liệu." };
  }

  refreshCatalog();
  return { success: true };
}

export async function updateProduct(id, input) {
  const supabase = await getAdminClient();
  const productId = getProductId(id);
  if (!productId) return { success: false, error: "Mã sản phẩm không hợp lệ." };

  const validation = validateProductInput(input);
  if (!validation.success) return validation;

  const category = await checkCategory(supabase, validation.data.category_id);
  if (!category.success) return category;

  const { data, error } = await supabase
    .from("products")
    .update(validation.data)
    .eq("id", productId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Không thể cập nhật sản phẩm:", error.message);
    return { success: false, error: "Không thể cập nhật sản phẩm trong kho dữ liệu." };
  }
  if (!data) return { success: false, error: "Không tìm thấy sản phẩm cần cập nhật." };

  refreshCatalog();
  return { success: true };
}

export async function archiveProduct(id) {
  const supabase = await getAdminClient();
  const productId = getProductId(id);
  if (!productId) return { success: false, error: "Mã sản phẩm không hợp lệ." };

  const { data, error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", productId)
    .eq("is_active", true)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Không thể lưu trữ sản phẩm:", error.message);
    return { success: false, error: "Không thể xóa sản phẩm khỏi cửa hàng." };
  }
  if (!data) return { success: false, error: "Không tìm thấy sản phẩm đang bán cần xóa." };

  refreshCatalog();
  return { success: true };
}
