import StoreProvider from "../components/store-provider";
import "./globals.css";

export const metadata = {
  title: "Mini Shop - Sống đẹp mỗi ngày",
  description: "Sản phẩm thủ công, đồ trang trí nội thất tinh tế cho tổ ấm của bạn.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
