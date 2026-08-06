import { Injectable, inject, signal } from '@angular/core';
import { StorefrontCollection } from '../models/storefront-collection.model';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class StorefrontCollectionService {
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);

  public collections = signal<StorefrontCollection[]>([]);

  constructor() { void this.load(); }

  public async load(): Promise<void> {
    if (!this.supabase.isReady) return;
    const { data, error } = await this.supabase.clientInstance!
      .from('storefront_collections')
      .select('id, name, description, created_at, collection_products(product_id)')
      .eq('is_visible', true)
      .order('created_at');
    if (error) {
      console.warn('No se pudieron cargar las mini tiendas:', error.message);
      return;
    }
    this.collections.set((data ?? []).map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      created_at: item.created_at,
      productIds: (item.collection_products ?? []).map((product: { product_id: string }) => product.product_id),
    })));
  }

  public async create(name: string, description: string): Promise<boolean> {
    const normalizedName = name.trim();
    if (!normalizedName) return false;
    if (!this.supabase.isReady) return false;
    const { data, error } = await this.supabase.clientInstance!
      .from('storefront_collections')
      .insert({ name: normalizedName, description: description.trim() })
      .select('id, name, description, created_at')
      .single();
    if (error || !data) {
      this.toast.error('No se pudo crear la mini tienda', error?.message);
      return false;
    }
    this.collections.update(items => [...items, { ...(data as Omit<StorefrontCollection, 'productIds'>), productIds: [] }]);
    this.toast.success('Mini tienda creada', 'Ahora selecciona los productos que incluirá.');
    return true;
  }

  public async remove(collection: StorefrontCollection): Promise<boolean> {
    if (!this.supabase.isReady) return false;
    const { error } = await this.supabase.clientInstance!
      .from('storefront_collections').delete().eq('id', collection.id);
    if (error) {
      this.toast.error('No se pudo eliminar la mini tienda', error.message);
      return false;
    }
    this.collections.update(items => items.filter(item => item.id !== collection.id));
    this.toast.success('Mini tienda eliminada');
    return true;
  }

  public async toggleProduct(collection: StorefrontCollection, productId: string): Promise<boolean> {
    if (!this.supabase.isReady) return false;
    const included = collection.productIds.includes(productId);
    const query = included
      ? this.supabase.clientInstance!.from('collection_products').delete().eq('collection_id', collection.id).eq('product_id', productId)
      : this.supabase.clientInstance!.from('collection_products').insert({ collection_id: collection.id, product_id: productId });
    const { error } = await query;
    if (error) {
      this.toast.error('No se pudo actualizar la mini tienda', error.message);
      return false;
    }
    this.collections.update(items => items.map(item => item.id !== collection.id ? item : {
      ...item,
      productIds: included ? item.productIds.filter(id => id !== productId) : [...item.productIds, productId],
    }));
    return true;
  }
}
