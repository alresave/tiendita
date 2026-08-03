import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (authService.isAuthModalOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="auth-modal-title" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div 
          (click)="authService.isAuthModalOpen.set(false)"
          class="fixed inset-0 bg-stone-900/65 backdrop-blur-sm transition-opacity animate-fade-in"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
          <!-- Auth Card -->
          <div 
            class="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-stone-100 animate-slide-up p-6 sm:p-8"
          >
            <!-- Close Button -->
            <button
              (click)="authService.isAuthModalOpen.set(false)"
              class="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              aria-label="Cerrar modal"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- Card Header -->
            <div class="text-center mb-6">
              <div class="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-md">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 class="text-2xl font-black text-stone-900 tracking-tight">Acceso Administrador</h3>
              <p class="text-xs text-stone-500 mt-1 leading-relaxed">
                Ingresa con tu cuenta de Supabase Auth para gestionar el catálogo e inventario.
              </p>
            </div>

            <!-- Login Form -->
            <form (ngSubmit)="onLogin()" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  placeholder="admin@aura.com"
                  class="w-full px-4 py-3 text-sm bg-stone-50 rounded-2xl border border-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <div class="relative">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    class="w-full pl-4 pr-10 py-3 text-sm bg-stone-50 rounded-2xl border border-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    (click)="showPassword.update(v => !v)"
                    class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600"
                  >
                    @if (showPassword()) {
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.046 10.046 0 013.682-.863c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-6.165-4.116a3 3 0 11-4.243-4.243" />
                      </svg>
                    } @else {
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    }
                  </button>
                </div>
              </div>

              <!-- Primary Submit Button -->
              <button
                type="submit"
                [disabled]="authService.isLoading()"
                class="w-full py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 active:scale-98 text-white font-bold text-sm shadow-soft hover:shadow-soft-hover transition-all duration-200 flex items-center justify-center gap-2 mt-2"
              >
                @if (authService.isLoading()) {
                  <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                }
                <span>Iniciar Sesión</span>
              </button>
            </form>

            <div class="relative my-6">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-stone-200"></div>
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-white px-3 text-stone-400 font-bold">O acceso rápido</span>
              </div>
            </div>

            <!-- Demo Access Button -->
            <button
              (click)="onDemoLogin()"
              class="w-full py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Entrar como Admin Demo (Sin clave)</span>
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AuthModalComponent {
  public authService = inject(AuthService);
  private productService = inject(ProductService);

  public email = 'admin@aura.com';
  public password = '';
  public showPassword = signal<boolean>(false);

  public async onLogin(): Promise<void> {
    if (!this.email || !this.password) return;

    const success = await this.authService.loginWithEmail(this.email, this.password);
    if (success) {
      this.productService.isAdminOpen.set(true);
    }
  }

  public onDemoLogin(): void {
    const success = this.authService.demoLogin(this.email);
    if (success) {
      this.productService.isAdminOpen.set(true);
    }
  }
}
