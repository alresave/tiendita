import { Component, Input, Output, EventEmitter, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { FocusTrapDirective } from '../../directives/focus-trap.directive';

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  imports: [CommonModule, FocusTrapDirective],
  template: `
    @if (product) {
      <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div 
          (click)="close.emit()"
          class="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
          <!-- Modal Card -->
          <div appFocusTrap
            class="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-stone-100 animate-slide-up"
          >
            <!-- Close Button -->
            <button
              (click)="close.emit()"
              class="absolute top-4 right-4 z-10 p-2 rounded-full bg-stone-100/80 hover:bg-stone-200 text-stone-600 transition-colors"
              aria-label="Cerrar modal"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div class="grid grid-cols-1 md:grid-cols-2">
              <!-- Image Gallery Preview -->
              <div class="bg-stone-100 p-6 flex flex-col items-center justify-center relative min-h-[260px]">
                <img
                  [src]="activeImage || product.images[0]"
                  [alt]="product.name"
                  class="max-h-64 object-contain rounded-xl transition-all duration-300 transform hover:scale-105"
                />
                
                @if (product.images.length > 1) {
                  <div class="flex gap-2 mt-4 overflow-x-auto p-1">
                    @for (img of product.images; track img) {
                      <button
                        (click)="activeImage = img"
                        class="w-12 h-12 rounded-lg border-2 overflow-hidden transition-all"
                        [ngClass]="(activeImage || product.images[0]) === img ? 'border-stone-900 ring-2 ring-stone-900/20' : 'border-transparent opacity-70 hover:opacity-100'"
                      >
                        <img [src]="img" [alt]="product.name" class="w-full h-full object-cover" />
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- Product Info & Specs JSONB -->
              <div class="p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <span class="text-xs font-mono font-medium text-stone-400 uppercase tracking-wider">
                      SKU: {{ product.sku }}
                    </span>
                    <span 
                      class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      [ngClass]="product.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                    >
                      {{ product.stock > 0 ? product.stock + ' en Stock' : 'Agotado' }}
                    </span>
                  </div>

                  <h3 class="text-xl font-bold text-stone-900 mb-2 leading-snug">
                    {{ product.name }}
                  </h3>

                  <p class="text-sm text-stone-600 mb-6 leading-relaxed">
                    {{ product.description }}
                  </p>

                  <!-- Technical Specs JSONB Render -->
                  <div class="mb-6 bg-stone-50 rounded-2xl p-4 border border-stone-200/60">
                    <h4 class="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <svg class="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      Especificaciones Técnicas (JSONB)
                    </h4>
                    
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      @for (entry of getSpecsEntries(product.specs); track entry.key) {
                        <div class="flex flex-col bg-white p-2 rounded-xl border border-stone-100">
                          <dt class="font-medium text-stone-400 capitalize">{{ entry.key }}</dt>
                          <dd class="font-semibold text-stone-800 mt-0.5">{{ entry.value }}</dd>
                        </div>
                      }
                    </dl>
                  </div>
                </div>

                <!-- Footer CTA -->
                <div class="pt-4 border-t border-stone-100 flex items-center justify-between gap-4">
                  <div>
                    <span class="block text-xs text-stone-400 font-medium">Precio final</span>
                    <span class="text-2xl font-black text-stone-900">
                      \${{ product.price | number:'1.2-2' }}
                    </span>
                  </div>

                  <button
                    (click)="addToCart()"
                    [disabled]="product.stock <= 0"
                    class="px-6 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white font-semibold text-sm shadow-soft hover:shadow-soft-hover active:scale-95 transition-all duration-200 flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Agregar al carrito</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class ProductDetailModalComponent {
  @Input() product: Product | null = null;
  @Output() close = new EventEmitter<void>();

  public activeImage: string | null = null;
  private cartService = inject(CartService);

  @HostListener('document:keydown.escape')
  public closeOnEscape(): void {
    if (this.product) this.close.emit();
  }

  public getSpecsEntries(specs: any): { key: string; value: any }[] {
    if (!specs) return [];
    return Object.keys(specs).map((key) => ({
      key,
      value: specs[key],
    }));
  }

  public addToCart(): void {
    if (this.product) {
      this.cartService.addToCart(this.product);
      this.close.emit();
    }
  }
}
