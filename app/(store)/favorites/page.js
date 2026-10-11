"use client";

import { Breadcrumbs, EmptyState, ProductCard } from "../../../components/common";
import { useStore } from "../../../components/store-provider";
import { useCatalog } from "../../../lib/catalog";

export default function FavoritesPage() {
  const { wishlist, ready, toggleWishlist } = useStore();
  const { products: catalog, loading, error } = useCatalog();
  const products = wishlist
    .map((id) => catalog.find((product) => String(product.id) === String(id)))
    .filter(Boolean);
  const unavailableIds = wishlist.filter((id) =>
    !catalog.some((product) => String(product.id) === String(id))
  );

  return (
    <main className="container favorites-page">
      <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Yêu thích" }]} />
      <section>
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Sản phẩm yêu thích</h1>
            <p className="page-subtitle">{products.length} sản phẩm đã lưu</p>
          </div>
        </div>
        {error ? <p className="page-subtitle" role="alert">Không thể tải sản phẩm yêu thích: {error}</p>
          : loading || !ready ? <p className="page-subtitle">Đang tải sản phẩm yêu thích...</p>
            : <>
              {unavailableIds.length > 0 && (
                <div className="checkout-error" role="status">
                  <p>{unavailableIds.length} sản phẩm đã lưu không còn được bán.</p>
                  {unavailableIds.map((id) => (
                    <p key={id}>
                      Sản phẩm #{id}{" "}
                      <button className="cart-remove" type="button" onClick={() => toggleWishlist(id)}>
                        Xóa khỏi yêu thích
                      </button>
                    </p>
                  ))}
                </div>
              )}
              {products.length
                ? <div className="product-list-grid favorites-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
                : <div className="favorites-grid is-empty"><EmptyState icon="♡" title="Chưa có sản phẩm yêu thích" text="Bấm vào biểu tượng trái tim trên sản phẩm để lưu lại tại đây." action="Khám phá sản phẩm" /></div>}
            </>}
      </section>
    </main>
  );
}
