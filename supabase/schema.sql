-- =================================================================
-- SCHEMA COMPLETO: Storefront e-Commerce (Products, Carts, Admin & RLS)
-- Base de Datos PostgreSQL / Supabase
-- =================================================================

-- 1. Habilitar extensión para UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear tabla `products`
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  previous_price NUMERIC(10, 2) CHECK (previous_price IS NULL OR previous_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  category TEXT NOT NULL DEFAULT 'General',
  brand TEXT,
  specs JSONB DEFAULT '{}'::jsonb,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Compatible con instalaciones creadas antes de que se añadiera la categoría.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS previous_price NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Roles de aplicación. Solo se asignan desde el Dashboard de Supabase o con la
-- service_role; el cliente nunca puede concederse permisos.
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.storefront_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.storefront_settings (key, value) VALUES
  ('theme', 'classic'),
  ('heroBadge', 'Diseño & Tecnología Premium'),
  ('heroTitle', 'Colección Exclusiva de Productos'),
  ('heroTagline', 'Piezas seleccionadas con materiales sostenibles, acústica afinada y acabados minimalistas para elevar tu espacio de trabajo.'),
  ('emptyTitle', 'No encontramos productos'),
  ('emptyDescription', 'Intenta cambiar los términos de búsqueda o selecciona otra categoría.'),
  ('emptyAction', 'Ver todos los productos')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(trim(name)) > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

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

INSERT INTO public.categories (name)
SELECT DISTINCT category FROM public.products WHERE category IS NOT NULL AND trim(category) <> ''
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Crear tabla `carts` (Soporte para sesiones de invitados via session_id y auth.users)
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Crear tabla `cart_items` (Items persistentes por carrito)
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_cart_product UNIQUE (cart_id, product_id)
);

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

-- 5. Crear índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products (brand) WHERE brand IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products (is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id ON public.collection_products (product_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_specs ON public.products USING gin(specs);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON public.carts(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 6. Habilitar Row Level Security (RLS) en todas las tablas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de RLS
-- A) Products: Lectura y Escritura (para gestión Admin)
DROP POLICY IF EXISTS "Permitir lectura pública de productos" ON public.products;
CREATE POLICY "Permitir lectura pública de productos"
  ON public.products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir escritura administrativa en productos" ON public.products;
DROP POLICY IF EXISTS "Los administradores gestionan productos" ON public.products;
CREATE POLICY "Los administradores gestionan productos"
  ON public.products FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Usuarios consultan su propio rol" ON public.user_roles;
CREATE POLICY "Usuarios consultan su propio rol"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Administradores consultan roles" ON public.user_roles;
CREATE POLICY "Administradores consultan roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Lectura pública de contenido de inicio" ON public.storefront_settings;
CREATE POLICY "Lectura pública de contenido de inicio" ON public.storefront_settings FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Administradores gestionan contenido de inicio" ON public.storefront_settings;
CREATE POLICY "Administradores gestionan contenido de inicio" ON public.storefront_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Lectura pública de categorías" ON public.categories;
CREATE POLICY "Lectura pública de categorías" ON public.categories FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Administradores gestionan categorías" ON public.categories;
CREATE POLICY "Administradores gestionan categorías" ON public.categories FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Lectura pública de mini tiendas" ON public.storefront_collections;
CREATE POLICY "Lectura pública de mini tiendas" ON public.storefront_collections FOR SELECT TO public USING (is_visible);
DROP POLICY IF EXISTS "Administradores gestionan mini tiendas" ON public.storefront_collections;
CREATE POLICY "Administradores gestionan mini tiendas" ON public.storefront_collections FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Lectura pública de productos de mini tiendas" ON public.collection_products;
CREATE POLICY "Lectura pública de productos de mini tiendas" ON public.collection_products FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.storefront_collections WHERE id = collection_id AND is_visible));
DROP POLICY IF EXISTS "Administradores gestionan productos de mini tiendas" ON public.collection_products;
CREATE POLICY "Administradores gestionan productos de mini tiendas" ON public.collection_products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Administradores consultan pedidos" ON public.orders;
CREATE POLICY "Administradores consultan pedidos" ON public.orders FOR SELECT TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS "Administradores actualizan pedidos" ON public.orders;
CREATE POLICY "Administradores actualizan pedidos" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Administradores consultan partidas de pedido" ON public.order_items;
CREATE POLICY "Administradores consultan partidas de pedido" ON public.order_items FOR SELECT TO authenticated
  USING (public.is_admin());

-- B) Carts & Cart Items
CREATE OR REPLACE FUNCTION public.current_cart_session_id()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('request.headers', true)::jsonb ->> 'x-session-id', '');
$$;

CREATE OR REPLACE FUNCTION public.can_access_cart(target_cart_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.carts WHERE id = target_cart_id AND session_id = public.current_cart_session_id());
$$;

