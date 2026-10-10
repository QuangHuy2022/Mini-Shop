"use client";

import { useState } from "react";
import Link from "next/link";
import { Breadcrumbs, EmptyState } from "../../../components/common";
import { useStore } from "../../../components/store-provider";
import { FALLBACK_IMAGE, formatPrice, PRODUCTS } from "../../../lib/products";
import { addOrder } from "../../../lib/orders-store";

export default function CheckoutPage() {
  const { cart, setCart, ready } = useStore();
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const items = cart.map((item) => ({ ...item, product: PRODUCTS.find((product) => product.id === item.productId) })).filter((item) => item.product);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

  function submitOrder(event) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get("name")).trim();
    const phone = String(data.get("phone")).trim().replace(/[\s().-]/g, "");
    const address = String(data.get("address")).trim();
    if (name.length < 2 || address.length < 8 || !/^(?:0\d{9}|\+84\d{9})$/.test(phone)) {
      setError(!/^(?:0\d{9}|\+84\d{9})$/.test(phone)
        ? "Vui lòng nhập số điện thoại Việt Nam hợp lệ gồm 10 số."
        : "Vui lòng kiểm tra lại họ tên và địa chỉ nhận hàng.");
      return;
    }
    const savedOrder = {
      id: `MS-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customer: { name, phone, address },
      items: items.map(({ product, quantity }) => ({ productId: product.id, name: product.name, unitPrice: product.price, quantity, lineTotal: product.price * quantity })),
      total,
    };
    try {
      addOrder(savedOrder);
      setCart([]);
      setOrder(savedOrder);
    } catch (storageError) {
      console.error("Không thể ghi nhận đơn hàng:", storageError);
      setError("Chưa thể lưu đơn hàng trên trình duyệt. Vui lòng thử lại.");
    }
  }

  return <main className="container checkout-page"><Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Giỏ hàng", href: "/cart" }, { label: "Đặt hàng" }]} /><section><div className="cart-page-heading"><h1 className="page-title">Thông tin đặt hàng</h1><p className="page-subtitle">Điền thông tin nhận hàng để xác nhận đơn của bạn.</p></div>
    {order ? <div className="checkout-layout is-success"><section className="order-success"><div className="order-success-icon">✓</div><h2>Đặt hàng thành công!</h2><p>Cảm ơn <strong>{order.customer.name}</strong>, Mini Shop đã ghi nhận đơn hàng của bạn.</p><p>Mã đơn hàng: <strong className="order-number">{order.id}</strong></p><p className="order-success-total">Tổng đơn hàng: <strong>{formatPrice(order.total)}</strong></p><p>Nhân viên sẽ liên hệ với bạn để xác nhận thông tin giao hàng.</p><Link className="btn btn-primary-blue" href="/products">Tiếp tục mua sắm</Link></section></div>
      : !ready ? null : !items.length ? <div className="checkout-layout is-empty"><EmptyState title="Giỏ hàng đang trống" text="Thêm sản phẩm vào giỏ trước khi đặt hàng." /></div>
        : <div className="checkout-layout"><form className="checkout-form" onSubmit={submitOrder}><h2 className="checkout-section-title">Thông tin nhận hàng</h2><div className="checkout-field"><label htmlFor="customer-name">Họ và tên</label><input id="customer-name" name="name" autoComplete="name" placeholder="Ví dụ: Nguyễn Văn An" minLength="2" maxLength="100" required /></div><div className="checkout-field"><label htmlFor="customer-phone">Số điện thoại</label><input id="customer-phone" name="phone" type="tel" autoComplete="tel" placeholder="Ví dụ: 0912345678" maxLength="20" required /><small>Nhập số điện thoại Việt Nam gồm 10 số.</small></div><div className="checkout-field"><label htmlFor="customer-address">Địa chỉ nhận hàng</label><textarea id="customer-address" name="address" autoComplete="street-address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" minLength="8" maxLength="300" rows="4" required /></div><p className="checkout-error" role="alert">{error}</p><button className="btn btn-primary-blue checkout-submit" type="submit">Đặt hàng</button><a className="cart-continue" href="/cart">Quay lại giỏ hàng</a></form>
          <aside className="checkout-summary"><h2 className="cart-summary-title">Tóm tắt đơn hàng</h2><div className="checkout-items">{items.map(({ product, quantity }) => <div className="checkout-item" key={product.id}><img src={product.image} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} /><div className="checkout-item-info"><strong>{product.name}</strong><span>{quantity} × {formatPrice(product.price)}</span></div><strong className="checkout-item-total">{formatPrice(product.price * quantity)}</strong></div>)}</div><div className="cart-summary-row"><span>Tạm tính ({count} sản phẩm)</span><strong>{formatPrice(total)}</strong></div><div className="cart-summary-row"><span>Phí vận chuyển</span><span>Tính khi giao hàng</span></div><div className="cart-summary-total"><span>Tổng cộng</span><strong>{formatPrice(total)}</strong></div><p className="checkout-payment-note">Chưa cần thanh toán trực tuyến. Đơn hàng sẽ được ghi nhận sau khi xác nhận.</p></aside>
        </div>}
  </section></main>;
}
