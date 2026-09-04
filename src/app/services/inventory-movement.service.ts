import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';
import { InventoryMovement } from '../models/inventory-movement.model';

@Injectable({ providedIn: 'root' })
export class InventoryMovementService {
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);

  public movements = signal<InventoryMovement[]>([]);
  public isLoading = signal(false);

  public async load(): Promise<void> {
    if (!this.supabase.isReady) return;
    this.isLoading.set(true);
    const { data, error } = await this.supabase.clientInstance!
      .from('inventory_movements')
      .select('id, product_id, delta, reason, created_at, products(name, sku)')
      .order('created_at', { ascending: false })
      .limit(100);
    this.isLoading.set(false);
    if (error) {
      this.toast.error('No se pudieron cargar los movimientos', error.message);
      return;
    }
    this.movements.set((data ?? []).map((movement) => ({
      ...movement,
      products: Array.isArray(movement.products) ? movement.products[0] ?? null : movement.products,
    })) as InventoryMovement[]);
  }
}
