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
  public currentUser = signal<UserSession | null>(this.loadUserFromStorage());
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
    client.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const user: UserSession = {
          id: session.user.id,
          email: session.user.email || 'admin@aura.com',
          role: session.user.role || 'admin',
        };
        this.currentUser.set(user);
        this.saveUserToStorage(user);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser.set(null);
        this.clearUserStorage();
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

      if (data.user) {
        const userSession: UserSession = {
          id: data.user.id,
          email: data.user.email || email,
          role: 'admin',
        };
        this.currentUser.set(userSession);
        this.saveUserToStorage(userSession);
        this.isAuthModalOpen.set(false);
        this.toastService.success('¡Bienvenido Administrador!', `Sesión iniciada como ${userSession.email}`);
        return true;
      }
    }

    // Fallback para modo demo local
    this.isLoading.set(false);
    return this.demoLogin(email);
  }

  public demoLogin(emailInput?: string): boolean {
    const demoUser: UserSession = {
      id: 'usr-admin-demo-99',
      email: emailInput && emailInput.includes('@') ? emailInput : 'admin@aura.com',
      role: 'admin',
    };

    this.currentUser.set(demoUser);
    this.saveUserToStorage(demoUser);
    this.isAuthModalOpen.set(false);
    this.toastService.success(
      'Sesión Admin Activa (Modo Demo)',
      `Has ingresado como ${demoUser.email}`
    );
    return true;
  }

  public async logout(): Promise<void> {
    if (this.supabaseService.isReady) {
      const client = this.supabaseService.clientInstance!;
      await client.auth.signOut();
    }

    this.currentUser.set(null);
    this.clearUserStorage();
    this.toastService.info('Sesión Cerrada', 'Has salido del panel de administración.');
  }

  private saveUserToStorage(user: UserSession): void {
    try {
      localStorage.setItem('aura_user', JSON.stringify(user));
    } catch (e) {}
  }

  private loadUserFromStorage(): UserSession | null {
    try {
      const data = localStorage.getItem('aura_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  private clearUserStorage(): void {
    try {
      localStorage.removeItem('aura_user');
    } catch (e) {}
  }
}
