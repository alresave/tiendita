import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';
import { StoreOrder } from '../models/order.model';

export interface CustomerProfile { full_name: string; phone: string; }
export interface CustomerAddress { id?: string; recipient_name: string; phone: string; line1: string; line2?: string; city: string; state: string; postal_code: string; country: string; is_default: boolean; }

@Injectable({ providedIn: 'root' })
export class CustomerAccountService {
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);
  public profile = signal<CustomerProfile>({ full_name: '', phone: '' });
  public addresses = signal<CustomerAddress[]>([]);
  public orders = signal<StoreOrder[]>([]);
  public isLoading = signal(false);

  public async load(userId: string): Promise<void> {
    if (!this.supabase.isReady) return;
    this.isLoading.set(true);
    const client = this.supabase.clientInstance!;
    const [profile, addresses, orders] = await Promise.all([
      client.from('customer_profiles').select('full_name, phone').eq('id', userId).maybeSingle(),
      client.from('customer_addresses').select('*').order('is_default', { ascending: false }).order('created_at', { ascending: false }),
      client.from('orders').select('*, order_items(product_name, quantity, unit_price)').order('created_at', { ascending: false }),
    ]);
    this.isLoading.set(false);
    if (profile.error || addresses.error || orders.error) {
      this.toast.error('No se pudo cargar tu cuenta', profile.error?.message || addresses.error?.message || orders.error?.message);
      return;
    }
    this.profile.set(profile.data ?? { full_name: '', phone: '' });
    this.addresses.set((addresses.data ?? []) as CustomerAddress[]);
    this.orders.set((orders.data ?? []) as StoreOrder[]);
  }

  public async saveProfile(userId: string, profile: CustomerProfile): Promise<void> {
    const { error } = await this.supabase.clientInstance!.from('customer_profiles').upsert({ id: userId, ...profile });
    if (error) return this.toast.error('No se pudo guardar el perfil', error.message);
    this.profile.set(profile); this.toast.success('Perfil guardado', 'Tus datos se actualizaron.');
  }

  public async saveAddress(address: CustomerAddress): Promise<void> {
    const client = this.supabase.clientInstance!;
    if (address.is_default) await client.from('customer_addresses').update({ is_default: false }).eq('is_default', true);
    const { data, error } = await client.from('customer_addresses').upsert(address).select().single();
    if (error) return this.toast.error('No se pudo guardar la dirección', error.message);
    this.addresses.update((items) => address.id ? items.map((item) => item.id === address.id ? data as CustomerAddress : item) : [data as CustomerAddress, ...items]);
    this.toast.success('Dirección guardada', 'Ya puedes reutilizarla en tu próxima compra.');
  }

  public async removeAddress(id: string): Promise<void> {
    const { error } = await this.supabase.clientInstance!.from('customer_addresses').delete().eq('id', id);
    if (error) return this.toast.error('No se pudo eliminar la dirección', error.message);
    this.addresses.update((items) => items.filter((address) => address.id !== id));
  }
}
