"use client";

import Link from "next/link";
import { useOrders } from "../../lib/orders-store";
import { CATEGORIES, formatPrice, PRODUCTS } from "../../lib/products";

export default function AdminDashboardPage() {
  const orders = useOrders();
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const sales = orders.reduce((sum, order) => {
      const orderDate = new Date(order.createdAt);
      return sum + (!Number.isNaN(orderDate.getTime()) && orderDate.toDateString() === date.toDateString() ? order.total : 0);
    }, 0);
    return { date, sales };
  });
  const maxSales = Math.max(1, ...days.map((day) => day.sales));
  return <section><div className="admin-heading"><div><p className="admin-eyebrow">BẢNG ĐIỀU KHIỂN</p><h1 className="page-title">Tổng quan</h1><p className="page-subtitle">Chào mừng đến với Mini Shop.</p></div><Link className="btn btn-primary-blue" href="/products">Xem cửa hàng</Link></div>
    <div className="admin-stats"><article className="admin-stat-card"><span>Tổng sản phẩm</span><strong>{PRODUCTS.length}</strong><small>Trong danh mục cửa hàng</small></article><article className="admin-stat-card"><span>Danh mục</span><strong>{new Set(PRODUCTS.map((product) => product.category)).size}</strong><small>Nhóm sản phẩm</small></article><article className="admin-stat-card"><span>Đơn hàng</span><strong>{orders.length}</strong><small>Đã ghi nhận</small></article><article className="admin-stat-card"><span>Doanh thu đơn hàng</span><strong>{formatPrice(revenue)}</strong><small>Từ đơn hàng đã đặt</small></article></div>
    <div className="admin-dashboard-grid"><section className="admin-panel"><div className="admin-panel-heading"><h2>Tổng quan đơn hàng</h2><span className="admin-demo-label">Theo đơn đã ghi nhận</span></div><div className="admin-sales-chart">{days.map(({ date, sales }) => <div className="admin-chart-column" key={date.toISOString()}><div className="admin-chart-bar" style={{ height: `${Math.max(4, sales / maxSales * 100)}%` }} title={formatPrice(sales)} /><small>{sales ? formatPrice(sales) : "0đ"}</small><span>{date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span></div>)}</div><p className="admin-chart-note">Doanh thu phân bổ theo 7 ngày gần nhất.</p></section>
      <section className="admin-panel"><div className="admin-panel-heading"><h2>Sản phẩm</h2><Link href="/admin/products">Quản lý</Link></div><div className="admin-table-wrap"><table className="admin-orders-table"><thead><tr><th>Sản phẩm</th><th>Giá</th><th>Danh mục</th></tr></thead><tbody>{PRODUCTS.slice(0, 5).map((product) => <tr key={product.id}><td><img className="admin-table-product-image" src={product.image} alt="" />{product.name}</td><td>{formatPrice(product.price)}</td><td>{CATEGORIES.find((item) => item.id === product.category)?.label || "Khác"}</td></tr>)}</tbody></table></div></section></div>
    <section className="admin-panel admin-dashboard-orders"><div className="admin-panel-heading"><h2>Đơn hàng gần đây</h2><Link href="/admin/orders">Xem tất cả</Link></div><div className="admin-table-wrap"><table className="admin-orders-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Số lượng</th><th>Tổng tiền</th><th>Ngày đặt</th></tr></thead><tbody>{orders.slice(-5).reverse().map((order) => <tr key={order.id}><td>{order.id}</td><td>{order.customer.name}</td><td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td>{formatPrice(order.total)}</td><td>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td></tr>)}</tbody></table></div>{!orders.length && <p className="admin-empty">Chưa có đơn hàng nào được ghi nhận.</p>}</section>
  </section>;
}
