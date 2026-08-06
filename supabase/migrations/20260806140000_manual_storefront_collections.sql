-- Mini tiendas manuales: un producto puede aparecer en varias colecciones.
CREATE TABLE IF NOT EXISTS public.storefront_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(trim(name)) > 0),
  description TEXT NOT NULL DEFAULT '',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.collection_products (
  collection_id UUID NOT NULL REFERENCES public.storefront_collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id ON public.collection_products (product_id);
ALTER TABLE public.storefront_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública de mini tiendas" ON public.storefront_collections;
CREATE POLICY "Lectura pública de mini tiendas" ON public.storefront_collections FOR SELECT TO public USING (is_visible);
DROP POLICY IF EXISTS "Administradores gestionan mini tiendas" ON public.storefront_collections;
CREATE POLICY "Administradores gestionan mini tiendas" ON public.storefront_collections FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Lectura pública de productos de mini tiendas" ON public.collection_products;
CREATE POLICY "Lectura pública de productos de mini tiendas" ON public.collection_products FOR SELECT TO public USING (EXISTS (SELECT 1 FROM public.storefront_collections WHERE id = collection_id AND is_visible));
DROP POLICY IF EXISTS "Administradores gestionan productos de mini tiendas" ON public.collection_products;
CREATE POLICY "Administradores gestionan productos de mini tiendas" ON public.collection_products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
