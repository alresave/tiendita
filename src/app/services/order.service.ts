import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';
import { OrderStatus, StoreOrder } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);
  public orders = signal<StoreOrder[]>([]);
  public isLoading = signal(false);

  public async load(): Promise<void> {
    if (!this.supabase.isReady) return;
    this.isLoading.set(true);
    const { data, error } = await this.supabase.clientInstance!
      .from('orders').select('*, order_items(product_name, quantity, unit_price)').order('created_at', { ascending: false });
    this.isLoading.set(false);
    if (error) { this.toast.error('No se pudieron cargar los pedidos', error.message); return; }
    this.orders.set((data || []) as StoreOrder[]);
  }

  public async setStatus(order: StoreOrder, status: OrderStatus): Promise<void> {
    const { error } = await this.supabase.clientInstance!.from('orders').update({ status }).eq('id', order.id);
    if (error) { this.toast.error('No se pudo actualizar el pedido', error.message); return; }
    this.orders.update((orders) => orders.map((item) => item.id === order.id ? { ...item, status } : item));
  }
}
