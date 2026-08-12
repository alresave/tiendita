import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="group relative flex flex-col justify-between h-full bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/70 shadow-soft hover:shadow-soft-hover transition-all duration-300 transform hover:-translate-y-1"
    >
      <div>
        <!-- Image Container with Hover Zoom -->
        <div 
          (click)="openDetail.emit(product)"
          class="relative w-full aspect-square bg-stone-100/80 rounded-2xl overflow-hidden mb-4 cursor-pointer flex items-center justify-center p-4"
        >
          <img
            [src]="product.images[0]"
            [alt]="product.name"
            loading="lazy"
            class="w-full h-full object-contain object-center transform group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          
          <!-- Category Badge -->
          @if (product.category) {
            <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-md text-stone-700 shadow-sm border border-stone-200/50">
              {{ product.category }}
            </span>
          }

          <!-- Quick view icon overlay -->
          <div class="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span class="px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-stone-900 font-semibold text-xs shadow-md">
              Ver detalles
            </span>
          </div>
        </div>

        <!-- Meta Info -->
        <div class="flex items-center justify-between gap-2 text-xs font-mono text-stone-400 mb-1.5">
          <span>{{ product.sku }}</span>
          
          <span 
            class="font-sans font-semibold text-xs"
            [ngClass]="product.stock > 0 ? 'text-emerald-600' : 'text-rose-500'"
          >
            {{ product.stock > 0 ? 'En stock (' + product.stock + ')' : 'Agotado' }}
          </span>
        </div>

        @if (product.brand) {
          <span class="mb-2 inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-600">{{ product.brand }}</span>
        }

        <!-- Product Title -->
        <h3 
          (click)="openDetail.emit(product)"
          class="font-bold text-stone-900 text-base leading-snug mb-2 hover:text-indigo-600 cursor-pointer transition-colors line-clamp-1"
          [title]="product.name"
        >
          {{ product.name }}
        </h3>

        <!-- Description -->
        <p class="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-4">
          {{ product.description }}
        </p>
      </div>

      <!-- Footer: Price & Add to Cart CTA -->
      <div class="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <span class="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Precio</span>
          @if (product.previous_price && product.previous_price > product.price) {
            <span class="text-xs font-semibold text-stone-400 line-through">\${{ product.previous_price | number:'1.2-2' }}</span>
          }
          <span class="text-xl font-black" [ngClass]="product.previous_price && product.previous_price > product.price ? 'text-rose-600' : 'text-stone-900'">
            \${{ product.price | number:'1.2-2' }}
          </span>
        </div>

        <button
          (click)="onAddToCart($event)"
          [disabled]="product.stock <= 0"
          class="relative overflow-hidden px-4 py-2.5 rounded-2xl font-semibold text-xs bg-stone-900 hover:bg-stone-800 active:bg-stone-950 disabled:bg-stone-200 disabled:text-stone-400 text-white shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5 active:scale-95"
          [ngClass]="{ 'animate-bounce-short': isJustAdded }"
          aria-label="Agregar al carrito"
        >
          <svg 
            class="w-4 h-4 transition-transform duration-200" 
            [ngClass]="{ 'scale-125 text-emerald-400': isJustAdded }"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            stroke-width="2.5"
          >
            @if (isJustAdded) {
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            } @else {
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            }
          </svg>
          
          <span>{{ isJustAdded ? '¡Añadido!' : 'Agregar' }}</span>
        </button>
      </div>
    </div>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() openDetail = new EventEmitter<Product>();

  private cartService = inject(CartService);
  public isJustAdded = false;

  public onAddToCart(event: Event): void {
    event.stopPropagation();
    this.cartService.addToCart(this.product);
    
    // Feedback táctil instantáneo
    this.isJustAdded = true;
    setTimeout(() => {
      this.isJustAdded = false;
    }, 800);
  }
}
