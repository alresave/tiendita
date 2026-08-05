-- Carritos aislados por el identificador de sesión enviado por el cliente.
CREATE OR REPLACE FUNCTION public.current_cart_session_id()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('request.headers', true)::jsonb ->> 'x-session-id', '');
$$;

CREATE OR REPLACE FUNCTION public.can_access_cart(target_cart_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = target_cart_id AND session_id = public.current_cart_session_id()
  );
$$;

DROP POLICY IF EXISTS "Permitir acceso a carritos por sesión o usuario" ON public.carts;
CREATE POLICY "Sesión administra su carrito" ON public.carts FOR ALL TO anon, authenticated
  USING (session_id = public.current_cart_session_id())
  WITH CHECK (session_id = public.current_cart_session_id());

DROP POLICY IF EXISTS "Permitir acceso a items del carrito" ON public.cart_items;
CREATE POLICY "Sesión administra partidas de su carrito" ON public.cart_items FOR ALL TO anon, authenticated
  USING (public.can_access_cart(cart_id))
  WITH CHECK (public.can_access_cart(cart_id));

-- Operación transaccional: o se crea el pedido, descuenta stock y vacía el
-- carrito completo, o PostgreSQL revierte todo ante cualquier error.
CREATE OR REPLACE FUNCTION public.process_checkout(
  p_cart_id UUID,
  p_session_id TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_product products%ROWTYPE;
  v_order_id UUID;
  v_order_number TEXT := 'ORD-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || upper(substr(md5(random()::text), 1, 5));
  v_product_id UUID;
  v_quantity INTEGER;
  v_subtotal NUMERIC(10, 2) := 0;
  v_shipping NUMERIC(10, 2);
BEGIN
  IF p_cart_id IS NULL OR p_session_id IS NULL OR p_session_id = '' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Carrito inválido.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM carts WHERE id = p_cart_id AND session_id = p_session_id) THEN
    RAISE EXCEPTION 'No tienes acceso a este carrito.';
  END IF;

  INSERT INTO orders (order_number, subtotal, shipping, total)
  VALUES (v_order_number, 0, 0, 0) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item ->> 'productId')::UUID;
    v_quantity := (v_item ->> 'quantity')::INTEGER;
    IF v_quantity IS NULL OR v_quantity < 1 THEN RAISE EXCEPTION 'Cantidad inválida.'; END IF;

    SELECT * INTO v_product FROM products WHERE id = v_product_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Producto no encontrado.'; END IF;
    IF v_product.stock < v_quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para %.', v_product.name;
    END IF;

    UPDATE products SET stock = stock - v_quantity WHERE id = v_product_id;
    INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
    VALUES (v_order_id, v_product_id, v_product.name, v_product.price, v_quantity);
    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  END LOOP;

  v_shipping := CASE WHEN v_subtotal >= 500 THEN 0 ELSE 15 END;
  UPDATE orders SET subtotal = v_subtotal, shipping = v_shipping, total = v_subtotal + v_shipping WHERE id = v_order_id;
  DELETE FROM cart_items WHERE cart_id = p_cart_id;
  RETURN jsonb_build_object('success', true, 'orderId', v_order_number);
END;
$$;

REVOKE ALL ON FUNCTION public.process_checkout(UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_checkout(UUID, TEXT, JSONB) TO service_role;
