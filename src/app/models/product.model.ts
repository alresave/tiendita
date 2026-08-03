export interface ProductSpecs {
  [key: string]: string | number | boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  specs: ProductSpecs;
  images: string[];
  created_at?: string;
  category?: string;
}

export interface ProductFilter {
  searchQuery?: string;
  maxPrice?: number;
  inStockOnly?: boolean;
  category?: string;
}
