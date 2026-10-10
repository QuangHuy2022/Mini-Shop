export const PRODUCTS = [
  { id: 1, name: "Sofa 2 chỗ Nordic", price: 2990000, category: "noi-that", description: "Thiết kế tối giản, êm ái", image: "/MiniShop_Assets/assets/images/products/noi-that-gia-dung/sofa-phong-khach.webp" },
  { id: 2, name: "Bàn ăn gỗ Sồi", price: 3490000, category: "noi-that", description: "Gỗ sồi tự nhiên, bền đẹp", image: "/MiniShop_Assets/assets/images/products/noi-that-gia-dung/bo-ban-an-go.webp" },
  { id: 3, name: "Đèn thả trần Minimal", price: 599000, category: "den", description: "Ánh sáng dịu nhẹ, tinh tế", image: "/MiniShop_Assets/assets/images/products/do-my-nghe/den-tre-thu-cong.webp" },
  { id: 4, name: "Bình gốm Decor", price: 290000, category: "trang-tri", description: "Gốm sứ cao cấp, trang nhã", image: "/MiniShop_Assets/assets/images/products/do-my-nghe/binh-gom-trang-tri.webp" },
  { id: 5, name: "Kệ gỗ đa năng", price: 1293000, category: "noi-that", description: "Tiết kiệm không gian", image: "/MiniShop_Assets/assets/images/products/noi-that-gia-dung/ke-go-trang-tri.webp" },
  { id: 6, name: "Giỏ mây lưu trữ", price: 199000, category: "luu-tru", description: "Thân thiện, tiện dụng", image: "/MiniShop_Assets/assets/images/products/do-thu-cong/gio-may-dan.webp" },
  { id: 7, name: "Tranh treo Macrame", price: 350000, category: "trang-tri", description: "Dệt thủ công tỉ mỉ phong cách Boho", image: "/MiniShop_Assets/assets/images/products/do-thu-cong/tranh-treo-macrame.webp" },
  { id: 8, name: "Chậu cây để bàn", price: 150000, category: "van-phong", description: "Trang trí bàn làm việc xanh mát", image: "/MiniShop_Assets/assets/images/products/noi-that-gia-dung/chau-cay-de-ban.webp" },
  { id: 9, name: "Khay gỗ hoa văn", price: 220000, category: "nha-bep", description: "Gỗ tự nhiên chạm khắc tinh xảo", image: "/MiniShop_Assets/assets/images/products/do-thu-cong/khay-go-hoa-van.webp" },
  { id: 10, name: "Bộ bình gốm Minimal", price: 450000, category: "trang-tri", description: "Set bình nghệ thuật đương đại", image: "/MiniShop_Assets/assets/images/products/do-my-nghe/bo-binh-gom-minimal.webp" },
];

export const CATEGORIES = [
  { id: "all", label: "Tất cả", icon: "▦" },
  { id: "noi-that", label: "Nội thất", icon: "▱" },
  { id: "trang-tri", label: "Trang trí", icon: "☆" },
  { id: "nha-bep", label: "Nhà bếp", icon: "♨" },
  { id: "den", label: "Đèn", icon: "◉" },
  { id: "van-phong", label: "Văn phòng", icon: "▤" },
  { id: "luu-tru", label: "Lưu trữ", icon: "◇" },
  { id: "khac", label: "Khác", icon: "⌑" },
];

export const formatPrice = (price) => `${Number(price).toLocaleString("vi-VN")}đ`;
export const FALLBACK_IMAGE = "/MiniShop_Assets/assets/images/products/San_pham/sofa-phong-khach-original.webp";
