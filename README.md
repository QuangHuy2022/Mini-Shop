# Mini Shop

Mini Shop is a Next.js App Router storefront migrated from the original HTML, CSS, and JavaScript project. Product catalog data is loaded from Supabase; the original images remain in `public/MiniShop_Assets`.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Run checks and a production build:

```bash
npm test
npm run lint
npm run build
```

## Pages

- `/`: Home page.
- `/products` and `/products/[id]`: Catalog, filters, search, sorting, and product details.
- `/cart`, `/favorites`, `/checkout`: Cart, saved products, and checkout.
- `/login` and `/register`: Supabase Auth email/password authentication.
- `/admin`, `/admin/products`, `/admin/orders`: Admin-only dashboard, Supabase-backed product management, and order/status management.

## Supabase authentication

Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. Email confirmation behavior follows the Supabase project's Auth settings. User passwords are handled by Supabase Auth and are not stored in application tables or the storefront's local storage. The display name is kept in the Supabase Auth user metadata.

New signups are regular customer accounts by default. The admin pages verify the signed-in user's JWT on the server and allow access only when the trusted Supabase `app_metadata.role` is `admin`; user-editable metadata is not used to grant admin access. Unauthorized visitors are sent to login, and regular accounts return to the storefront after login.

## Products, checkout, and orders

The storefront reads active products and categories from Supabase. Product changes made by an admin are saved to the database; removing a product archives it (`is_active = false`) so it disappears from the storefront without breaking order history. Admins can choose an existing image from `public/MiniShop_Assets/assets/images/products/` or upload a JPEG, PNG, or WebP image (up to 6 MB) to the public `assets` Storage bucket.

Guest checkout submits customer details and product IDs/quantities to the `place_store_order` database function. Supabase checks active products and calculates authoritative prices and totals before saving the order and its item snapshots atomically. The admin order screen reads saved orders and advances statuses only from `pending` to `shipping` to `delivered`; dashboard counts, revenue, products, and recent orders are database-backed.
