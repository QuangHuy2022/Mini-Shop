"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, formatPrice, PRODUCTS } from "../../../lib/products";

export default function AdminProductsPage() {
  const [products, setProducts] = useState(PRODUCTS);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", category: "noi-that", price: "", image: PRODUCTS[0].image, description: "" });
  const categoryOptions = CATEGORIES.filter((category) => category.id !== "all" && category.id !== "khac");
  const images = [...new Set(products.map((product) => product.image))];
  const filtered = useMemo(() => products.filter((product) => product.name.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi"))), [products, search]);
  function reset() {
    setForm({ name: "", category: "noi-that", price: "", image: images[0] || PRODUCTS[0].image, description: "" });
    setEditingId(null);
    setError("");
  }
  function submit(event) {
    event.preventDefault();
    setError("");
    const name = form.name.trim();
    const price = Number(form.price);
    const description = form.description.trim();
    if (!name || name.length < 2 || !Number.isFinite(price) || price <= 0 || !description) {
      setError("Vui lòng nhập tên, giá và mô tả sản phẩm hợp lệ.");
      return;
    }
    const value = { ...form, name, price, description };
    if (editingId) setProducts((items) => items.map((item) => item.id === editingId ? { ...item, ...value } : item));
    else setProducts((items) => [...items, { id: Math.max(0, ...items.map((item) => item.id)) + 1, ...value }]);
    reset();
  }
  function edit(product) {
    setEditingId(product.id);
    setForm({ name: product.name, category: product.category, price: String(product.price), image: product.image, description: product.description });
  }
  function remove(product) {
    if (!window.confirm(`Bạn có chắc muốn xóa "${product.name}"?`)) return;
    setProducts((items) => items.filter((item) => item.id !== product.id));
    if (editingId === product.id) reset();
  }

  return <><div className="admin-heading"><div><p className="admin-eyebrow">DANH MỤC CỬA HÀNG</p><h1 className="page-title">Quản lý sản phẩm</h1><p className="page-subtitle">Thêm, chỉnh sửa hoặc xóa sản phẩm trong danh mục.</p></div><button className="btn btn-primary-blue" onClick={reset} type="button">+ Thêm sản phẩm</button></div>
    <div className="admin-management-layout"><section className="admin-panel admin-product-panel"><div className="admin-panel-heading admin-products-toolbar"><h2>Sản phẩm <span>({filtered.length})</span></h2><label className="admin-search"><span className="visually-hidden">Tìm sản phẩm</span><input type="search" placeholder="Tìm theo tên sản phẩm..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
      <div className="admin-table-wrap"><table className="admin-orders-table admin-products-table"><thead><tr><th>#</th><th>Ảnh</th><th>Tên sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Thao tác</th></tr></thead><tbody>{filtered.map((product, index) => <tr key={product.id}><td>{index + 1}</td><td><img className="admin-table-product-image" src={product.image} alt={product.name} /></td><td className="admin-product-name-cell">{product.name}</td><td>{categoryOptions.find((category) => category.id === product.category)?.label || "Khác"}</td><td>{formatPrice(product.price)}</td><td className="admin-row-actions"><button className="admin-action-button edit" onClick={() => edit(product)} type="button">Sửa</button><button className="admin-action-button delete" onClick={() => remove(product)} type="button">Xóa</button></td></tr>)}</tbody></table></div>{!filtered.length && <p className="admin-empty">Không tìm thấy sản phẩm.</p>}</section>
      <aside className="admin-panel admin-product-form-panel"><h2>{editingId ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2><form onSubmit={submit}><div className="checkout-field"><label htmlFor="admin-product-name">Tên sản phẩm</label><input id="admin-product-name" maxLength="100" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div className="checkout-field"><label htmlFor="admin-product-category">Danh mục</label><select id="admin-product-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></div><div className="checkout-field"><label htmlFor="admin-product-price">Giá (VND)</label><input id="admin-product-price" type="number" min="1" step="1" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div><div className="checkout-field"><label htmlFor="admin-product-image">Ảnh sản phẩm</label><select id="admin-product-image" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })}>{images.map((image, index) => <option key={image} value={image}>Ảnh sản phẩm {index + 1}</option>)}</select><img className="admin-image-preview" src={form.image} alt="Xem trước ảnh sản phẩm" /></div><div className="checkout-field"><label htmlFor="admin-product-description">Mô tả</label><textarea id="admin-product-description" rows="3" maxLength="180" required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><p className="checkout-error" role="alert">{error}</p><div className="admin-form-actions"><button className="btn btn-primary-green" type="submit">Lưu sản phẩm</button><button className="btn btn-outline-blue" onClick={reset} type="button">Hủy</button></div><p className="admin-demo-label">Thay đổi chỉ tồn tại trên màn hình hiện tại.</p></form></aside>
    </div>
  </>;
}
