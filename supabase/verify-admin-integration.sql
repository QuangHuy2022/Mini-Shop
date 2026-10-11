SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class AS c
WHERE c.relnamespace = 'public'::pg_catalog.regnamespace
  AND c.relname IN ('categories', 'products', 'orders', 'order_items')
ORDER BY c.relname;

SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_catalog.pg_policies
WHERE (schemaname = 'public' AND tablename IN ('categories', 'products', 'orders', 'order_items'))
   OR (schemaname = 'storage' AND tablename = 'objects' AND policyname = 'assets_admin_download_insert')
ORDER BY schemaname, tablename, policyname;

SELECT
  has_table_privilege('anon', 'public.categories', 'SELECT') AS anon_can_read_categories,
  has_table_privilege('anon', 'public.products', 'SELECT') AS anon_can_read_products,
  has_table_privilege('anon', 'public.products', 'INSERT') AS anon_can_insert_products,
  has_column_privilege('authenticated', 'public.products', 'name', 'INSERT') AS authenticated_can_insert_product_name,
  has_column_privilege('authenticated', 'public.products', 'id', 'INSERT') AS authenticated_can_insert_product_id,
  has_table_privilege('anon', 'public.orders', 'SELECT') AS anon_can_read_orders,
  has_table_privilege('authenticated', 'public.orders', 'SELECT') AS authenticated_can_read_orders,
  has_column_privilege('authenticated', 'public.orders', 'status', 'UPDATE') AS authenticated_can_directly_update_order_status,
  has_table_privilege('anon', 'public.order_items', 'SELECT') AS anon_can_read_order_items,
  has_table_privilege('authenticated', 'public.order_items', 'SELECT') AS authenticated_can_read_order_items;

SELECT
  p.proname,
  pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  p.proconfig AS function_settings,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('place_store_order', 'set_store_order_status')
ORDER BY p.proname;

SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'assets';
