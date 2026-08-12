export interface ProductSpecs {
  [key: string]: string | number | boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  previous_price?: number | null;
  stock: number;
  low_stock_threshold?: number;
  is_active?: boolean;
  specs: ProductSpecs;
  images: string[];
  created_at?: string;
  category?: string;
  brand?: string | null;
}

export interface ProductFilter {
  searchQuery?: string;
  maxPrice?: number;
  inStockOnly?: boolean;
  category?: string;
  brand?: string;
}
