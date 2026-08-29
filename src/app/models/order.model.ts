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
  customer_name?: string;
  customer_phone?: string;
  customer_note?: string;
  admin_note?: string;
  shipping_address?: { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string };
  order_items?: { product_name: string; quantity: number; unit_price: number }[];
}
