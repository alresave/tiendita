import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ProductGridComponent } from './components/product-grid/product-grid.component';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AuthModalComponent } from './components/auth/auth-modal.component';
import { StorefrontSettingsService } from './services/storefront-settings.service';
import { ProductService } from './services/product.service';
import { CartService } from './services/cart.service';
import { AuthService } from './services/auth.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    ProductGridComponent,
    CartDrawerComponent,
    ToastContainerComponent,
    AdminDashboardComponent,
    AuthModalComponent,
  ],
  template: `
    <div class="min-h-screen flex flex-col bg-stone-50 font-sans selection:bg-stone-900 selection:text-white" [class]="'theme-' + storefrontSettings.settings().theme">
      <!-- Navbar Header -->
      <app-navbar></app-navbar>

      <!-- Main Storefront Body -->
      <main class="flex-1">
        <app-product-grid></app-product-grid>
      </main>

      <!-- Footer -->
      <footer class="border-t border-stone-200/80 bg-white py-12 mt-16 text-stone-500 text-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-3">
            <span class="w-6 h-6 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
              A
            </span>
            <span class="font-bold text-stone-900 tracking-wider">Aidé storefront</span>
            <span class="text-stone-300">|</span>
            <span>Angular v17+ Standalone & Signals + Supabase Auth Protected</span>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <a href="#" class="hover:text-stone-900 transition-colors">Términos de servicio</a>
            <a href="#" class="hover:text-stone-900 transition-colors">Privacidad</a>
            <a href="#" class="hover:text-stone-900 transition-colors">Soporte Supabase</a>
          </div>

          <p class="text-stone-400">
            &copy; 2026 Aidé storefront. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      <!-- Side Drawers, Auth & Admin Overlays -->
      @defer (when cartService.isDrawerOpen()) {
        <app-cart-drawer></app-cart-drawer>
      }
      @defer (when productService.isAdminOpen()) {
        <app-admin-dashboard></app-admin-dashboard>
      }
      @defer (when authService.isAuthModalOpen() || authService.isPasswordSetupOpen()) {
        <app-auth-modal></app-auth-modal>
      }
      @defer (when toastService.toasts().length > 0) {
        <app-toast-container></app-toast-container>
      }
    </div>
  `
})
export class App {
  public storefrontSettings = inject(StorefrontSettingsService);
  public productService = inject(ProductService);
  public cartService = inject(CartService);
  public authService = inject(AuthService);
  public toastService = inject(ToastService);

  constructor() {
    void this.storefrontSettings.load();
  }
}
