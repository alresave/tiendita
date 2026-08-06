import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (cartService.isDrawerOpen()) {
      <div class="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
        <!-- Backdrop Overlay -->
        <div 
          (click)="cartService.closeDrawer()"
          class="fixed inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity animate-fade-in"
        ></div>

        <div class="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
          <!-- Slide Panel Container -->
          <div 
            class="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out animate-slide-left border-l border-stone-100"
          >
            <!-- Drawer Header -->
            <div class="p-6 border-b border-stone-100 bg-stone-50/50">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-sm">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-lg font-bold text-stone-900 leading-none">Tu Carrito</h2>
                    <span class="text-xs text-stone-500 font-medium flex items-center gap-1 mt-0.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Realtime DB Sync — {{ cartService.itemCount() }} {{ cartService.itemCount() === 1 ? 'producto' : 'productos' }}
                    </span>
                  </div>
                </div>

                <button
                  (click)="cartService.closeDrawer()"
                  class="p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition-colors"
                  aria-label="Cerrar carrito"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Free Shipping Progress Bar -->
              <div class="bg-white p-3 rounded-2xl border border-stone-200/70 shadow-sm">
                <div class="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span class="text-stone-700">
                    @if (cartService.remainingForFreeShipping() === 0) {
                      🎉 ¡Felicidades! Tienes **Envío Gratis**
                    } @else {
                      Agrega \${{ cartService.remainingForFreeShipping() | number:'1.2-2' }} para **Envío Gratis**
                    }
                  </span>
                  <span class="text-stone-500 font-mono">{{ cartService.freeShippingProgress() }}%</span>
                </div>
                <div class="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 ease-out"
                    [style.width.%]="cartService.freeShippingProgress()"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Drawer Body: Items List or Empty State -->
            <div class="flex-1 overflow-y-auto p-6">
              @if (cartService.isEmpty()) {
                <div class="h-full flex flex-col items-center justify-center text-center p-6">
                  <div class="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mb-4 text-stone-300">
                    <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                  </div>
                  <h3 class="text-base font-bold text-stone-800 mb-1">Tu carrito está vacío</h3>
                  <p class="text-xs text-stone-500 max-w-xs mb-6 leading-relaxed">
                    Aún no has agregado productos a tu cesta. Explora nuestro catálogo de diseño.
                  </p>
                  <button
                    (click)="cartService.closeDrawer()"
                    class="px-6 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
                  >
                    Explorar productos
                  </button>
                </div>
              } @else {
                <div class="space-y-4">
                  @for (item of cartService.cart(); track item.product.id) {
                    <div class="flex items-center gap-4 p-3 rounded-2xl border border-stone-100 hover:border-stone-200 bg-stone-50/30 transition-all">
                      <!-- Image -->
                      <img 
                        [src]="item.product.images[0]" 
                        [alt]="item.product.name"
                        class="w-16 h-16 object-contain bg-stone-100 rounded-xl p-1 flex-shrink-0"
                      />

                      <!-- Details -->
                      <div class="flex-1 min-w-0">
                        <h4 class="text-xs font-bold text-stone-900 truncate leading-snug">
                          {{ item.product.name }}
                        </h4>
                        <span class="text-xs font-semibold text-stone-900 block mt-0.5">
                          \${{ item.product.price | number:'1.2-2' }}
                        </span>

                        <!-- Quantity Selector -->
                        <div class="flex items-center gap-2 mt-2">
                          <button
                            (click)="cartService.updateQuantity(item.product.id, item.quantity - 1)"
                            class="w-11 h-11 rounded-xl bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 flex items-center justify-center text-sm font-bold transition-colors"
                            aria-label="Disminuir cantidad"
                          >
                            -
                          </button>
                          
                          <span class="text-sm font-bold text-stone-800 min-w-8 text-center font-mono">
                            {{ item.quantity }}
                          </span>

                          <button
                            (click)="cartService.updateQuantity(item.product.id, item.quantity + 1)"
                            class="w-11 h-11 rounded-xl bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 flex items-center justify-center text-sm font-bold transition-colors"
                            aria-label="Aumentar cantidad"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <!-- Remove Action -->
                      <button
                        (click)="cartService.removeFromCart(item.product.id)"
                        class="text-stone-300 hover:text-rose-500 p-1.5 transition-colors"
                        aria-label="Eliminar producto"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Drawer Footer: Checkout Summary -->
            @if (!cartService.isEmpty()) {
              <div class="p-6 border-t border-stone-100 bg-stone-50/50 space-y-3">
                <div class="flex items-center justify-between text-xs text-stone-500">
                  <span>Subtotal</span>
                  <span class="font-mono font-semibold text-stone-800">
                    \${{ cartService.subtotalPrice() | number:'1.2-2' }}
                  </span>
                </div>

                <div class="flex items-center justify-between text-xs text-stone-500">
                  <span>Envío</span>
                  <span class="font-semibold text-stone-800">
                    @if (cartService.remainingForFreeShipping() === 0) {
                      <span class="text-emerald-600 font-bold uppercase">Gratis</span>
                    } @else {
                      \${{ 15 | number:'1.2-2' }}
                    }
                  </span>
                </div>

                <div class="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                  <span class="text-sm font-bold text-stone-900">Total</span>
                  <span class="text-xl font-black text-stone-900">
                    \${{ (cartService.totalPrice() + (cartService.remainingForFreeShipping() === 0 ? 0 : 15)) | number:'1.2-2' }}
                  </span>
                </div>

                <button
                  (click)="onCheckout()"
                  class="w-full mt-2 py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 active:scale-98 text-white font-bold text-sm shadow-soft hover:shadow-soft-hover transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>Proceder al Pago (Edge Function)</span>
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>

                <button
                  (click)="cartService.clearCart()"
                  class="w-full text-center text-xs text-stone-400 hover:text-stone-600 font-medium py-1 transition-colors"
                >
                  Vaciar carrito
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class CartDrawerComponent {
  public cartService = inject(CartService);

  public async onCheckout(): Promise<void> {
    const success = await this.cartService.checkoutWithEdgeFunction();
    if (success) {
      this.cartService.closeDrawer();
    }
  }
}
