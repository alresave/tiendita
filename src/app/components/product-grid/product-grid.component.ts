import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ProductDetailModalComponent } from '../product-detail-modal/product-detail-modal.component';
import { Product } from '../../models/product.model';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, ProductDetailModalComponent],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      <!-- Hero Banner / Header -->
      <div class="mb-8 md:mb-12 text-center max-w-2xl mx-auto">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-stone-200/60 text-stone-700 mb-3 tracking-wide uppercase">
          Diseño & Tecnología Premium
        </span>
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          Colección Exclusiva de Productos
        </h1>
        <p class="mt-3 text-sm sm:text-base text-stone-500 leading-relaxed">
          Piezas seleccionadas con materiales sostenibles, acústica afinada y acabados minimalistas para elevar tu espacio de trabajo.
        </p>
      </div>

      <!-- Category Filter Tabs -->
      <div class="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        @for (category of categories(); track category) {
          <button
            (click)="productService.selectedCategory.set(category)"
            class="px-4 py-2 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap active:scale-95"
            [ngClass]="{
              'bg-stone-900 text-white shadow-soft font-semibold': productService.selectedCategory() === category,
              'bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/80': productService.selectedCategory() !== category
            }"
          >
            {{ category }}
          </button>
        }
      </div>

      <!-- Active Search Tag Bar (if searching) -->
      @if (productService.searchQuery()) {
        <div class="mb-6 flex items-center justify-between bg-stone-100/70 p-3 rounded-2xl border border-stone-200/50">
          <div class="flex items-center gap-2 text-xs text-stone-600">
            <span>Resultados para:</span>
            <span class="font-bold text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
              "{{ productService.searchQuery() }}"
            </span>
            <span class="text-stone-400">({{ filteredProducts().length }} {{ filteredProducts().length === 1 ? 'producto' : 'productos' }})</span>
          </div>

          <button
            (click)="productService.searchQuery.set('')"
            class="text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
          >
            Limpiar filtro
          </button>
        </div>
      }

      <!-- Grid Content -->
      @if (productService.isLoading()) {
        <!-- Skeletons State -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="bg-white rounded-3xl p-5 border border-stone-200/60 shadow-soft animate-pulse flex flex-col justify-between h-96">
              <div>
                <div class="w-full aspect-square bg-stone-200/70 rounded-2xl mb-4"></div>
                <div class="h-3 bg-stone-200/70 rounded w-1/3 mb-3"></div>
                <div class="h-4 bg-stone-200/70 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-stone-200/70 rounded w-full mb-1"></div>
                <div class="h-3 bg-stone-200/70 rounded w-2/3"></div>
              </div>
              <div class="pt-4 border-t border-stone-100 flex items-center justify-between">
                <div class="h-6 bg-stone-200/70 rounded w-1/4"></div>
                <div class="h-9 bg-stone-200/70 rounded-2xl w-1/3"></div>
              </div>
            </div>
          }
        </div>
      } @else if (filteredProducts().length === 0) {
        <!-- Empty State -->
        <div class="bg-white rounded-3xl p-12 text-center max-w-lg mx-auto border border-stone-200/80 shadow-soft my-8">
          <div class="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
            <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-stone-900 mb-1">No encontramos productos</h3>
          <p class="text-xs text-stone-500 max-w-sm mx-auto mb-6">
            Intenta cambiar los términos de búsqueda o selecciona otra categoría.
          </p>
          <button
            (click)="resetFilters()"
            class="px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
          >
            Ver todos los productos
          </button>
        </div>
      } @else {
        <!-- Product Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (product of filteredProducts(); track product.id) {
            <app-product-card
              [product]="product"
              (openDetail)="selectedProductModal.set($event)"
            ></app-product-card>
          }
        </div>
      }

      <!-- Detail Modal -->
      <app-product-detail-modal
        [product]="selectedProductModal()"
        (close)="selectedProductModal.set(null)"
      ></app-product-detail-modal>
    </section>
  `
})
export class ProductGridComponent {
  public productService = inject(ProductService);
  public categoryService = inject(CategoryService);
  public selectedProductModal = signal<Product | null>(null);

  public categories = computed(() => {
    return ['Todos', ...this.categoryService.names()].sort((a, b) => {
      if (a === 'Todos') return -1;
      if (b === 'Todos') return 1;
      return a.localeCompare(b);
    });
  });

  // Computed filtering for performance
  public filteredProducts = computed(() => {
    const all = this.productService.products();
    const query = this.productService.searchQuery().toLowerCase().trim();
    const category = this.productService.selectedCategory();

    return all.filter((p) => {
      const matchesCategory =
        category === 'Todos' || p.category?.toLowerCase() === category.toLowerCase();

      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        JSON.stringify(p.specs).toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  });

  public resetFilters(): void {
    this.productService.searchQuery.set('');
    this.productService.selectedCategory.set('Todos');
  }
}
