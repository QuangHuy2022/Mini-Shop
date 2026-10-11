# Supabase Admin Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect admin product and order management, guest checkout, and every product-consuming customer page to the existing Supabase catalog while preserving the UI.

**Architecture:** Keep browser-safe catalog reads and image uploads on the publishable-key client under RLS. Use server-side, claim-verified actions for admin mutations, with matching database policies; use a narrowly scoped transactional checkout RPC for guest orders. Keep customer cart/wishlist IDs in localStorage and derive product details from the active Supabase catalog.

**Tech Stack:** Next.js 16 App Router, React 19, JavaScript, `@supabase/ssr`, `@supabase/supabase-js`, Node.js built-in test runner, Supabase Postgres and Storage.

**Spec:** [docs/superpowers/specs/2026-10-11-admin-supabase-design.md](../specs/2026-10-11-admin-supabase-design.md)

## Global Constraints

- Preserve the existing customer and admin visual design.
- Keep all application changes inside `mini-shop-next`; do not modify the original HTML/CSS/JavaScript project.
- Grant admin authority only from verified `app_metadata.role = "admin"`; never trust `user_metadata`.
- Never expose or add a service-role key to browser code.
- Public catalog reads include active products and categories only; order PII is admin-only.
- Archive products with `is_active = false`; do not hard-delete rows referenced by order history.
- Store uploaded files in public bucket `assets`, under `download/`, not in the deployed Next.js filesystem.
- Guest checkout accepts at most 20 distinct active products, each quantity 1–99; the database derives product names, prices, and totals.
- Only allow order transitions `pending → shipping → delivered`.
- Do not write production test products or orders; use mocks/unit tests and read-only remote configuration verification.
- Keep guest checkout without CAPTCHA or an external rate-limiting dependency in this iteration.
- Apply production SQL through Supabase MCP when available; otherwise only use the Dashboard SQL Editor after explicit user approval for that fallback.
- Report progress when each task below is completed; do not report a task complete until its verification succeeds.
- Do not create commits unless explicitly requested.

## Review Focus

- A browser-supplied price or archived product must never affect an order total; test the RPC request shape and domain validation in Task 1 and Task 5.
- A customer or stale/non-admin claim must not create/edit/archive products or read/update orders; test trusted-claim decisions in Task 1 and inspect RLS configuration in Task 2.
- A status jump or invalid transition must be rejected at both the action and data-policy boundaries; test the transition helper in Task 1 and verify policy definitions in Task 2.
- Invalid, oversized, or unsupported uploads must fail visibly without a product save; test upload validation in Task 3.
- The guest-order RPC is a narrowly scoped `SECURITY DEFINER` endpoint; review its fixed search path, fully qualified objects, input validation, and exact execute grants before applying it.
- Do not grant direct `orders.status` updates: PostgreSQL UPDATE policies cannot safely pair an old state and corresponding new state across permissive policies. Use an admin-claim-checked, atomic `set_store_order_status` RPC that allows only the exact next transition; admins can still read orders through RLS.
- Supabase failures must remain visible and must not be presented as successful saves; test error branches in Tasks 3–5.

---

### Task 1: Catalog and order domain rules

**Files:**
- Create: `lib/admin-domain.mjs`
- Create: `tests/admin-domain.test.mjs`
- Modify: `lib/catalog.js`

**Interfaces:**
- Produces `mapProductRow(row)`, mapping `id`, `name`, `price_vnd`, `category_id`, `description`, `image_path`, and `is_active` to the storefront shape `{ id, name, price, category, description, image, isActive }`.
- Produces `mapOrderRow(row)`, mapping order columns and nested `order_items` into `{ id, orderCode, customer: { name, phone, address }, status, items, total, createdAt }`.
- Produces `validateProductInput(input)`, rejecting missing/overlong names, invalid category, non-positive/non-integer VND price, blank/overlong description, or blank image path.
- Produces `isAllowedOrderTransition(currentStatus, nextStatus)`, true only for `pending → shipping` and `shipping → delivered`.
- Produces `validateProductImage(file)`, allowing JPEG/PNG/WebP only up to 6 MB, and `buildOrderRequest(customer, cart)`, returning customer fields plus `{ product_id, quantity }` items only (never browser prices/totals).
- Produces `getNextOrderStatus(status)`, returning `shipping`, `delivered`, or `null` for the valid current states.
- Produces `getOrderStatusLabel(status)` for the existing Vietnamese status labels, handling unknown values explicitly.

