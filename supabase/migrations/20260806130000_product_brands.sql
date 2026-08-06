-- Las marcas permiten agrupar productos en mini tiendas públicas.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products (brand) WHERE brand IS NOT NULL;
