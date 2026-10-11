"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FALLBACK_IMAGE, formatPrice } from "../lib/products";
import { useStore } from "./store-provider";

export function Breadcrumbs({ items }) {
  return <nav className="breadcrumb" aria-label="Điều hướng">{items.map((item, index) => <span key={`${item.label}-${index}`}>
    {index > 0 && <span className="breadcrumb-separator">›</span>}
    {item.href ? <Link href={item.href}>{item.label}</Link> : <span className="breadcrumb-current" aria-current="page">{item.label}</span>}
  </span>)}</nav>;
}

export function EmptyState({ title, text, href = "/products", action = "Khám phá sản phẩm", icon = "🛒" }) {
  return <div className="cart-empty"><div className="cart-empty-icon" aria-hidden="true">{icon}</div><h2>{title}</h2><p>{text}</p><Link className="btn btn-primary-blue" href={href}>{action}</Link></div>;
}

export function ProductCard({ product }) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const [added, setAdded] = useState(false);
  const saved = wishlist.includes(product.id);
  return <article className="product-card" data-id={product.id}>
    <button className={`wishlist-btn ${saved ? "is-wishlisted" : ""}`} onClick={() => toggleWishlist(product.id)} type="button" aria-pressed={saved} aria-label={saved ? "Bỏ yêu thích" : "Thêm vào yêu thích"}>♡</button>
    <Link className="product-card-link" href={`/products/${product.id}`} aria-label={`Xem chi tiết ${product.name}`}>
      <div className="product-img-wrap"><img src={product.image} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} /></div>
      <div className="product-info"><h2 className="product-name" title={product.name}>{product.name}</h2><p className="product-price">{formatPrice(product.price)}</p><p className="product-desc">{product.description}</p></div>
    </Link>
    <div className="product-card-actions"><button className="product-btn product-add-btn" onClick={() => { addToCart(product.id); setAdded(true); window.setTimeout(() => setAdded(false), 1200); }} type="button">{added ? "Đã thêm" : "Thêm vào giỏ"}</button><Link className="product-btn product-detail-btn" href={`/products/${product.id}`}>Chi tiết</Link></div>
  </article>;
}

export function ProductGrid({ products }) {
  if (!products.length) return <div className="products-empty"><p>Không tìm thấy sản phẩm nào</p><p>Hãy thử từ khóa khác hoặc chọn danh mục khác.</p></div>;
  return <div className="product-list-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}

export function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut } = useStore();
  const [authError, setAuthError] = useState("");
  const nav = [
    { href: "/admin", label: "Tổng quan", icon: "⌂" },
    { href: "/admin/products", label: "Sản phẩm", icon: "◇" },
    { href: "/admin/orders", label: "Đơn hàng", icon: "▣" },
  ];
  return <div className="admin-app"><aside className="admin-sidebar">
    <Link className="admin-brand" href="/admin"><span className="admin-brand-icon">M</span><span><strong>Mini Shop</strong><small>Admin Panel</small></span></Link>
    <p className="admin-nav-label">MENU</p><nav className="admin-nav" aria-label="Điều hướng quản trị">{nav.map((item) => <Link key={item.href} className={`admin-nav-link ${pathname === item.href ? "active" : ""}`} href={item.href} aria-current={pathname === item.href ? "page" : undefined}><span className="admin-nav-icon">{item.icon}</span><span>{item.label}</span></Link>)}</nav><Link className="admin-sidebar-store" href="/products">← Quay lại cửa hàng</Link>
    <button className="admin-sidebar-logout" type="button" onClick={async () => {
      setAuthError("");
      try {
        await signOut();
        router.push("/login");
      } catch (error) {
        setAuthError(error.message);
      }
    }}>↪ Đăng xuất</button>{authError && <p className="auth-error" role="alert">{authError}</p>}
    </aside><div className="admin-workspace"><header className="admin-topbar"><span className="admin-topbar-title">{nav.find((item) => item.href === pathname)?.label || "Quản trị"}</span><div className="admin-topbar-right"><span className="admin-live-label"><span /> Dữ liệu Supabase</span><span className="admin-avatar">{session?.name?.slice(0, 1).toUpperCase()}</span><span className="admin-topbar-name">{session?.name}</span></div></header><main className="admin-content">{children}</main></div></div>;
}
