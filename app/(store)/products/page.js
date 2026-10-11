"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Breadcrumbs, ProductCard } from "../../../components/common";
import { useCatalog } from "../../../lib/catalog";

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const { products: allProducts, categories, loading, error } = useCatalog();
  const [query, setQuery] = useState(null);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");
  const activeQuery = query === null ? searchParams.get("q") || "" : query;
  const products = useMemo(() => {
    const needle = normalize(activeQuery.trim());
    const result = allProducts.filter((product) =>
      (category === "all" || product.category === category) &&
      (!needle || normalize(`${product.name} ${product.description}`).includes(needle))
    );
    if (sort === "name-asc") result.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    if (sort === "price-asc") result.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
    return result;
  }, [allProducts, category, activeQuery, sort]);

  return <main className="container">
    <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Sản phẩm" }]} />
    <section className="page-title-row" aria-labelledby="page-title"><div><h1 className="page-title" id="page-title">Tất cả sản phẩm</h1><p className="page-subtitle">Hiển thị {products.length} trên {allProducts.length} sản phẩm</p></div>
      <div className="page-controls"><label className="visually-hidden" htmlFor="product-search">Tìm sản phẩm</label><input className="page-search-input" id="product-search" type="search" placeholder="Tìm sản phẩm..." value={activeQuery} onChange={(event) => setQuery(event.target.value)} /><label className="visually-hidden" htmlFor="product-sort">Sắp xếp sản phẩm</label><select className="sort-select" id="product-sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="default">Sắp xếp: Mặc định</option><option value="name-asc">Tên: A–Z</option><option value="price-asc">Giá: Thấp đến cao</option><option value="price-desc">Giá: Cao đến thấp</option></select></div>
    </section>
    <section className="products-page-layout" aria-label="Danh sách sản phẩm"><aside className="filter-sidebar" aria-labelledby="category-heading"><div className="filter-group"><h2 className="filter-group-title" id="category-heading">Danh mục</h2><ul className="filter-list">{categories.map((item) => {
      const count = item.id === "all" ? allProducts.length : allProducts.filter((product) => product.category === item.id).length;
      return count && <li key={item.id}><button className={`filter-item-btn ${category === item.id ? "active" : ""}`} onClick={() => setCategory(item.id)} type="button" aria-pressed={category === item.id}><span>{item.id === "all" ? "Tất cả sản phẩm" : item.label}</span><span className="filter-count">{count}</span></button></li>;
    })}</ul></div></aside>
      <div className="product-list-grid" aria-live="polite">{error ? <p className="page-subtitle" role="alert">Không thể tải sản phẩm: {error}</p> : loading ? <p className="page-subtitle">Đang tải sản phẩm...</p> : products.length ? products.map((product) => <ProductCard key={product.id} product={product} />) : <div className="products-empty"><p>Không tìm thấy sản phẩm nào</p><p>Hãy thử từ khóa khác hoặc chọn danh mục khác.</p></div>}</div>
    </section>
  </main>;
}

export default function ProductsPage() {
  return <Suspense fallback={<main className="container"><p className="page-subtitle">Đang tải sản phẩm...</p></main>}><ProductsContent /></Suspense>;
}
