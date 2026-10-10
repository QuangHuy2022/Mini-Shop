"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORIES, FALLBACK_IMAGE, PRODUCTS } from "../../lib/products";
import { ProductCard } from "../../components/common";

export default function HomePage() {
  const [category, setCategory] = useState("all");
  const filtered = category === "all" ? PRODUCTS.slice(0, 6) : PRODUCTS.filter((product) => product.category === category);
  return <main>
    <section className="hero-section"><div className="container"><div className="hero-card">
      <div className="hero-content"><h1 className="hero-title">Sống đẹp mỗi ngày<br />cùng Mini Shop</h1><p className="hero-subtitle">Sản phẩm chất lượng cho tổ ấm của bạn.</p><a href="#products" className="btn btn-primary-green">Mua sắm ngay</a>
        <div className="hero-features"><div className="feature-item"><div className="feature-icon-wrap">♧</div><div className="feature-text"><span className="feature-title">Giao hàng nhanh</span><span className="feature-desc">Toàn quốc</span></div></div><div className="feature-item"><div className="feature-icon-wrap">✓</div><div className="feature-text"><span className="feature-title">Bảo hành chính hãng</span><span className="feature-desc">7 ngày đổi trả</span></div></div><div className="feature-item"><div className="feature-icon-wrap">☏</div><div className="feature-text"><span className="feature-title">Hỗ trợ 24/7</span><span className="feature-desc">Tư vấn tận tâm</span></div></div></div>
      </div><div className="hero-image-wrap"><img src="/MiniShop_Assets/assets/images/banner/banner-trang-chu-mini-shop.webp" alt="Sống đẹp mỗi ngày cùng Mini Shop" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} /></div>
    </div></div></section>
    <section className="categories-section"><div className="container"><div className="category-pills">{CATEGORIES.map((item) => <button key={item.id} className={`category-pill ${category === item.id ? "active" : ""}`} onClick={() => { setCategory(item.id); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} type="button"><span aria-hidden="true">{item.icon}</span><span>{item.label}</span></button>)}</div></div></section>
    <section className="products-section" id="products"><div className="container"><div className="section-header"><h2 className="section-title">{category === "all" ? "Sản phẩm nổi bật" : CATEGORIES.find((item) => item.id === category)?.label}</h2><Link href="/products" className="section-link"><span>Xem tất cả</span><span aria-hidden="true">→</span></Link></div>
      <div className="products-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div>
    </div></section>
  </main>;
}
