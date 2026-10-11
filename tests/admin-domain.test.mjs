import assert from "node:assert/strict";
import test from "node:test";

const domainModule = await import("../lib/admin-domain.mjs").catch((error) => {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
  return null;
});

const {
  buildOrderRequest,
  getNextOrderStatus,
  getOrderStatusLabel,
  isAllowedOrderTransition,
  mapOrderRow,
  mapProductRow,
  validateProductImage,
  validateProductInput,
} = domainModule ?? {};

function assertFunction(name, value) {
  assert.equal(typeof value, "function", `admin-domain must export ${name}`);
}

test("maps database product columns to the storefront product shape", () => {
  assertFunction("mapProductRow", mapProductRow);
  assert.deepEqual(
    mapProductRow({
      id: 42,
      name: "Oak chair",
      price_vnd: "1250000",
      category_id: "noi-that",
      description: "Solid oak",
      image_path: "/MiniShop_Assets/chair.webp",
      is_active: true,
    }),
    {
      id: 42,
      name: "Oak chair",
      price: 1250000,
      category: "noi-that",
      description: "Solid oak",
      image: "/MiniShop_Assets/chair.webp",
      isActive: true,
    }
  );
});

test("normalizes valid product input to the database write shape", () => {
  assertFunction("validateProductInput", validateProductInput);
  assert.deepEqual(
    validateProductInput({
      name: "  Oak chair ",
      category_id: "noi-that",
      price_vnd: "1250000",
      description: " Solid oak ",
      image_path: "/MiniShop_Assets/chair.webp",
    }),
    {
      success: true,
      data: {
        name: "Oak chair",
        category_id: "noi-that",
        price_vnd: 1250000,
        description: "Solid oak",
        image_path: "/MiniShop_Assets/chair.webp",
      },
    }
  );
});

test("rejects invalid product fields with an explicit validation error", () => {
  assertFunction("validateProductInput", validateProductInput);
  const validInput = {
    name: "Oak chair",
    category_id: "noi-that",
    price_vnd: 1250000,
    description: "Solid oak",
    image_path: "/MiniShop_Assets/chair.webp",
  };

  for (const invalidInput of [
    { ...validInput, name: " " },
    { ...validInput, name: "x".repeat(101) },
    { ...validInput, category_id: "" },
    { ...validInput, price_vnd: 0 },
    { ...validInput, price_vnd: 1250000.5 },
    { ...validInput, description: " " },
    { ...validInput, description: "x".repeat(181) },
    { ...validInput, image_path: "" },
  ]) {
    const result = validateProductInput(invalidInput);
    assert.equal(result.success, false);
    assert.equal(typeof result.error, "string");
    assert.ok(result.error.length > 0);
  }
});

test("accepts only JPEG, PNG, and WebP images up to 6 MiB", () => {
  assertFunction("validateProductImage", validateProductImage);
  for (const type of ["image/jpeg", "image/png", "image/webp"]) {
    assert.equal(validateProductImage({ type, size: 6 * 1024 * 1024 }).success, true);
  }
  for (const file of [
    { type: "image/svg+xml", size: 1024 },
    { type: "image/jpeg", size: 6 * 1024 * 1024 + 1 },
    { type: "", size: 1024 },
    null,
  ]) {
    const result = validateProductImage(file);
    assert.equal(result.success, false);
    assert.equal(typeof result.error, "string");
    assert.ok(result.error.length > 0);
  }
});

test("builds a checkout RPC request from customer data and cart IDs only", () => {
  assertFunction("buildOrderRequest", buildOrderRequest);
  assert.deepEqual(
    buildOrderRequest(
      { name: "Mai Lan", phone: "0912345678", address: "12 Nguyen Hue, HCMC" },
      [
        { productId: 7, quantity: 2, price: 990000, total: 1980000 },
        { productId: 12, quantity: 1, price: 250000, name: "Untrusted name" },
      ]
    ),
    {
      p_customer_name: "Mai Lan",
      p_customer_phone: "0912345678",
      p_shipping_address: "12 Nguyen Hue, HCMC",
      p_items: [
        { product_id: 7, quantity: 2 },
        { product_id: 12, quantity: 1 },
      ],
    }
  );
});

test("maps an order and its item snapshots to the admin order shape", () => {
  assertFunction("mapOrderRow", mapOrderRow);
  assert.deepEqual(
    mapOrderRow({
      id: 23,
      order_code: "MS-20261011-0023",
      customer_name: "Mai Lan",
      customer_phone: "0912345678",
      shipping_address: "12 Nguyen Hue, HCMC",
      status: "pending",
      total_vnd: "2500000",
      created_at: "2026-10-11T10:00:00.000Z",
      order_items: [
        {
          product_id: 7,
          product_name: "Oak chair",
          unit_price_vnd: "1250000",
          quantity: 2,
          line_total_vnd: "2500000",
        },
      ],
    }),
    {
      id: 23,
      orderCode: "MS-20261011-0023",
      customer: {
        name: "Mai Lan",
        phone: "0912345678",
        address: "12 Nguyen Hue, HCMC",
      },
      status: "pending",
      items: [
        {
          productId: 7,
          name: "Oak chair",
          unitPrice: 1250000,
          quantity: 2,
          lineTotal: 2500000,
        },
      ],
      total: 2500000,
      createdAt: "2026-10-11T10:00:00.000Z",
    }
  );
});

test("rejects malformed checkout cart IDs, quantities, duplicates, and oversized carts", () => {
  assertFunction("buildOrderRequest", buildOrderRequest);
  const customer = { name: "Mai Lan", phone: "0912345678", address: "12 Nguyen Hue, HCMC" };
  for (const cart of [
    [{ productId: 7, quantity: 0 }],
    [{ productId: 7, quantity: 100 }],
    [{ productId: "not-an-id", quantity: 1 }],
    [{ productId: 7, quantity: 1 }, { productId: 7, quantity: 2 }],
    Array.from({ length: 21 }, (_, index) => ({ productId: index + 1, quantity: 1 })),
  ]) {
    assert.throws(() => buildOrderRequest(customer, cart), TypeError);
  }
});

test("allows only the next order status transition", () => {
  assertFunction("isAllowedOrderTransition", isAllowedOrderTransition);
  assert.equal(isAllowedOrderTransition("pending", "shipping"), true);
  assert.equal(isAllowedOrderTransition("shipping", "delivered"), true);
  assert.equal(isAllowedOrderTransition("pending", "delivered"), false);
  assert.equal(isAllowedOrderTransition("delivered", "shipping"), false);
  assert.equal(isAllowedOrderTransition("unknown", "shipping"), false);
});

test("returns only the next valid order status", () => {
  assertFunction("getNextOrderStatus", getNextOrderStatus);
  assert.equal(getNextOrderStatus("pending"), "shipping");
  assert.equal(getNextOrderStatus("shipping"), "delivered");
  assert.equal(getNextOrderStatus("delivered"), null);
  assert.equal(getNextOrderStatus("unknown"), null);
});

test("maps known statuses to Vietnamese labels and identifies unknown values", () => {
  assertFunction("getOrderStatusLabel", getOrderStatusLabel);
  assert.equal(getOrderStatusLabel("pending"), "Mới");
  assert.equal(getOrderStatusLabel("shipping"), "Đang giao");
  assert.equal(getOrderStatusLabel("delivered"), "Đã giao");
  assert.equal(getOrderStatusLabel("unknown"), "Không xác định");
});
