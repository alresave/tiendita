-- Tema público seleccionado por los administradores.
INSERT INTO public.storefront_settings (key, value)
VALUES ('theme', 'classic')
ON CONFLICT (key) DO NOTHING;
