const MAX_IMAGE_SIZE = 6 * 1024 * 1024;
const MAX_PRODUCT_NAME_LENGTH = 100;
const MAX_PRODUCT_DESCRIPTION_LENGTH = 180;
const MAX_IMAGE_PATH_LENGTH = 2048;
const ORDER_STATUS_LABELS = {
  pending: "Mới",
  shipping: "Đang giao",
  delivered: "Đã giao",
};

export function mapProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price_vnd),
    category: row.category_id,
    description: row.description,
    image: row.image_path,
    isActive: row.is_active === true,
  };
}

export function mapOrderRow(row) {
  if (!row || !Array.isArray(row.order_items)) {
    throw new TypeError("Dữ liệu đơn hàng hoặc danh sách sản phẩm không hợp lệ.");
  }

  return {
    id: row.id,
    orderCode: row.order_code,
    customer: {
      name: row.customer_name,
      phone: row.customer_phone,
      address: row.shipping_address,
    },
    status: row.status,
    items: row.order_items.map((item) => {
      const unitPrice = Number(item.unit_price_vnd);
      const quantity = Number(item.quantity);
      return {
        productId: item.product_id,
        name: item.product_name,
        unitPrice,
        quantity,
        lineTotal: item.line_total_vnd == null
          ? unitPrice * quantity
          : Number(item.line_total_vnd),
      };
    }),
    total: Number(row.total_vnd),
    createdAt: row.created_at,
  };
}

export function validateProductInput(input) {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Thông tin sản phẩm không hợp lệ." };
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length < 2 || name.length > MAX_PRODUCT_NAME_LENGTH) {
    return { success: false, error: "Tên sản phẩm phải dài từ 2 đến 100 ký tự." };
  }

  const categoryId = typeof input.category_id === "string"
    ? input.category_id.trim()
    : "";
  if (!categoryId) {
    return { success: false, error: "Vui lòng chọn danh mục hợp lệ." };
  }

  const price = typeof input.price_vnd === "number" || typeof input.price_vnd === "string"
    ? Number(input.price_vnd)
    : NaN;
  if (!Number.isSafeInteger(price) || price <= 0) {
    return { success: false, error: "Giá sản phẩm phải là số nguyên VND lớn hơn 0." };
  }

  const description = typeof input.description === "string"
    ? input.description.trim()
    : "";
  if (!description || description.length > MAX_PRODUCT_DESCRIPTION_LENGTH) {
    return { success: false, error: "Mô tả sản phẩm phải dài từ 1 đến 180 ký tự." };
  }

  const imagePath = typeof input.image_path === "string"
    ? input.image_path.trim()
    : "";
  if (!imagePath || imagePath.length > MAX_IMAGE_PATH_LENGTH) {
    return { success: false, error: "Vui lòng chọn ảnh sản phẩm hợp lệ." };
  }

  return {
    success: true,
    data: {
      name,
      category_id: categoryId,
      price_vnd: price,
      description,
      image_path: imagePath,
    },
  };
}

export function validateProductImage(file) {
  const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (
    !file
    || typeof file.type !== "string"
    || !supportedTypes.has(file.type.toLowerCase())
    || !Number.isSafeInteger(file.size)
    || file.size <= 0
    || file.size > MAX_IMAGE_SIZE
  ) {
    return {
      success: false,
      error: "Ảnh phải là JPEG, PNG hoặc WebP và không vượt quá 6 MB.",
    };
  }

  return { success: true };
}

export function buildOrderRequest(customer, cart) {
  if (
    !customer
    || typeof customer.name !== "string"
    || typeof customer.phone !== "string"
    || typeof customer.address !== "string"
    || !Array.isArray(cart)
    || cart.length === 0
    || cart.length > 20
  ) {
    throw new TypeError("Thông tin đặt hàng hoặc giỏ hàng không hợp lệ.");
  }

  const productIds = new Set();
  const items = cart.map((item) => {
    const productId = item?.productId;
    const quantity = item?.quantity;
    if (
      !Number.isSafeInteger(productId)
      || productId <= 0
      || !Number.isInteger(quantity)
      || quantity < 1
      || quantity > 99
      || productIds.has(productId)
    ) {
      throw new TypeError("Giỏ hàng chứa sản phẩm hoặc số lượng không hợp lệ.");
    }
    productIds.add(productId);
    return { product_id: productId, quantity };
  });

  return {
    p_customer_name: customer.name.trim(),
    p_customer_phone: customer.phone.trim(),
    p_shipping_address: customer.address.trim(),
    p_items: items,
  };
}

export function isAllowedOrderTransition(currentStatus, nextStatus) {
  return (currentStatus === "pending" && nextStatus === "shipping")
    || (currentStatus === "shipping" && nextStatus === "delivered");
}

export function getNextOrderStatus(status) {
  if (status === "pending") return "shipping";
  if (status === "shipping") return "delivered";
  return null;
}

export function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] ?? "Không xác định";
}
