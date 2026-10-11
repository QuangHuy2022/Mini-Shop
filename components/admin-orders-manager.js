"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setOrderStatus } from "../app/admin/orders/actions";
import { getNextOrderStatus, getOrderStatusLabel } from "../lib/admin-domain.mjs";
import { formatPrice } from "../lib/products";

export default function AdminOrdersManager({ orders, initialError }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(initialError || "");
  const [notice, setNotice] = useState("");
  const filtered = useMemo(() => orders.filter((order) =>
    `${order.orderCode || order.id} ${order.customer.name} ${order.customer.phone}`
      .toLocaleLowerCase("vi")
      .includes(query.trim().toLocaleLowerCase("vi"))
  ), [orders, query]);

  async function advanceOrder(order) {
    const nextStatus = getNextOrderStatus(order.status);
    if (!nextStatus) return;

    setBusyId(order.id);
    setError("");
    setNotice("");
    try {
      const result = await setOrderStatus(order.id, nextStatus);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setNotice(`Đã chuyển đơn ${order.orderCode || order.id} sang trạng thái "${getOrderStatusLabel(nextStatus)}".`);
      router.refresh();
    } catch (actionError) {
      console.error("Thao tác cập nhật đơn hàng thất bại:", actionError);
      setError(actionError instanceof Error ? actionError.message : "Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="admin-eyebrow">GIAO DỊCH CỬA HÀNG</p>
          <h1 className="page-title">Quản lý đơn hàng</h1>
          <p className="page-subtitle">Các đơn hàng đã đặt và được ghi nhận trên cửa hàng.</p>
        </div>
        <span className="admin-demo-label">Đơn hàng: <strong>{orders.length}</strong></span>
      </div>
      <section className="admin-panel">
        <div className="admin-panel-heading admin-products-toolbar">
          <h2>Danh sách đơn hàng</h2>
          <label className="admin-search">
            <span className="visually-hidden">Tìm đơn hàng</span>
            <input
              type="search"
              placeholder="Tìm mã đơn hoặc khách hàng..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        {error && <p className="admin-product-message error" role="alert">{error}</p>}
        {notice && <p className="admin-product-message success" role="status">{notice}</p>}
        <div className="admin-table-wrap">
          <table className="admin-orders-table admin-management-orders-table">
            <thead>
              <tr><th>Mã đơn</th><th>Khách hàng</th><th>Điện thoại</th><th>Địa chỉ</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const nextStatus = getNextOrderStatus(order.status);
                return (
                  <tr key={order.id}>
                    <td>{order.orderCode || `MS-${order.id}`}</td>
                    <td>{order.customer.name}</td>
                    <td>{order.customer.phone}</td>
                    <td>{order.customer.address}</td>
                    <td className="admin-order-items-cell">
                      {order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}
                    </td>
                    <td className="admin-order-total-cell">{formatPrice(order.total)}</td>
                    <td><span className={`admin-order-status status-${order.status}`}>{getOrderStatusLabel(order.status)}</span></td>
                    <td>{new Date(order.createdAt).toLocaleString("vi-VN")}</td>
                    <td>
                      {nextStatus
                        ? <button
                          className="admin-action-button edit"
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => advanceOrder(order)}
                        >
                          {busyId === order.id ? "Đang lưu..." : `Chuyển ${getOrderStatusLabel(nextStatus).toLowerCase()}`}
                        </button>
                        : <span className="admin-order-complete">Hoàn tất</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && <p className="admin-empty">{orders.length ? "Không tìm thấy đơn hàng phù hợp." : "Chưa có đơn hàng nào được ghi nhận."}</p>}
      </section>
    </>
  );
}
