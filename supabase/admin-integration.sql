BEGIN;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.categories, public.products, public.orders, public.order_items
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.categories TO anon, authenticated;
GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT INSERT (name, price_vnd, category_id, description, image_path, is_active)
  ON TABLE public.products TO authenticated;
GRANT UPDATE (name, price_vnd, category_id, description, image_path, is_active)
  ON TABLE public.products TO authenticated;
GRANT SELECT ON TABLE public.orders, public.order_items TO authenticated;

DROP POLICY IF EXISTS categories_storefront_read ON public.categories;
CREATE POLICY categories_storefront_read
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS products_storefront_active_read ON public.products;
CREATE POLICY products_storefront_active_read
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_active IS TRUE);

DROP POLICY IF EXISTS products_admin_read ON public.products;
CREATE POLICY products_admin_read
  ON public.products
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS products_admin_insert ON public.products;
CREATE POLICY products_admin_insert
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS products_admin_update ON public.products;
CREATE POLICY products_admin_update
  ON public.products
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS orders_admin_read ON public.orders;
CREATE POLICY orders_admin_read
  ON public.orders
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS order_items_admin_read ON public.order_items;
CREATE POLICY order_items_admin_read
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE OR REPLACE FUNCTION public.place_store_order(
  p_customer_name text,
  p_customer_phone text,
  p_shipping_address text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_customer_name text;
  v_customer_phone text;
  v_shipping_address text;
  v_phone_normalized text;
  v_item jsonb;
  v_product_id bigint;
  v_product_id_numeric numeric;
  v_quantity integer;
  v_quantity_numeric numeric;
  v_product record;
  v_seen_product_ids bigint[] := ARRAY[]::bigint[];
  v_total numeric := 0;
  v_line_total bigint;
  v_order_id bigint;
  v_order_code text;
  v_order_created_at timestamptz;
  v_items jsonb := '[]'::jsonb;
BEGIN
  v_customer_name := pg_catalog.btrim(p_customer_name);
  v_customer_phone := pg_catalog.btrim(p_customer_phone);
  v_shipping_address := pg_catalog.btrim(p_shipping_address);
  v_phone_normalized := pg_catalog.regexp_replace(v_customer_phone, '[[:space:]().-]', '', 'g');

  IF v_customer_name IS NULL OR pg_catalog.char_length(v_customer_name) NOT BETWEEN 2 AND 100 THEN
    RAISE EXCEPTION 'Tên khách hàng phải dài từ 2 đến 100 ký tự.'
      USING ERRCODE = '22023';
  END IF;

  IF v_phone_normalized IS NULL
    OR v_phone_normalized !~ '^(0[0-9]{9}|\+84[0-9]{9})$' THEN
    RAISE EXCEPTION 'Số điện thoại Việt Nam không hợp lệ.'
      USING ERRCODE = '22023';
  END IF;

  IF v_shipping_address IS NULL OR pg_catalog.char_length(v_shipping_address) NOT BETWEEN 8 AND 300 THEN
    RAISE EXCEPTION 'Địa chỉ nhận hàng phải dài từ 8 đến 300 ký tự.'
      USING ERRCODE = '22023';
  END IF;

  IF p_items IS NULL OR pg_catalog.jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Thông tin sản phẩm trong đơn hàng không hợp lệ.'
      USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.jsonb_array_length(p_items) NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'Đơn hàng phải có từ 1 đến 20 sản phẩm.'
      USING ERRCODE = '22023';
  END IF;

  FOR v_item IN SELECT elements.item FROM pg_catalog.jsonb_array_elements(p_items) AS elements(item)
  LOOP
    IF pg_catalog.jsonb_typeof(v_item) <> 'object'
      OR (v_item - 'product_id' - 'quantity') <> '{}'::jsonb
      OR pg_catalog.jsonb_typeof(v_item -> 'product_id') IS DISTINCT FROM 'number'
      OR pg_catalog.jsonb_typeof(v_item -> 'quantity') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'Thông tin sản phẩm trong đơn hàng không hợp lệ.'
        USING ERRCODE = '22023';
    END IF;

    v_product_id_numeric := (v_item ->> 'product_id')::numeric;
    v_quantity_numeric := (v_item ->> 'quantity')::numeric;
    IF v_product_id_numeric IS NULL
      OR v_quantity_numeric IS NULL
      OR v_product_id_numeric <> pg_catalog.trunc(v_product_id_numeric)
      OR v_product_id_numeric < 1
      OR v_product_id_numeric > 9223372036854775807
      OR v_quantity_numeric <> pg_catalog.trunc(v_quantity_numeric)
      OR v_quantity_numeric < 1
      OR v_quantity_numeric > 99 THEN
      RAISE EXCEPTION 'Mã hoặc số lượng sản phẩm không hợp lệ.'
        USING ERRCODE = '22023';
    END IF;

    v_product_id := v_product_id_numeric::bigint;
    v_quantity := v_quantity_numeric::integer;
    IF v_product_id = ANY (v_seen_product_ids) THEN
      RAISE EXCEPTION 'Không gửi trùng sản phẩm trong cùng một đơn hàng.'
        USING ERRCODE = '22023';
    END IF;
    v_seen_product_ids := pg_catalog.array_append(v_seen_product_ids, v_product_id);

    SELECT p.id, p.name, p.price_vnd
      INTO v_product
      FROM public.products AS p
      WHERE p.id = v_product_id
        AND p.is_active IS TRUE
      FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Một sản phẩm không còn được bán hoặc không tồn tại.'
        USING ERRCODE = '22023';
    END IF;

    IF v_product.price_vnd <= 0 THEN
      RAISE EXCEPTION 'Giá sản phẩm không hợp lệ.'
        USING ERRCODE = '22023';
    END IF;

    v_total := v_total + v_product.price_vnd::numeric * v_quantity;
    IF v_total > 9223372036854775807 THEN
      RAISE EXCEPTION 'Tổng đơn hàng vượt giới hạn lưu trữ.'
        USING ERRCODE = '22003';
    END IF;
    v_line_total := (v_product.price_vnd::numeric * v_quantity)::bigint;
    v_items := v_items || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'product_id', v_product.id,
        'product_name', v_product.name,
        'unit_price_vnd', v_product.price_vnd,
        'quantity', v_quantity,
        'line_total_vnd', v_line_total
      )
    );
  END LOOP;

  INSERT INTO public.orders (
    customer_name,
    customer_phone,
    shipping_address,
    status,
    total_vnd
  )
  VALUES (
    v_customer_name,
    v_phone_normalized,
    v_shipping_address,
    'pending',
    v_total::bigint
  )
  RETURNING id, created_at INTO v_order_id, v_order_created_at;

  v_order_code := 'MS-' || pg_catalog.to_char(v_order_created_at AT TIME ZONE 'UTC', 'YYYYMMDD')
    || '-' || pg_catalog.lpad(v_order_id::text, 6, '0');

  UPDATE public.orders AS o
    SET order_code = v_order_code
    WHERE o.id = v_order_id;

  INSERT INTO public.order_items (
    order_id,
    product_id,
    product_name,
    unit_price_vnd,
    quantity,
    line_total_vnd
  )
  SELECT
    v_order_id,
    (item ->> 'product_id')::bigint,
    item ->> 'product_name',
    (item ->> 'unit_price_vnd')::bigint,
    (item ->> 'quantity')::integer,
    (item ->> 'line_total_vnd')::bigint
  FROM pg_catalog.jsonb_array_elements(v_items) AS elements(item);

  RETURN pg_catalog.jsonb_build_object(
    'id', v_order_id,
    'order_code', v_order_code,
    'customer_name', v_customer_name,
    'customer_phone', v_phone_normalized,
    'shipping_address', v_shipping_address,
    'status', 'pending',
    'total_vnd', v_total::bigint,
    'created_at', v_order_created_at,
    'order_items', v_items
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_store_order_status(
  p_order_id bigint,
  p_next_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Không có quyền cập nhật trạng thái đơn hàng.'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.orders AS o
    SET status = p_next_status
    WHERE o.id = p_order_id
      AND (
        (o.status = 'pending' AND p_next_status = 'shipping')
        OR (o.status = 'shipping' AND p_next_status = 'delivered')
      )
  RETURNING o.* INTO v_order;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Đơn hàng không tồn tại hoặc trạng thái không thể chuyển tiếp.'
      USING ERRCODE = '22023';
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'id', v_order.id,
    'order_code', v_order.order_code,
    'status', v_order.status
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.place_store_order(text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_store_order(text, text, text, jsonb)
  TO anon, authenticated;
REVOKE ALL ON FUNCTION public.set_store_order_status(bigint, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_store_order_status(bigint, text)
  TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('assets', 'assets', true, 6291456, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS assets_admin_download_insert ON storage.objects;
CREATE POLICY assets_admin_download_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'assets'
    AND (storage.foldername(name))[1] = 'download'
    AND (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

COMMIT;
