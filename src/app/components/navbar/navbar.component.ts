import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-md transition-all duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        <!-- Brand Logo -->
        <div class="flex items-center gap-3">
          <a href="#" class="group flex items-center gap-2 text-2xl font-extrabold tracking-tight text-stone-900 transition-transform active:scale-95">
            <span class="w-8 h-8 rounded-xl bg-gradient-to-tr from-stone-900 to-stone-700 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform duration-300">
              A
            </span>
            <span class="font-bold tracking-wider">Aidé storefront</span>
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </a>

          <!-- Supabase Connection Badge -->
          <span 
            class="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
            [ngClass]="{
              'bg-emerald-50 text-emerald-700 border-emerald-200/60': supabaseService.isReady,
              'bg-amber-50 text-amber-700 border-amber-200/60': !supabaseService.isReady
            }"
            [title]="supabaseService.isReady ? 'Conectado a Supabase PostgreSQL & Auth' : 'Modo Demo Local'"
          >
            <span class="w-1.5 h-1.5 rounded-full" [ngClass]="supabaseService.isReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'"></span>
            {{ supabaseService.isReady ? 'Supabase Auth' : 'Demo Mode' }}
          </span>
        </div>

        <!-- Search Bar -->
        <div class="flex-1 max-w-md mx-2 sm:mx-6">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <input
              type="text"
              [ngModel]="productService.searchQuery()"
              (ngModelChange)="productService.searchQuery.set($event)"
              placeholder="Buscar productos, especificaciones..."
              class="w-full pl-10 pr-9 py-2.5 text-sm bg-stone-100/80 hover:bg-stone-100 focus:bg-white text-stone-900 placeholder-stone-400 rounded-2xl border border-transparent focus:border-stone-300 focus:outline-none focus:ring-4 focus:ring-stone-100 transition-all duration-200"
            />

            @if (productService.searchQuery()) {
              <button
                (click)="productService.searchQuery.set('')"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            }
          </div>
        </div>

        <!-- Actions: Admin Control & Cart -->
        <div class="flex items-center gap-2.5">
          <!-- Admin Access Button -->
          <button
            (click)="onAdminClick()"
            class="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border transition-all active:scale-95 font-semibold text-xs"
            [ngClass]="{
              'bg-amber-100/80 border-amber-300/80 text-amber-950 hover:bg-amber-200/80': authService.isAuthenticated(),
              'bg-stone-100 border-stone-200/80 text-stone-800 hover:bg-stone-200/70': !authService.isAuthenticated()
            }"
            [title]="authService.isAuthenticated() ? 'Abrir Panel Admin (' + authService.currentUser()?.email + ')' : 'Iniciar sesión para acceder al Panel Admin'"
          >
            <svg class="w-4 h-4 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            
            <span class="hidden md:inline">
              {{ authService.isAuthenticated() ? 'Panel Admin' : 'Login Admin' }}
            </span>
          </button>

          <!-- Cart Action Button -->
          <button
            (click)="cartService.toggleDrawer()"
            class="relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm shadow-soft hover:shadow-soft-hover active:scale-95 transition-all duration-200"
            aria-label="Abrir carrito de compras"
          >
            <svg class="w-5 h-5 text-stone-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            
            <span class="hidden sm:inline font-semibold">Carrito</span>

            <!-- Counter Badge -->
            <span
              class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-stone-900 bg-white rounded-full transition-transform duration-300"
              [ngClass]="{
                'scale-125 bg-emerald-400 text-stone-950': cartService.lastAddedProductId() !== null
              }"
            >
              {{ cartService.itemCount() }}
            </span>
          </button>
        </div>
      </div>
    </header>
  `
})
export class NavbarComponent {
  public cartService = inject(CartService);
  public productService = inject(ProductService);
  public supabaseService = inject(SupabaseService);
  public authService = inject(AuthService);

  public onAdminClick(): void {
    if (this.authService.isAuthenticated()) {
      this.productService.isAdminOpen.set(true);
    } else {
      this.authService.isAuthModalOpen.set(true);
    }
  }
}
