import { Injectable, signal, computed, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';

export interface UserSession {
  id: string;
  email: string;
  role?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);

  // Signals de estado de usuario
  public currentUser = signal<UserSession | null>(null);
  public isAuthModalOpen = signal<boolean>(false);
  public isLoading = signal<boolean>(false);

  // Signal computado para verificar autenticación
  public isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener(): void {
    if (!this.supabaseService.isReady) return;

    const client = this.supabaseService.clientInstance!;

    // Escuchar eventos de autenticación de Supabase Auth
    client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await this.loadAdminSession(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        this.currentUser.set(null);
      }
    });
  }

  public async loginWithEmail(email: string, pass: string): Promise<boolean> {
    this.isLoading.set(true);

    if (this.supabaseService.isReady) {
      const client = this.supabaseService.clientInstance!;
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password: pass,
      });

      this.isLoading.set(false);

      if (error) {
        this.toastService.error('Error de Autenticación', error.message);
        return false;
      }

      if (data.user && await this.loadAdminSession(data.user.id, data.user.email || email)) {
        this.isAuthModalOpen.set(false);
        this.toastService.success('Bienvenido al panel', `Sesión iniciada como ${data.user.email || email}`);
        return true;
      }

      await client.auth.signOut();
      this.toastService.error('Acceso denegado', 'Esta cuenta no tiene permisos de administración.');
      return false;
    }

    this.isLoading.set(false);
    this.toastService.error('Administración no configurada', 'Configura Supabase para iniciar sesión en el panel.');
    return false;
  }

  public async logout(): Promise<void> {
    if (this.supabaseService.isReady) {
      const client = this.supabaseService.clientInstance!;
      await client.auth.signOut();
    }

    this.currentUser.set(null);
    this.toastService.info('Sesión Cerrada', 'Has salido del panel de administración.');
  }

  public async requestPasswordReset(email: string): Promise<void> {
    if (!this.supabaseService.isReady || !email.trim()) {
      this.toastService.error('No se pudo enviar el correo', 'Indica un correo y configura Supabase.');
      return;
    }
    const { error } = await this.supabaseService.clientInstance!.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if (error) this.toastService.error('No se pudo enviar el correo', error.message);
    else this.toastService.success('Revisa tu correo', 'Te enviamos un enlace para restablecer tu contraseña.');
  }

  public async inviteAdmin(email: string): Promise<boolean> {
    if (!this.supabaseService.isReady || !email.trim()) {
      this.toastService.error('No se pudo invitar', 'Indica un correo válido y configura Supabase.');
      return false;
    }
    const { data, error } = await this.supabaseService.clientInstance!.functions.invoke('invite-admin', {
      body: { email: email.trim(), redirectTo: window.location.origin },
    });
    if (error) {
      this.toastService.error('No se pudo invitar', await this.getFunctionError(error));
      return false;
    }
    const message = data?.mode === 'existing'
      ? `${email.trim()} ya tenía una cuenta: se le asignó el rol y enviamos un enlace para definir su contraseña.`
      : `${email.trim()} podrá crear su contraseña y entrar como administrador.`;
    this.toastService.success('Invitación enviada', message);
    return true;
  }

  private async getFunctionError(error: unknown): Promise<string> {
    const context = (error as { context?: unknown })?.context;
    if (context instanceof Response) {
      try {
        const body = await context.clone().json() as { error?: string };
        if (body.error) return body.error;
      } catch {
        // Se conserva el mensaje genérico si la respuesta no es JSON.
      }
    }
    return error instanceof Error ? error.message : 'No se pudo completar la invitación.';
  }

  private async loadAdminSession(userId: string, email: string): Promise<boolean> {
    const client = this.supabaseService.clientInstance;
    if (!client) return false;

    const { data, error } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || data?.role !== 'admin') {
      this.currentUser.set(null);
      return false;
    }

    this.currentUser.set({ id: userId, email, role: 'admin' });
    return true;
  }
}
