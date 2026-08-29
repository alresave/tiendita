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
    const { error } = await this.supabase.clientInstance!.from('orders').update({ status, status_updated_at: new Date().toISOString() }).eq('id', order.id);
    if (error) { this.toast.error('No se pudo actualizar el pedido', error.message); return; }
    this.orders.update((orders) => orders.map((item) => item.id === order.id ? { ...item, status } : item));
    const { error: notificationError } = await this.supabase.clientInstance!.functions.invoke('order-status-notification', { body: { orderId: order.id, status } });
    if (notificationError) this.toast.warning('Estado actualizado', 'No se pudo enviar el correo de actualización al cliente.');
  }

  public async saveAdminNote(order: StoreOrder, admin_note: string): Promise<void> {
    const { error } = await this.supabase.clientInstance!.from('orders').update({ admin_note }).eq('id', order.id);
    if (error) { this.toast.error('No se pudo guardar la nota', error.message); return; }
    this.orders.update((orders) => orders.map((item) => item.id === order.id ? { ...item, admin_note } : item));
  }
}
