import Link from "next/link";
import { mapOrderRow } from "../../lib/admin-domain.mjs";
import { formatPrice } from "../../lib/products";
import { getAdminClient } from "../../lib/supabase/admin";

const DASHBOARD_PAGE_SIZE = 500;

async function loadOrderTotals(supabase) {
  const rows = [];
  for (let offset = 0; ; offset += DASHBOARD_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("orders")
      .select("id,total_vnd,created_at")
      .order("id", { ascending: true })
      .range(offset, offset + DASHBOARD_PAGE_SIZE - 1);
    if (error) return { data: null, error };
    rows.push(...data);
    if (data.length < DASHBOARD_PAGE_SIZE) return { data: rows, error: null };
  }
}

export default async function AdminDashboardPage() {
  const supabase = await getAdminClient();
  const [productResult, categoryResult, recentProductResult, recentOrderResult, orderTotalsResult] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("categories").select("id,name,icon,sort_order").order("sort_order"),
    supabase.from("products").select("id,name,price_vnd,category_id,description,image_path,is_active").eq("is_active", true).order("id").limit(5),
    supabase
      .from("orders")
      .select("id,order_code,customer_name,customer_phone,shipping_address,status,total_vnd,created_at,order_items(product_id,product_name,unit_price_vnd,quantity,line_total_vnd)")
      .order("created_at", { ascending: false })
      .limit(5),
    loadOrderTotals(supabase),
  ]);

  const queryError = productResult.error
    || categoryResult.error
    || recentProductResult.error
    || recentOrderResult.error
    || orderTotalsResult.error;
  if (queryError) {
    console.error("Không thể tải số liệu tổng quan quản trị:", queryError.message);
    return <section><div className="admin-heading"><div><p className="admin-eyebrow">BẢNG ĐIỀU KHIỂN</p><h1 className="page-title">Tổng quan</h1></div></div><p className="admin-product-message error" role="alert">Không thể tải số liệu tổng quan từ kho dữ liệu.</p></section>;
  }

  const categories = categoryResult.data || [];
  const products = recentProductResult.data || [];
  const orders = (recentOrderResult.data || []).map(mapOrderRow);
  const orderTotals = orderTotalsResult.data || [];
  const revenue = orderTotals.reduce((sum, order) => sum + Number(order.total_vnd), 0);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const sales = orderTotals.reduce((sum, order) => {
      const orderDate = new Date(order.created_at);
      return sum + (!Number.isNaN(orderDate.getTime()) && orderDate.toDateString() === date.toDateString() ? Number(order.total_vnd) : 0);
    }, 0);
    return { date, sales };
  });
  const maxSales = Math.max(1, ...days.map((day) => day.sales));

  return (
    <section>
      <div className="admin-heading">
        <div>
          <p className="admin-eyebrow">BẢNG ĐIỀU KHIỂN</p>
          <h1 className="page-title">Tổng quan</h1>
          <p className="page-subtitle">Chào mừng đến với Mini Shop.</p>
        </div>
        <Link className="btn btn-primary-blue" href="/products">Xem cửa hàng</Link>
      </div>
      <div className="admin-stats">
        <article className="admin-stat-card"><span>Tổng sản phẩm</span><strong>{productResult.count || 0}</strong><small>Đang bán trong cửa hàng</small></article>
        <article className="admin-stat-card"><span>Danh mục</span><strong>{categories.length}</strong><small>Nhóm sản phẩm</small></article>
        <article className="admin-stat-card"><span>Đơn hàng</span><strong>{orderTotals.length}</strong><small>Đã ghi nhận</small></article>
        <article className="admin-stat-card"><span>Doanh thu đơn hàng</span><strong>{formatPrice(revenue)}</strong><small>Từ tất cả đơn hàng đã đặt</small></article>
      </div>
      <div className="admin-dashboard-grid">
        <section className="admin-panel">
          <div className="admin-panel-heading"><h2>Tổng quan đơn hàng</h2><span className="admin-demo-label">Theo đơn đã ghi nhận</span></div>
          <div className="admin-sales-chart">
            {days.map(({ date, sales }) => (
              <div className="admin-chart-column" key={date.toISOString()}>
                <div className="admin-chart-bar" style={{ height: `${Math.max(4, sales / maxSales * 100)}%` }} title={formatPrice(sales)} />
                <small>{sales ? formatPrice(sales) : "0đ"}</small>
                <span>{date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>
              </div>
            ))}
          </div>
          <p className="admin-chart-note">Doanh thu phân bổ theo 7 ngày gần nhất.</p>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-heading"><h2>Sản phẩm</h2><Link href="/admin/products">Quản lý</Link></div>
          <div className="admin-table-wrap">
            <table className="admin-orders-table">
              <thead><tr><th>Sản phẩm</th><th>Giá</th><th>Danh mục</th></tr></thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td><img className="admin-table-product-image" src={product.image_path} alt="" />{product.name}</td>
                    <td>{formatPrice(product.price_vnd)}</td>
                    <td>{categories.find((category) => category.id === product.category_id)?.name || "Khác"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <section className="admin-panel admin-dashboard-orders">
        <div className="admin-panel-heading"><h2>Đơn hàng gần đây</h2><Link href="/admin/orders">Xem tất cả</Link></div>
        <div className="admin-table-wrap">
          <table className="admin-orders-table">
            <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Số lượng</th><th>Tổng tiền</th><th>Ngày đặt</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderCode || `MS-${order.id}`}</td>
                  <td>{order.customer.name}</td>
                  <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td>{formatPrice(order.total)}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!orders.length && <p className="admin-empty">Chưa có đơn hàng nào được ghi nhận.</p>}
      </section>
    </section>
  );
}
