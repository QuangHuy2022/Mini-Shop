"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { archiveProduct, createProduct, updateProduct } from "../app/admin/products/actions";
import { validateProductImage } from "../lib/admin-domain.mjs";
import { createClient } from "../lib/supabase/client";
import { formatPrice } from "../lib/products";

const FILE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function AdminProductsManager({
  products: initialProducts,
  categories,
  assets,
  initialError,
}) {
  const router = useRouter();
  const products = initialProducts;
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(initialError || "");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    name: "",
    categoryId: categories[0]?.id || "",
    price: "",
    imagePath: assets[0] || initialProducts[0]?.image || "",
    description: "",
  });

  const imageOptions = useMemo(
    () => [...new Set([...assets, ...products.map((product) => product.image)])].filter(Boolean),
    [assets, products]
  );
  const filtered = useMemo(
    () => products.filter((product) => product.name.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi"))),
    [products, search]
  );

  function reset() {
    setForm({
      name: "",
      categoryId: categories[0]?.id || "",
      price: "",
      imagePath: assets[0] || products[0]?.image || "",
      description: "",
    });
    setEditingId(null);
    setError("");
    setNotice("");
  }

  function edit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      categoryId: product.category,
      price: String(product.price),
      imagePath: product.image,
      description: product.description,
    });
    setError("");
    setNotice("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      const input = {
        name: form.name,
        category_id: form.categoryId,
        price_vnd: form.price,
        image_path: form.imagePath,
        description: form.description,
      };
      const result = editingId == null
        ? await createProduct(input)
        : await updateProduct(editingId, input);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setNotice(editingId == null ? "Đã thêm sản phẩm." : "Đã cập nhật sản phẩm.");
      reset();
      router.refresh();
    } catch (actionError) {
      console.error("Thao tác lưu sản phẩm thất bại:", actionError);
      setError(actionError instanceof Error ? actionError.message : "Không thể lưu sản phẩm.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validation = validateProductImage(file);
    if (!validation.success) {
      setError(validation.error);
      return;
    }

    setUploading(true);
    setError("");
    setNotice("");
    try {
      const extension = FILE_EXTENSIONS[file.type.toLowerCase()];
      const objectPath = `download/${crypto.randomUUID()}.${extension}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(objectPath, file, { upsert: false, contentType: file.type });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from("assets").getPublicUrl(objectPath);
      if (!data?.publicUrl) throw new Error("Không lấy được địa chỉ ảnh vừa tải lên.");
      setForm((current) => ({ ...current, imagePath: data.publicUrl }));
      setNotice("Tải ảnh lên thành công.");
    } catch (uploadError) {
      console.error("Không thể tải ảnh sản phẩm lên Supabase Storage:", uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "Không thể tải ảnh sản phẩm lên.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(product) {
    const confirmed = window.confirm(
      `Sản phẩm "${product.name}" sẽ được ẩn khỏi cửa hàng và giữ lại trong lịch sử đơn hàng. Bạn có chắc chắn muốn xóa?`
    );
    if (!confirmed) return;

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await archiveProduct(product.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (editingId === product.id) reset();
      setNotice("Đã ẩn sản phẩm khỏi cửa hàng.");
      router.refresh();
    } catch (actionError) {
      console.error("Không thể xóa sản phẩm khỏi cửa hàng:", actionError);
      setError(actionError instanceof Error ? actionError.message : "Không thể xóa sản phẩm.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="admin-eyebrow">DANH MỤC CỬA HÀNG</p>
          <h1 className="page-title">Quản lý sản phẩm</h1>
          <p className="page-subtitle">Thêm, chỉnh sửa hoặc xóa sản phẩm trong danh mục.</p>
        </div>
        <button className="btn btn-primary-blue" onClick={reset} type="button" disabled={busy}>
          + Thêm sản phẩm
        </button>
      </div>
      <div className="admin-management-layout">
        <section className="admin-panel admin-product-panel">
          <div className="admin-panel-heading admin-products-toolbar">
            <h2>Sản phẩm <span>({filtered.length})</span></h2>
            <label className="admin-search">
              <span className="visually-hidden">Tìm sản phẩm</span>
              <input
                type="search"
                placeholder="Tìm theo tên sản phẩm..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
          {initialError && <p className="admin-product-message error" role="alert">{initialError}</p>}
          <div className="admin-table-wrap">
            <table className="admin-orders-table admin-products-table">
              <thead>
                <tr><th>#</th><th>Ảnh</th><th>Tên sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {filtered.map((product, index) => (
                  <tr key={product.id}>
                    <td>{index + 1}</td>
                    <td><img className="admin-table-product-image" src={product.image} alt={product.name} /></td>
                    <td className="admin-product-name-cell">{product.name}</td>
                    <td>{categories.find((category) => category.id === product.category)?.name || "Khác"}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td className="admin-row-actions">
                      <button className="admin-action-button edit" onClick={() => edit(product)} type="button" disabled={busy}>Sửa</button>
                      <button className="admin-action-button delete" onClick={() => remove(product)} type="button" disabled={busy}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && !initialError && <p className="admin-empty">Không tìm thấy sản phẩm.</p>}
        </section>
        <aside className="admin-panel admin-product-form-panel">
          <h2>{editingId == null ? "Thêm sản phẩm" : "Sửa sản phẩm"}</h2>
          <form onSubmit={submit}>
            <div className="checkout-field">
              <label htmlFor="admin-product-name">Tên sản phẩm</label>
              <input
                id="admin-product-name"
                maxLength="100"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="checkout-field">
              <label htmlFor="admin-product-category">Danh mục</label>
              <select
                id="admin-product-category"
                required
                value={form.categoryId}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="checkout-field">
              <label htmlFor="admin-product-price">Giá (VND)</label>
              <input
                id="admin-product-price"
                type="number"
                min="1"
                step="1"
                required
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
              />
            </div>
            <div className="checkout-field">
              <label htmlFor="admin-product-image">Ảnh sản phẩm</label>
              <select
                id="admin-product-image"
                required
                value={form.imagePath}
                onChange={(event) => setForm({ ...form, imagePath: event.target.value })}
              >
                {!imageOptions.length && <option value="">Chưa có ảnh sản phẩm</option>}
                {imageOptions.map((image, index) => (
                  <option key={image} value={image}>Ảnh sản phẩm {index + 1}</option>
                ))}
              </select>
              <img className="admin-image-preview" src={form.imagePath} alt="Xem trước ảnh sản phẩm" />
              <label className="admin-upload-label" htmlFor="admin-product-upload">Hoặc tải ảnh JPEG, PNG, WebP (tối đa 6 MB)</label>
              <input
                id="admin-product-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={uploadImage}
                disabled={uploading || busy}
              />
              {uploading && <p className="admin-upload-status" role="status">Đang tải ảnh lên...</p>}
            </div>
            <div className="checkout-field">
              <label htmlFor="admin-product-description">Mô tả</label>
              <textarea
                id="admin-product-description"
                rows="3"
                maxLength="180"
                required
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </div>
            {error && <p className="admin-product-message error" role="alert">{error}</p>}
            {notice && <p className="admin-product-message success" role="status">{notice}</p>}
            <div className="admin-form-actions">
              <button className="btn btn-primary-green" type="submit" disabled={busy || uploading || Boolean(initialError)}>
                {busy ? "Đang lưu..." : "Lưu sản phẩm"}
              </button>
              <button className="btn btn-outline-blue" onClick={reset} type="button" disabled={busy}>Hủy</button>
            </div>
          </form>
        </aside>
      </div>
    </>
  );
}
