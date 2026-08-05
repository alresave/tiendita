export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled';

export interface StoreOrder {
  id: string;
  order_number: string;
  customer_email?: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  created_at: string;
  order_items?: { product_name: string; quantity: number; unit_price: number }[];
}