DROP POLICY IF EXISTS "Permitir acceso a carritos por sesión o usuario" ON public.carts;
DROP POLICY IF EXISTS "Sesión administra su carrito" ON public.carts;
CREATE POLICY "Sesión administra su carrito" ON public.carts FOR ALL TO anon, authenticated
  USING (session_id = public.current_cart_session_id()) WITH CHECK (session_id = public.current_cart_session_id());

DROP POLICY IF EXISTS "Permitir acceso a items del carrito" ON public.cart_items;
DROP POLICY IF EXISTS "Sesión administra partidas de su carrito" ON public.cart_items;
CREATE POLICY "Sesión administra partidas de su carrito" ON public.cart_items FOR ALL TO anon, authenticated
  USING (public.can_access_cart(cart_id)) WITH CHECK (public.can_access_cart(cart_id));

-- 8. Habilitar Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- 9. Configurar Supabase Storage para el bucket `product-images`
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Lectura pública de imágenes de producto" ON storage.objects;
CREATE POLICY "Lectura pública de imágenes de producto"
  ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Administradores gestionan imágenes de producto" ON storage.objects;
CREATE POLICY "Administradores gestionan imágenes de producto"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- Después de crear un usuario en Authentication > Users, asígnale el rol:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('UUID_DEL_USUARIO', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- =================================================================
-- DATOS DE PRUEBA (SEED DATA)
-- =================================================================

INSERT INTO public.products (id, sku, name, description, price, stock, specs, images) VALUES
(
  '1a2b3c4d-0001-4000-8000-000000000001',
  'AUD-ANC-01',
  'Audífonos Studio Wireless Pro',
  'Auriculares de diadema con cancelación activa de ruido adaptativa, drivers de titanio de 40mm y 40 horas de autonomía continua.',
  289.99,
  15,
  '{"color": "Matte Black", "connectivity": "Bluetooth 5.3", "battery": "40h", "noiseCancellation": "ANC Adaptativo", "weight": "250g"}'::jsonb,
  ARRAY[
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80'
  ]
),
(
  '1a2b3c4d-0002-4000-8000-000000000002',
  'KEY-MECH-02',
  'Teclado Mecánico Custom 75%',
  'Teclado mecánico con chasis de aluminio CNC, interruptores lubricados de fábrica, conectividad tri-modo y teclas PBT de doble inyección.',
  189.50,
  8,
  '{"layout": "75% ANSI", "switches": "Linear Cream", "material": "Aluminio CNC", "rgb": "Per-key RGB", "wireless": true}'::jsonb,
  ARRAY[
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=80'
  ]
),
(
  '1a2b3c4d-0003-4000-8000-000000000003',
  'SPK-HI-03',
  'Altavoz Hi-Fi Sculpt Dual',
  'Altavoz inalámbrico estereofónico acústicamente afinado con acabado en tela premium y madera de nogal sostenible.',
  340.00,
  5,
  '{"power": "60W RMS", "audioFormats": "FLAC, AAC, MP3", "connectivity": "Wi-Fi, AirPlay 2, Bluetooth", "finish": "Nogal y Lino"}'::jsonb,
  ARRAY[
    'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1000&q=80'
  ]
),
(
  '1a2b3c4d-0004-4000-8000-000000000004',
  'MOU-ERG-04',
  'Mouse Ergonómico Precision Silent',
  'Mouse inalámbrico ultra-preciso con sensor magnético MagSpeed, diseño ergonómico para reducir tensión muscular y clics silenciosos.',
  99.90,
  22,
  '{"sensor": "8000 DPI Darkfield", "battery": "70 días", "buttons": "7 programables", "connectivity": "Bluetooth & Logi Bolt"}'::jsonb,
  ARRAY[
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1000&q=80'
  ]
),
(
  '1a2b3c4d-0005-4000-8000-000000000005',
  'LAMP-LED-05',
  'Lámpara Minimalista Halo Ambient',
  'Lámpara de escritorio inteligente con control táctil, temperatura de luz regulable de 2700K a 6500K y base de carga Qi inalámbrica integrada.',
  125.00,
  12,
  '{"lumens": "800 lm", "power": "12W", "wirelessCharging": "15W Fast Qi", "colorTemp": "2700K - 6500K"}'::jsonb,
  ARRAY[
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80'
  ]
),
(
  '1a2b3c4d-0006-4000-8000-000000000006',
  'MON-DEV-06',
  'Monitor Ultrawide 34" Curved Studio',
  'Pantalla curva QD-OLED de 34 pulgadas con resolución UWQHD (3440x1440), frecuencia de refresco de 175Hz y cobertura de color DCI-P3 al 99.3%.',
  899.00,
  4,
  '{"resolution": "3440 x 1440 UWQHD", "refreshRate": "175Hz", "panelType": "QD-OLED", "hdr": "VESA DisplayHDR True Black 400"}'::jsonb,
  ARRAY[
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=80'
  ]
)
ON CONFLICT (sku) DO NOTHING;
