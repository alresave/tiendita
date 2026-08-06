export interface StorefrontSettings {
  theme: StorefrontTheme;
  heroBadge: string;
  heroTitle: string;
  heroTagline: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: string;
}

export const STOREFRONT_THEMES = [
  { id: 'classic', name: 'Clásico', description: 'Minimalista, cálido y sobrio.' },
  { id: 'ocean', name: 'Océano', description: 'Azules profundos y acentos turquesa.' },
  { id: 'midnight', name: 'Medianoche', description: 'Una experiencia oscura y elegante.' },
  { id: 'blossom', name: 'Blossom', description: 'Tonos suaves con un acento coral.' },
] as const;

export type StorefrontTheme = (typeof STOREFRONT_THEMES)[number]['id'];

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettings = {
  theme: 'classic',
  heroBadge: 'Diseño & Tecnología Premium',
  heroTitle: 'Colección Exclusiva de Productos',
  heroTagline: 'Piezas seleccionadas con materiales sostenibles, acústica afinada y acabados minimalistas para elevar tu espacio de trabajo.',
  emptyTitle: 'No encontramos productos',
  emptyDescription: 'Intenta cambiar los términos de búsqueda o selecciona otra categoría.',
  emptyAction: 'Ver todos los productos',
};
