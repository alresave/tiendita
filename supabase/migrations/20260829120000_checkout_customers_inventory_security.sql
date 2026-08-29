-- Entrega de checkout, clientes, inventario y auditoría.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_note TEXT,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.checkout_rate_limits (
  bucket TEXT PRIMARY KEY,
  requests INTEGER NOT NULL DEFAULT 1,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_created ON public.inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

DROP POLICY IF EXISTS "Cliente consulta sus pedidos" ON public.orders;
CREATE POLICY "Cliente consulta sus pedidos" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Cliente consulta partidas de sus pedidos" ON public.order_items;
CREATE POLICY "Cliente consulta partidas de sus pedidos" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs(actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), lower(TG_OP), TG_TABLE_NAME, COALESCE(NEW.id, OLD.id)::text,
    jsonb_build_object('before', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
                       'after', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_inventory_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_reason TEXT;
BEGIN
  IF NEW.stock IS DISTINCT FROM OLD.stock THEN
    v_reason := COALESCE(current_setting('app.inventory_reason', true), 'Ajuste administrativo');
    INSERT INTO public.inventory_movements(product_id, delta, reason, created_by)
    VALUES (NEW.id, NEW.stock - OLD.stock, v_reason, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_products ON public.products;
CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
DROP TRIGGER IF EXISTS audit_orders ON public.orders;
CREATE TRIGGER audit_orders AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
DROP TRIGGER IF EXISTS inventory_product_changes ON public.products;
CREATE TRIGGER inventory_product_changes AFTER UPDATE OF stock ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.record_inventory_movement();

CREATE OR REPLACE FUNCTION public.process_checkout_v2(
  p_cart_id UUID, p_session_id TEXT, p_customer_name TEXT, p_customer_email TEXT,
  p_customer_phone TEXT, p_shipping_address JSONB, p_customer_note TEXT,
  p_user_id UUID DEFAULT NULL, p_rate_key TEXT DEFAULT 'anonymous'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item RECORD; v_product products%ROWTYPE; v_order_id UUID;
  v_order_number TEXT := 'ORD-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || upper(substr(md5(random()::text), 1, 5));
  v_subtotal NUMERIC(10,2) := 0; v_shipping NUMERIC(10,2); v_limit checkout_rate_limits%ROWTYPE;
BEGIN
  IF p_cart_id IS NULL OR nullif(trim(p_session_id), '') IS NULL OR nullif(trim(p_customer_name), '') IS NULL
    OR nullif(trim(p_customer_email), '') IS NULL OR nullif(trim(p_customer_phone), '') IS NULL
    OR p_shipping_address IS NULL OR nullif(trim(p_shipping_address->>'line1'), '') IS NULL
    OR nullif(trim(p_shipping_address->>'city'), '') IS NULL OR nullif(trim(p_shipping_address->>'postal_code'), '') IS NULL THEN
    RAISE EXCEPTION 'Completa tus datos de contacto y dirección de envío.';
  END IF;
  INSERT INTO public.checkout_rate_limits(bucket) VALUES (left(coalesce(p_rate_key, 'anonymous'), 160))
  ON CONFLICT (bucket) DO UPDATE SET requests = CASE WHEN checkout_rate_limits.window_started_at < now() - interval '10 minutes' THEN 1 ELSE checkout_rate_limits.requests + 1 END,
    window_started_at = CASE WHEN checkout_rate_limits.window_started_at < now() - interval '10 minutes' THEN now() ELSE checkout_rate_limits.window_started_at END
  RETURNING * INTO v_limit;
  IF v_limit.requests > 8 THEN RAISE EXCEPTION 'Demasiados intentos. Espera unos minutos antes de volver a intentar.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.carts WHERE id = p_cart_id AND session_id = p_session_id) THEN RAISE EXCEPTION 'No tienes acceso a este carrito.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = p_cart_id) THEN RAISE EXCEPTION 'Tu carrito está vacío.'; END IF;

  INSERT INTO public.orders (order_number, customer_email, customer_name, customer_phone, customer_note, user_id, shipping_address, subtotal, shipping, total)
  VALUES (v_order_number, trim(p_customer_email), trim(p_customer_name), trim(p_customer_phone), nullif(trim(p_customer_note), ''), p_user_id, p_shipping_address, 0, 0, 0) RETURNING id INTO v_order_id;
  FOR v_item IN SELECT product_id, quantity FROM public.cart_items WHERE cart_id = p_cart_id
  LOOP
    SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id AND is_active = true FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Un producto ya no está disponible.'; END IF;
    IF v_product.stock < v_item.quantity THEN RAISE EXCEPTION 'Stock insuficiente para %.', v_product.name; END IF;
    PERFORM set_config('app.inventory_reason', 'Venta ' || v_order_number, true);
    UPDATE public.products SET stock = stock - v_item.quantity WHERE id = v_product.id;
    INSERT INTO public.order_items(order_id, product_id, product_name, unit_price, quantity) VALUES (v_order_id, v_product.id, v_product.name, v_product.price, v_item.quantity);
    v_subtotal := v_subtotal + v_product.price * v_item.quantity;
  END LOOP;
  v_shipping := CASE WHEN v_subtotal >= 500 THEN 0 ELSE 15 END;
  UPDATE public.orders SET subtotal=v_subtotal, shipping=v_shipping, total=v_subtotal+v_shipping WHERE id=v_order_id;
  IF p_user_id IS NOT NULL THEN
    INSERT INTO public.customer_profiles(id, full_name, phone) VALUES (p_user_id, trim(p_customer_name), trim(p_customer_phone))
    ON CONFLICT (id) DO UPDATE SET full_name=EXCLUDED.full_name, phone=EXCLUDED.phone;
  END IF;
  DELETE FROM public.cart_items WHERE cart_id = p_cart_id;
  RETURN jsonb_build_object('success', true, 'orderId', v_order_number);
END;
$$;
REVOKE ALL ON FUNCTION public.process_checkout_v2(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_checkout_v2(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, UUID, TEXT) TO service_role;
