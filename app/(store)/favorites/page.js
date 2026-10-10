"use client";

import { Breadcrumbs, EmptyState, ProductCard } from "../../../components/common";
import { useStore } from "../../../components/store-provider";
import { PRODUCTS } from "../../../lib/products";

export default function FavoritesPage() {
  const { wishlist, ready } = useStore();
  const products = wishlist.map((id) => PRODUCTS.find((product) => product.id === id)).filter(Boolean);
  return <main className="container favorites-page"><Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Yêu thích" }]} /><section><div className="page-title-row"><div><h1 className="page-title">Sản phẩm yêu thích</h1><p className="page-subtitle">{products.length} sản phẩm đã lưu</p></div></div>
    {!ready ? null : products.length ? <div className="product-list-grid favorites-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="favorites-grid is-empty"><EmptyState icon="♡" title="Chưa có sản phẩm yêu thích" text="Bấm vào biểu tượng trái tim trên sản phẩm để lưu lại tại đây." action="Khám phá sản phẩm" /> </div>}
  </section></main>;
}
