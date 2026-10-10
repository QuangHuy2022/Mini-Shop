"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "./store-provider";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, wishlist, session, signOut } = useStore();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const onSubmit = (event) => {
    event.preventDefault();
    router.push(`/products${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  };

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-inner">
          <Link href="/" className="logo" title="Mini Shop Trang Chủ">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h6v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z" /></svg>
            <span className="logo-text">Mini Shop</span>
          </Link>
          <button className="mobile-toggle" aria-label="Mở menu" onClick={() => setMenuOpen(!menuOpen)} type="button">☰</button>
          <nav><ul className={`nav-menu ${menuOpen ? "show" : ""}`}>
            <li><Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>Home</Link></li>
            <li><Link href="/products" className={`nav-link ${pathname.startsWith("/products") ? "active" : ""}`}>Products</Link></li>
            <li><Link href="/#about" className="nav-link">About</Link></li>
            <li><Link href="/#contact" className="nav-link">Contact</Link></li>
          </ul></nav>
          <form className="header-search" onSubmit={onSubmit}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" className="search-input" placeholder="Search products..." aria-label="Tìm sản phẩm" />
            <button className="search-icon" type="submit" aria-label="Tìm kiếm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></button>
          </form>
          <Link className="header-favorites" href="/favorites" aria-label="Sản phẩm yêu thích"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg><span>Yêu thích</span><span className="wishlist-count" hidden={!wishlist.length}>{wishlist.length}</span></Link>
          <Link className="header-cart" href="/cart" aria-label="Giỏ hàng"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg><span>Giỏ hàng</span><span className="cart-count" hidden={!cartCount}>{cartCount}</span></Link>
          <div className="header-actions">
            {session ? <>
              <span className="header-account-name">{session.name}</span>
              {session.role === "admin" && <Link className="btn btn-pill btn-outline-green" href="/admin">Quản trị</Link>}
              <button className="btn btn-pill btn-outline-blue" onClick={() => { signOut(); router.push("/"); }} type="button">Đăng xuất</button>
            </> : <>
              <Link className="btn btn-pill btn-outline-blue" href="/login">Đăng nhập</Link>
              <Link className="btn btn-pill btn-primary-blue" href="/register">Đăng ký</Link>
              <Link className="btn btn-pill btn-outline-green" href="/admin">Admin</Link>
            </>}
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return <footer className="site-footer" id="contact"><div className="container">
    <div className="footer-grid">
      <div className="footer-col-about"><Link href="/" className="logo"><span className="logo-text">Mini Shop</span></Link><p className="footer-slogan">Đồ dùng &amp; trang trí cho cuộc sống tiện nghi và phong cách.</p><div className="social-links"><a className="social-icon" href="#" aria-label="Facebook">f</a><a className="social-icon" href="#" aria-label="Instagram">◎</a><a className="social-icon" href="#" aria-label="YouTube">▶</a><a className="social-icon" href="#" aria-label="TikTok">♪</a></div></div>
      <div className="footer-col" id="about"><h4 className="footer-heading">Thông tin</h4><ul className="footer-links"><li><a href="#">Về chúng tôi</a></li><li><a href="#">Chính sách bảo mật</a></li><li><a href="#">Điều khoản sử dụng</a></li><li><a href="#">Chính sách đổi trả</a></li></ul></div>
      <div className="footer-col"><h4 className="footer-heading">Hỗ trợ khách hàng</h4><ul className="footer-links"><li><a href="#">Hướng dẫn mua hàng</a></li><li><a href="#">Thanh toán &amp; giao hàng</a></li><li><a href="#">Bảo hành &amp; đổi trả</a></li><li><a href="#">Câu hỏi thường gặp</a></li></ul></div>
      <div className="footer-col"><h4 className="footer-heading">Liên hệ</h4><ul className="contact-list"><li className="contact-item">⌖ <span>Hà Nội, Việt Nam</span></li><li className="contact-item">☎ <span>0123 456 789</span></li><li className="contact-item">✉ <span>support@minishop.vn</span></li><li className="contact-item">◷ <span>08:00 - 21:00 (T2 - CN)</span></li></ul></div>
    </div><div className="footer-bottom"><p>© 2026 Mini Shop. All rights reserved.</p></div>
  </div></footer>;
}

export default function StorefrontLayout({ children }) {
  return <><Suspense fallback={<header className="site-header" />}><SiteHeader /></Suspense>{children}<SiteFooter /></>;
}
