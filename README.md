# Mini Shop

Mini Shop là cửa hàng demo được xây dựng bằng Next.js App Router, React và JavaScript. Giao diện được chuyển từ phiên bản HTML/CSS/JavaScript; hình ảnh cửa hàng được đặt trong `public/MiniShop_Assets`.

## Chạy cục bộ

```bash
npm install
npm run dev
```

Mở http://localhost:3000.

Kiểm tra production build:

```bash
npm run lint
npm run build
npm run start
```

## Các trang

- `/`: Trang chủ.
- `/products` và `/products/[id]`: Danh sách, lọc, tìm kiếm, sắp xếp và chi tiết sản phẩm.
- `/cart`, `/favorites`, `/checkout`: Giỏ hàng, sản phẩm yêu thích và đặt hàng demo.
- `/login`, `/register`: Tài khoản demo lưu trên trình duyệt.
- `/admin`, `/admin/products`, `/admin/orders`: Tổng quan và quản lý demo; các trang admin yêu cầu phiên quản trị.

Tài khoản quản trị dùng thử: `admin@minishop.vn` / `admin123`.

Đây là bản demo phía trình duyệt, chưa kết nối backend hoặc cổng thanh toán. Thay đổi danh mục sản phẩm ở trang admin chỉ tồn tại trong phiên trang hiện tại.
