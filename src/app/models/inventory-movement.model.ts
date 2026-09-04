export interface InventoryMovement {
  id: string;
  product_id: string;
  delta: number;
  reason: string;
  created_at: string;
  products?: { name: string; sku: string } | null;
}