- [ ] **Step 1: Write failing Node tests** for product mapping, valid/invalid product inputs, image validation boundaries, order-request shape (no client price/total), nested order mapping, allowed/forbidden order transitions, next statuses, and status labels.
- [ ] **Step 2: Run `node --test tests/admin-domain.test.mjs`** and confirm failures correspond to the missing helpers/behavior.
- [ ] **Step 3: Implement the pure domain functions** and have `lib/catalog.js` use `mapProductRow` instead of duplicating the row conversion.
- [ ] **Step 4: Run `node --test tests/admin-domain.test.mjs`** and confirm every assertion passes.

### Task 2: Database policies, order RPC, and image bucket

**Files:**
- Create: `supabase/admin-integration.sql`
- Create: `supabase/verify-admin-integration.sql`

**Interfaces:**
- RPC: `public.place_store_order(p_customer_name text, p_customer_phone text, p_shipping_address text, p_items jsonb) returns jsonb`; each item is `{ "product_id": number, "quantity": number }`. Return the inserted order identity/code, customer fields, status, computed total, and item snapshots.
- RPC: `public.set_store_order_status(p_order_id bigint, p_next_status text) returns jsonb`; authenticated admins only, exact `pending → shipping` or `shipping → delivered` transition, one atomic conditional update.
- Storage bucket: `assets`, public object retrieval, upload folder `download/`.

- [ ] **Step 1: Write an idempotent setup script** that enables RLS on `categories`, `products`, `orders`, and `order_items`; revokes unnecessary direct grants; adds public category/active-product reads; grants only mutable product-column insert/update to admins; and limits order/order-item reads to admins.
- [ ] **Step 2: Keep direct order/order-item insert, update, and delete privileges revoked; perform status transitions only through the exact-transition admin RPC** because separate permissive UPDATE policies cannot correctly bind each old state to its matching new state.
- [ ] **Step 3: Add `place_store_order`** as a narrowly scoped `SECURITY DEFINER` function with a fixed search path and fully qualified objects, input length and phone checks, a non-empty JSON array capped at 20 distinct products, quantity bounds 1–99, active-product checks, overflow-safe database-derived totals, and atomic order/order-item insertion. Generate any required order code in a way compatible with the verified schema. Revoke function execution from `PUBLIC` and grant only to `anon` and `authenticated`.
- [ ] **Step 4: Ensure bucket `assets` is public and add an insert policy** restricted to authenticated admin claims and the first path folder `download`; disallow overwrite, update, and delete.
- [ ] **Step 5: Write read-only verification SQL** for RLS flags, policy/grant definitions, RPC execute grants, and bucket visibility/policies.
- [ ] **Step 6: Apply the reviewed setup script to project `lkccyduhwhvaqlclfjwu` through the Supabase MCP, or through the Dashboard SQL Editor only if explicitly approved**; do not insert/update/delete production rows.
- [ ] **Step 7: Run the read-only verification script** and confirm all four tables have RLS enabled and only the specified policies/grants are present.

### Task 3: Admin product data, actions, and images

**Files:**
- Create: `lib/supabase/admin.js`
- Create: `lib/product-assets.js`
- Create: `app/admin/products/actions.js`
- Create: `components/admin-products-manager.js`
- Modify: `app/admin/products/page.js`
- Modify: `app/globals.css`

**Interfaces:**
- `getAdminClient()` creates the cookie-backed server client, calls verified `auth.getClaims()`, and returns it only for `isAdminClaims(claims)`.
- Server actions: `createProduct(input)`, `updateProduct(id, input)`, and `archiveProduct(id)`; every action verifies claims, validates input, reports Supabase errors, and relies on RLS.
- `listProductAssets()` recursively returns web paths under `public/MiniShop_Assets/assets/images/products/`.
- Client manager receives `{ products, categories, assets }`; uploads through the browser client to `assets/download/<unique-name>` with no overwrite and stores `getPublicUrl(...).data.publicUrl` as `image_path`.

- [ ] **Step 1: Reuse Task 1's upload-boundary tests; add focused coverage for asset enumeration only if that behavior is extracted into a pure helper.**
- [ ] **Step 2: Implement `getAdminClient`, product asset enumeration, and the three RLS-backed product actions.** Verify claims in every action; archive by updating `is_active`.
- [ ] **Step 4: Convert `app/admin/products/page.js` to a server loader** that fetches products/categories and passes them plus the discovered asset paths to `AdminProductsManager`.
- [ ] **Step 5: Move form state into `components/admin-products-manager.js`**; use the existing confirmation dialog before archive, preserve search/edit behavior, and show upload progress/errors and image preview.
- [ ] **Step 6: Add only the necessary status/upload styles** in `app/globals.css`; verify the existing layout remains intact.
- [ ] **Step 7: Run focused tests, lint the changed files, and verify the page renders through the admin guard without any database test writes.**

### Task 4: Storefront catalog consistency and checkout persistence

