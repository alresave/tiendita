import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';
import { DEFAULT_STOREFRONT_SETTINGS, STOREFRONT_THEMES, StorefrontSettings, StorefrontTheme } from '../models/storefront-settings.model';

@Injectable({ providedIn: 'root' })
export class StorefrontSettingsService {
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);

  public settings = signal<StorefrontSettings>(DEFAULT_STOREFRONT_SETTINGS);

  public async load(): Promise<void> {
    if (!this.supabase.isReady) return;
    const { data, error } = await this.supabase.clientInstance!
      .from('storefront_settings')
      .select('key, value');
    if (error) {
      console.warn('No se pudo cargar la configuración de inicio:', error.message);
      return;
    }
    const values = Object.fromEntries((data ?? []).map((item: { key: string; value: string }) => [item.key, item.value]));
    const theme = STOREFRONT_THEMES.some(item => item.id === values['theme'])
      ? values['theme'] as StorefrontTheme
      : DEFAULT_STOREFRONT_SETTINGS.theme;
    this.settings.set({ ...DEFAULT_STOREFRONT_SETTINGS, ...values, theme });
  }

  public async save(settings: StorefrontSettings): Promise<boolean> {
    if (!this.supabase.isReady) {
      this.toast.error('Administración no configurada', 'Configura Supabase para guardar el contenido.');
      return false;
    }
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value: value.trim() }));
    const { error } = await this.supabase.clientInstance!
      .from('storefront_settings')
      .upsert(rows, { onConflict: 'key' });
    if (error) {
      this.toast.error('No se pudo guardar el contenido', error.message);
      return false;
    }
    this.settings.set({ ...settings });
    this.toast.success('Contenido actualizado', 'Los mensajes de inicio ya se publicaron.');
    return true;
  }
}
