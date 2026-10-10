"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "../../../lib/products";
import { useOrders } from "../../../lib/orders-store";

export default function AdminOrdersPage() {
  const orders = useOrders();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => orders.filter((order) => `${order.id} ${order.customer.name} ${order.customer.phone}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi"))), [orders, query]);
  return <><div className="admin-heading"><div><p className="admin-eyebrow">GIAO DỊCH CỬA HÀNG</p><h1 className="page-title">Quản lý đơn hàng</h1><p className="page-subtitle">Các đơn hàng đã đặt và được ghi nhận trên cửa hàng.</p></div><span className="admin-demo-label">Đơn demo: <strong>{orders.length}</strong></span></div>
    <section className="admin-panel"><div className="admin-panel-heading admin-products-toolbar"><h2>Danh sách đơn hàng</h2><label className="admin-search"><span className="visually-hidden">Tìm đơn hàng</span><input type="search" placeholder="Tìm mã đơn hoặc khách hàng..." value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
      <div className="admin-table-wrap"><table className="admin-orders-table admin-management-orders-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Điện thoại</th><th>Địa chỉ</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Ngày đặt</th></tr></thead><tbody>{filtered.slice().reverse().map((order) => <tr key={order.id}><td>{order.id}</td><td>{order.customer.name}</td><td>{order.customer.phone}</td><td>{order.customer.address}</td><td className="admin-order-items-cell">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</td><td className="admin-order-total-cell">{formatPrice(order.total)}</td><td>{new Date(order.createdAt).toLocaleString("vi-VN")}</td></tr>)}</tbody></table></div>
      {!filtered.length && <p className="admin-empty">{orders.length ? "Không tìm thấy đơn hàng phù hợp." : "Chưa có đơn hàng nào được ghi nhận."}</p>}
    </section>
  </>;
}
