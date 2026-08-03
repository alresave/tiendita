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
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  specs JSONB DEFAULT '{}'::jsonb,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

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

-- 5. Crear índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_specs ON public.products USING gin(specs);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON public.carts(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);

-- 6. Habilitar Row Level Security (RLS) en todas las tablas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de RLS
-- A) Products: Lectura y Escritura (para gestión Admin)
DROP POLICY IF EXISTS "Permitir lectura pública de productos" ON public.products;
CREATE POLICY "Permitir lectura pública de productos"
  ON public.products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir escritura administrativa en productos" ON public.products;
CREATE POLICY "Permitir escritura administrativa en productos"
  ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

-- B) Carts & Cart Items
DROP POLICY IF EXISTS "Permitir acceso a carritos por sesión o usuario" ON public.carts;
CREATE POLICY "Permitir acceso a carritos por sesión o usuario"
  ON public.carts FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acceso a items del carrito" ON public.cart_items;
CREATE POLICY "Permitir acceso a items del carrito"
  ON public.cart_items FOR ALL TO public USING (true) WITH CHECK (true);

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
