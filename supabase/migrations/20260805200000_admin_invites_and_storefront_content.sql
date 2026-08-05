-- Administradores pueden actualizar el contenido público de la portada.
CREATE TABLE IF NOT EXISTS public.storefront_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.storefront_settings (key, value) VALUES
  ('heroBadge', 'Diseño & Tecnología Premium'),
  ('heroTitle', 'Colección Exclusiva de Productos'),
  ('heroTagline', 'Piezas seleccionadas con materiales sostenibles, acústica afinada y acabados minimalistas para elevar tu espacio de trabajo.'),
  ('emptyTitle', 'No encontramos productos'),
  ('emptyDescription', 'Intenta cambiar los términos de búsqueda o selecciona otra categoría.'),
  ('emptyAction', 'Ver todos los productos')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.storefront_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública de contenido de inicio" ON public.storefront_settings;
CREATE POLICY "Lectura pública de contenido de inicio" ON public.storefront_settings
  FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Administradores gestionan contenido de inicio" ON public.storefront_settings;
CREATE POLICY "Administradores gestionan contenido de inicio" ON public.storefront_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- La Edge Function valida el rol antes de invitar. Esta política deja que los
-- administradores puedan consultar los roles desde herramientas internas.
DROP POLICY IF EXISTS "Administradores consultan roles" ON public.user_roles;
CREATE POLICY "Administradores consultan roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_admin());
