import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConfigured = false;

  constructor() {
    this.initSupabase();
  }

  private initSupabase(): void {
    const url = environment.supabaseUrl;
    const key = environment.supabaseKey;

    if (
      url &&
      key &&
      !url.includes('YOUR_SUPABASE') &&
      !key.includes('YOUR_SUPABASE')
    ) {
      try {
        this.client = createClient(url, key);
        this.isConfigured = true;
      } catch (err) {
        console.warn('Error inicializando el cliente de Supabase:', err);
      }
    } else {
      console.info(
        'Supabase no está configurado aún en environment.ts. Se usarán datos locales de respaldo para la demo.'
      );
    }
  }

  public get clientInstance(): SupabaseClient | null {
    return this.client;
  }

  public get isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }
}
