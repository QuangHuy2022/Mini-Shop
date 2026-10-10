"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { Breadcrumbs, ProductCard } from "../../../../components/common";
import { useStore } from "../../../../components/store-provider";
import { CATEGORIES, FALLBACK_IMAGE, formatPrice, PRODUCTS } from "../../../../lib/products";

function ProductDetailContent() {
  const { id } = useParams();
  const product = PRODUCTS.find((item) => String(item.id) === String(id));
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const saved = product ? wishlist.includes(product.id) : false;
  const related = useMemo(() => product
    ? PRODUCTS.filter((item) => item.id !== product.id && item.category === product.category)
      .concat(PRODUCTS.filter((item) => item.id !== product.id && item.category !== product.category)).slice(0, 4)
    : [], [product]);
  if (!product) return <main className="container product-detail-section"><div className="products-empty"><h1 className="page-title">Không tìm thấy sản phẩm</h1><p className="page-subtitle">Sản phẩm bạn muốn xem không tồn tại hoặc đã được gỡ khỏi cửa hàng.</p><Link className="btn btn-primary-blue" href="/products">Quay lại danh sách sản phẩm</Link></div></main>;
  const category = CATEGORIES.find((item) => item.id === product.category);
  return <main className="container product-detail-section">
    <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Sản phẩm", href: "/products" }, { label: product.name }]} />
    <section className="detail-main-grid" aria-labelledby="detail-title"><div className="detail-gallery-wrap"><div className="thumb-list" aria-label="Ảnh sản phẩm"><button className="thumb-item active" type="button" aria-label={`Xem ảnh ${product.name}`}><img src={product.image} alt="" /></button></div><div className="main-img-box"><img src={product.image} alt={product.name} fetchPriority="high" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} /></div></div>
      <div className="detail-info-col"><div className="detail-tags"><span className="tag-pill tag-stock">Còn hàng</span><span className="tag-pill tag-category">{category?.label || "Sản phẩm"}</span></div><h1 className="detail-title" id="detail-title">{product.name}</h1><div className="detail-rating-row" aria-label="Sản phẩm được yêu thích"><span className="star-rating">★★★★★</span><span className="review-count">Sản phẩm được khách hàng yêu thích</span></div><p className="detail-current-price">{formatPrice(product.price)}</p><p className="detail-desc">{product.description}. Sản phẩm được tuyển chọn kỹ lưỡng, mang đến vẻ đẹp tinh tế và tiện nghi cho không gian sống.</p>
        <div className="quantity-row"><label className="quantity-label" htmlFor="product-quantity">Số lượng:</label><div className="quantity-picker"><button className="quantity-btn" onClick={() => setQuantity((value) => Math.max(1, value - 1))} type="button">−</button><input className="quantity-input" id="product-quantity" type="number" min="1" max="99" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(99, Number(event.target.value) || 1)))} /><button className="quantity-btn" onClick={() => setQuantity((value) => Math.min(99, value + 1))} type="button">+</button></div></div>
        <div className="detail-actions"><button className="btn-add-cart" onClick={() => { addToCart(product.id, quantity); setMessage("Đã thêm sản phẩm vào giỏ hàng."); }} type="button"><span>Thêm vào giỏ</span></button><button className={`btn-wishlist-large ${saved ? "is-wishlisted" : ""}`} onClick={() => toggleWishlist(product.id)} type="button" aria-pressed={saved}><span>♡</span><span>{saved ? "Đã yêu thích" : "Yêu thích"}</span></button></div>
        <div className="guarantee-bar"><div className="guarantee-item"><span className="guarantee-icon">↗</span><span className="guarantee-text"><span className="guarantee-title">Giao hàng nhanh</span><span className="guarantee-desc">Toàn quốc</span></span></div><div className="guarantee-item"><span className="guarantee-icon">✓</span><span className="guarantee-text"><span className="guarantee-title">Đổi trả 7 ngày</span><span className="guarantee-desc">Yên tâm mua sắm</span></span></div><div className="guarantee-item"><span className="guarantee-icon">♡</span><span className="guarantee-text"><span className="guarantee-title">Thanh toán an toàn</span><span className="guarantee-desc">Bảo mật thông tin</span></span></div></div><p className="detail-feedback" aria-live="polite">{message}</p>
      </div><aside className="side-card-wrap" aria-label="Thông tin mua hàng"><section className="side-card"><h2 className="side-card-title">Thông tin sản phẩm</h2><table className="spec-table"><tbody><tr><td>Danh mục</td><td>{category?.label}</td></tr><tr><td>Mã sản phẩm</td><td>MS-{String(product.id).padStart(4, "0")}</td></tr><tr><td>Chất liệu</td><td>Chất liệu chọn lọc</td></tr><tr><td>Bảo quản</td><td>Lau sạch bằng khăn mềm</td></tr><tr><td>Xuất xứ</td><td>Việt Nam</td></tr></tbody></table></section><section className="side-card"><h2 className="side-card-title">Giao hàng &amp; đổi trả</h2><ul className="delivery-list"><li>Giao hàng toàn quốc từ 2–5 ngày</li><li>Miễn phí vận chuyển cho đơn từ 500.000đ</li><li>Hỗ trợ đổi trả trong 7 ngày</li></ul><Link href="/products" className="delivery-link">Tiếp tục mua sắm</Link></section></aside>
    </section><section className="related-section"><h2 className="related-title">Sản phẩm liên quan</h2><div className="related-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>
  </main>;
}

export default function ProductDetailPage() {
  return <Suspense fallback={<main className="container product-detail-section"><p className="page-subtitle">Đang tải sản phẩm...</p></main>}><ProductDetailContent /></Suspense>;
}