**Files:**
- Modify: `app/(store)/products/[id]/page.js`
- Modify: `app/(store)/cart/page.js`
- Modify: `app/(store)/favorites/page.js`
- Modify: `app/(store)/checkout/page.js`
- Modify: `lib/catalog.js`
- Delete: `lib/orders-store.js`
- Modify: `lib/products.js` only as needed to retain shared category/fallback utilities without serving hard-coded products to customer pages.

**Interfaces:**
- Customer pages consume `useCatalog()` and derive products from active Supabase catalog rows.
- Checkout calls `supabase.rpc("place_store_order", { p_customer_name, p_customer_phone, p_shipping_address, p_items })`; it sends product IDs and quantities only, and displays the returned database order and computed total.

- [ ] **Step 1: Reuse Task 1's checkout request-shape test** for `buildOrderRequest(customer, cart)`, asserting that client totals/prices are not sent and the cart is reduced to product IDs and quantities.
- [ ] **Step 2: Confirm the request-shape test passes before wiring the RPC into checkout.**
- [ ] **Step 3: Make product detail, cart, and favorites resolve IDs through the current active `useCatalog()` result**, including clear loading/error/empty/unavailable states for archived or missing cart items.
- [ ] **Step 4: Replace checkout’s hard-coded product mapping/local `addOrder` write** with live catalog data and the transactional RPC; show a success state only after Supabase confirms the saved order.
- [ ] **Step 5: Remove `lib/orders-store.js` and all imports** once admin pages no longer depend on localStorage order records.
- [ ] **Step 6: Run the focused test and verify customer pages still preserve their existing cart and wishlist ID storage.**

### Task 5: Live admin orders and overview

**Files:**
- Create: `app/admin/orders/actions.js`
- Create: `components/admin-orders-manager.js`
- Modify: `app/admin/orders/page.js`
- Modify: `app/admin/page.js`
- Modify: `components/common.js`
- Modify: `lib/products.js`
- Modify: `README.md`

**Interfaces:**
- `setOrderStatus(id, nextStatus)` verifies admin claims, reads current status, checks `isAllowedOrderTransition`, and updates only `orders.status`; RLS independently enforces the same transition.
- Admin order loader queries orders with nested `order_items`, orders newest first, and maps with `mapOrderRow`.
- The dashboard derives product/category counts, order count/revenue, recent orders, and recent products from Supabase data.

- [ ] **Step 1: Reuse Task 1's order-mapping, transition, and status-label tests** (pending displays “Mới”, shipping “Đang giao”, delivered “Đã giao”).
- [ ] **Step 2: Confirm those domain tests pass before wiring the order actions and UI.**
- [ ] **Step 3: Implement the admin-only order status action** with a compare-current-status update to reject stale concurrent transitions.
- [ ] **Step 4: Convert the order page to a server loader and interactive client manager**; retain search, display customer/item/total/date information, and expose only the next valid status action.
- [ ] **Step 5: Convert the dashboard from hard-coded products/localStorage orders to live database results** and replace the “Chế độ demo” label.
- [ ] **Step 6: Remove unused `PRODUCTS`/`CATEGORIES` static catalog exports and imports** after all customer/admin pages use Supabase; retain `formatPrice` and `FALLBACK_IMAGE`.
- [ ] **Step 7: Update README admin/checkout descriptions** and run focused tests without creating production orders.

### Task 6: End-to-end verification and documentation

**Files:**
- Modify: `README.md`
- Verify: all changed files from Tasks 1–5

- [ ] **Step 1: Run `npm test`** and confirm all Node tests pass.
- [ ] **Step 2: Run `npm run lint`**; confirm no errors and report any pre-existing warnings separately.
- [ ] **Step 3: Run `npm run build`** and confirm Next.js production compilation succeeds.
- [ ] **Step 4: Run read-only Supabase configuration verification**; do not create, edit, or delete production products/orders for testing.
- [ ] **Step 5: Review the final diff** to ensure no `.env` file, secret, old-project file, or unrelated user change was staged or altered.

## Execution handoff

- Recommended execution mode: implement natively in this session because the database policies, server actions, checkout RPC, and storefront all share contracts.
- The existing checkout contains unrelated uncommitted work that this implementation depends on. Preserve it; do not start from a clean `HEAD` worktree that would omit those changes.
- The user explicitly approved use of the Dashboard SQL Editor as a fallback when MCP execution is not available in this session.
- Before implementation, activate the applicable worktree, TDD, and Postgres best-practices skills, then inspect the current working-tree state and integrate without overwriting prior work.
- Complete and report one task at a time. If Supabase MCP SQL execution is unavailable, stop before applying Task 2 and ask for approval before switching to the Dashboard SQL Editor.
