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
        'Supabase no está configurado aún en environment.ts. El catálogo usa datos de muestra y el panel de administración permanece bloqueado.'
      );
    }
  }

  public get clientInstance(): SupabaseClient | null {
    return this.client;
  }

  public createSessionClient(sessionId: string): SupabaseClient | null {
    if (!this.isReady) return null;
    return createClient(environment.supabaseUrl, environment.supabaseKey, {
      global: { headers: { 'x-session-id': sessionId } },
    });
  }

  public get isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }
}
