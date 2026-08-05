export interface StorefrontSettings {
  heroBadge: string;
  heroTitle: string;
  heroTagline: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: string;
}

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettings = {
  heroBadge: 'Diseño & Tecnología Premium',
  heroTitle: 'Colección Exclusiva de Productos',
  heroTagline: 'Piezas seleccionadas con materiales sostenibles, acústica afinada y acabados minimalistas para elevar tu espacio de trabajo.',
  emptyTitle: 'No encontramos productos',
  emptyDescription: 'Intenta cambiar los términos de búsqueda o selecciona otra categoría.',
  emptyAction: 'Ver todos los productos',
};
