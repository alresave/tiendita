import { Injectable, computed, inject, signal } from '@angular/core';
import { Category } from '../models/category.model';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';
import { ProductService } from './product.service';

const DEFAULT_CATEGORIES = ['Audio', 'Periféricos', 'Iluminación', 'Monitores', 'Accesorios'];

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);
  private productService = inject(ProductService);

  public categories = signal<Category[]>([]);
  public names = computed(() => this.categories().map((category) => category.name));

  constructor() { this.load(); }

  public async load(): Promise<void> {
    if (!this.supabase.isReady) {
      this.categories.set(DEFAULT_CATEGORIES.map((name, index) => ({ id: `default-${index}`, name })));
      return;
    }

    const { data, error } = await this.supabase.clientInstance!
      .from('categories').select('*').order('name');
    if (error) {
      console.warn('No se pudieron cargar las categorías:', error.message);
      return;
    }
    this.categories.set((data || []) as Category[]);
  }

  public async ensure(name: string): Promise<boolean> {
    const normalized = name.trim();
    if (!normalized) return false;
    if (this.names().some((category) => category.toLocaleLowerCase() === normalized.toLocaleLowerCase())) return true;
    if (!this.supabase.isReady) return false;

    const { data, error } = await this.supabase.clientInstance!
      .from('categories').insert({ name: normalized }).select().single();
    if (error) {
      this.toast.error('No se pudo crear la categoría', error.message);
      return false;
    }
    this.categories.update((categories) => [...categories, data as Category].sort((a, b) => a.name.localeCompare(b.name)));
    return true;
  }

  public async rename(category: Category, name: string): Promise<boolean> {
    const normalized = name.trim();
    if (!normalized || normalized === category.name) return false;
    const { error } = await this.supabase.clientInstance!
      .from('categories').update({ name: normalized }).eq('id', category.id);
    if (error) { this.toast.error('No se pudo actualizar la categoría', error.message); return false; }
    this.categories.update((categories) => categories.map((item) => item.id === category.id ? { ...item, name: normalized } : item));
    this.productService.products.update((products) => products.map((product) =>
      product.category === category.name ? { ...product, category: normalized } : product
    ));
    this.toast.success('Categoría actualizada', 'Los productos asociados se actualizaron automáticamente.');
    return true;
  }

  public async remove(category: Category): Promise<boolean> {
    const { error } = await this.supabase.clientInstance!.from('categories').delete().eq('id', category.id);
    if (error) { this.toast.error('No se pudo eliminar la categoría', error.message); return false; }
    this.categories.update((categories) => categories.filter((item) => item.id !== category.id));
    return true;
  }
}
