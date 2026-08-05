-- Ejecuta este archivo en Supabase SQL Editor para actualizar una instalación existente.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General';

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(trim(name)) > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
INSERT INTO public.categories (name)
SELECT DISTINCT category FROM public.products WHERE category IS NOT NULL AND trim(category) <> ''
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de categorías" ON public.categories;
CREATE POLICY "Lectura pública de categorías" ON public.categories FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Administradores gestionan categorías" ON public.categories;
CREATE POLICY "Administradores gestionan categorías" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Administradores consultan pedidos" ON public.orders;
CREATE POLICY "Administradores consultan pedidos" ON public.orders FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Administradores actualizan pedidos" ON public.orders;
CREATE POLICY "Administradores actualizan pedidos" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Administradores consultan partidas de pedido" ON public.order_items;
CREATE POLICY "Administradores consultan partidas de pedido" ON public.order_items FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Administradores gestionan imágenes de producto" ON storage.objects;
CREATE POLICY "Administradores gestionan imágenes de producto" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
