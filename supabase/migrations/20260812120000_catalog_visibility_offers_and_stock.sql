-- Mejoras de catálogo: visibilidad, ofertas y umbrales por producto.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS previous_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_previous_price_nonnegative,
  DROP CONSTRAINT IF EXISTS products_low_stock_threshold_nonnegative;

ALTER TABLE public.products
  ADD CONSTRAINT products_previous_price_nonnegative CHECK (previous_price IS NULL OR previous_price >= 0),
  ADD CONSTRAINT products_low_stock_threshold_nonnegative CHECK (low_stock_threshold >= 0);

CREATE INDEX IF NOT EXISTS idx_products_active ON public.products (is_active) WHERE is_active;

-- Mantiene el catálogo consistente cuando se cambia el nombre de un departamento.
CREATE OR REPLACE FUNCTION public.propagate_category_rename()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.products SET category = NEW.name WHERE category = OLD.name;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS propagate_category_rename ON public.categories;
CREATE TRIGGER propagate_category_rename
  AFTER UPDATE OF name ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.propagate_category_rename();
