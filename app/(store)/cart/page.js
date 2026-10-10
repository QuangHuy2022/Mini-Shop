"use client";

import Link from "next/link";
import { Breadcrumbs, EmptyState } from "../../../components/common";
import { useStore } from "../../../components/store-provider";
import { FALLBACK_IMAGE, formatPrice, PRODUCTS } from "../../../lib/products";

export default function CartPage() {
  const { cart, setQuantity, removeFromCart, ready } = useStore();
  const items = cart.map((item) => ({ ...item, product: PRODUCTS.find((product) => product.id === item.productId) })).filter((item) => item.product);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
  return <main className="container cart-page"><Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Giỏ hàng" }]} /><section><div className="cart-page-heading"><div><h1 className="page-title">Giỏ hàng</h1><p className="page-subtitle">{count} sản phẩm trong giỏ</p></div></div>
    {!ready ? null : !items.length ? <EmptyState title="Giỏ hàng đang trống" text="Hãy khám phá các sản phẩm và chọn món đồ bạn yêu thích." action="Tiếp tục mua sắm" /> : <div className="cart-layout"><div className="cart-items">{items.map(({ product, quantity }) => <article className="cart-item" key={product.id} data-product-id={product.id}>
      <Link className="cart-item-image" href={`/products/${product.id}`}><img src={product.image} alt={product.name} onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} /></Link><div className="cart-item-info"><Link className="cart-item-name" href={`/products/${product.id}`}>{product.name}</Link><p className="cart-item-description">{product.description}</p><p className="cart-item-unit-price">{formatPrice(product.price)} / sản phẩm</p><button className="cart-remove" type="button" onClick={() => removeFromCart(product.id)}>Xóa</button></div><div className="cart-item-controls"><div className="quantity-picker" aria-label={`Số lượng ${product.name}`}><button className="quantity-btn" type="button" disabled={quantity <= 1} onClick={() => setQuantity(product.id, quantity - 1)}>−</button><span className="cart-quantity">{quantity}</span><button className="quantity-btn" type="button" disabled={quantity >= 99} onClick={() => setQuantity(product.id, quantity + 1)}>+</button></div><strong className="cart-item-total">{formatPrice(product.price * quantity)}</strong></div>
    </article>)}</div><aside className="cart-summary"><h2 className="cart-summary-title">Tóm tắt đơn hàng</h2><div className="cart-summary-row"><span>Tạm tính ({count} sản phẩm)</span><strong>{formatPrice(total)}</strong></div><div className="cart-summary-row"><span>Phí vận chuyển</span><span>Tính khi thanh toán</span></div><div className="cart-summary-total"><span>Tổng cộng</span><strong>{formatPrice(total)}</strong></div><Link className="btn btn-primary-blue cart-checkout" href="/checkout">Tiến hành đặt hàng</Link><Link className="cart-continue" href="/products">Tiếp tục mua sắm</Link></aside></div>}
  </section></main>;
}
