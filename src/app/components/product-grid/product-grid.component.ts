import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ProductDetailModalComponent } from '../product-detail-modal/product-detail-modal.component';
import { Product } from '../../models/product.model';
import { CategoryService } from '../../services/category.service';
import { StorefrontSettingsService } from '../../services/storefront-settings.service';
import { StorefrontCollectionService } from '../../services/storefront-collection.service';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent, ProductDetailModalComponent],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      <!-- Hero Banner / Header -->
      <div class="mb-8 md:mb-12 text-center max-w-2xl mx-auto">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-stone-200/60 text-stone-700 mb-3 tracking-wide uppercase">
          {{ storefrontSettings.settings().heroBadge }}
        </span>
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          {{ storefrontSettings.settings().heroTitle }}
        </h1>
        <p class="mt-3 text-sm sm:text-base text-stone-500 leading-relaxed">
          {{ storefrontSettings.settings().heroTagline }}
        </p>
      </div>

      <!-- Department navigation -->
      <section class="mb-10 rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-6 shadow-sm">
        <div class="flex flex-col gap-1 border-b border-stone-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Explora la tienda</p>
            <h2 class="mt-1 text-xl font-black tracking-tight text-stone-900">Comprar por departamento</h2>
          </div>
          <p class="text-xs text-stone-500">Elige un departamento para ver su catálogo.</p>
        </div>

        <div class="mt-4 grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          @for (department of departments(); track department.name) {
          <button
            (click)="selectCategory(department.name)"
            [attr.aria-pressed]="productService.selectedCategory() === department.name"
            class="group min-h-20 sm:min-h-24 rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.98]"
            [ngClass]="{
              'border-stone-900 bg-stone-900 text-white shadow-lg': productService.selectedCategory() === department.name,
              'border-stone-200/80 bg-stone-50/50 text-stone-700 hover:border-stone-400 hover:bg-white': productService.selectedCategory() !== department.name
            }"
          >
            <span class="mb-3 flex h-8 w-8 items-center justify-center rounded-xl text-sm" [ngClass]="productService.selectedCategory() === department.name ? 'bg-white/15 text-white' : 'bg-stone-200/70 text-stone-700'">
              {{ department.name === 'Todos' ? '⌘' : '▦' }}
            </span>
            <span class="block text-sm font-bold leading-tight">{{ department.name === 'Todos' ? 'Todos los departamentos' : department.name }}</span>
            <span class="mt-1 block text-xs" [ngClass]="productService.selectedCategory() === department.name ? 'text-stone-300' : 'text-stone-500'">{{ department.count }} {{ department.count === 1 ? 'producto' : 'productos' }}</span>
          </button>
        }
        </div>
      </section>

      @if (brandStores().length > 0) {
        <section class="mb-10 rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-6 shadow-sm">
          <div class="flex flex-col gap-1 border-b border-stone-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Espacios especiales</p>
              <h2 class="mt-1 text-xl font-black tracking-tight text-stone-900">Mini tiendas por marca</h2>
            </div>
            <p class="text-xs text-stone-500">Cada marca reúne su catálogo completo.</p>
          </div>
          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @for (store of brandStores(); track store.name) {
              <button (click)="selectBrandStore(store.name)" [attr.aria-pressed]="selectedBrand() === store.name" class="min-h-28 rounded-2xl border p-4 text-left transition-all active:scale-[0.98]" [ngClass]="selectedBrand() === store.name ? 'border-stone-900 bg-stone-900 text-white shadow-lg' : 'border-stone-200 bg-stone-50/50 text-stone-700 hover:border-stone-400 hover:bg-white'">
                <span class="flex h-9 w-9 items-center justify-center rounded-xl text-sm" [ngClass]="selectedBrand() === store.name ? 'bg-white/15 text-white' : 'bg-stone-200/70 text-stone-700'" aria-hidden="true">◇</span>
                <span class="mt-3 block text-base font-black">{{ store.name }}</span>
                <span class="mt-1 block text-xs" [ngClass]="selectedBrand() === store.name ? 'text-stone-300' : 'text-stone-500'">{{ store.count }} {{ store.count === 1 ? 'producto' : 'productos' }}</span>
              </button>
            }
          </div>
        </section>
      }

      @if (collectionService.collections().length > 0) {
        <section class="mb-10 rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-6 shadow-sm">
          <div class="flex flex-col gap-1 border-b border-stone-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p class="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Selecciones curadas</p><h2 class="mt-1 text-xl font-black tracking-tight text-stone-900">Mini tiendas</h2></div>
            <p class="text-xs text-stone-500">Colecciones creadas por nuestro equipo.</p>
          </div>
          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @for (collection of collectionService.collections(); track collection.id) {
              <button (click)="selectCollection(collection.id)" [attr.aria-pressed]="selectedCollectionId() === collection.id" class="rounded-2xl border p-4 text-left transition-all active:scale-[0.98]" [ngClass]="selectedCollectionId() === collection.id ? 'border-stone-900 bg-stone-900 text-white shadow-lg' : 'border-stone-200 bg-stone-50/50 text-stone-700 hover:border-stone-400 hover:bg-white'">
                <span class="block text-base font-black">{{ collection.name }}</span>
                @if (collection.description) { <span class="mt-1 block text-xs leading-relaxed" [ngClass]="selectedCollectionId() === collection.id ? 'text-stone-300' : 'text-stone-500'">{{ collection.description }}</span> }
                <span class="mt-3 block text-xs font-semibold" [ngClass]="selectedCollectionId() === collection.id ? 'text-stone-300' : 'text-stone-500'">{{ collection.productIds.length }} {{ collection.productIds.length === 1 ? 'producto' : 'productos' }}</span>
              </button>
            }
          </div>
        </section>
      }

      <!-- Active Search Tag Bar (if searching) -->
      @if (productService.searchQuery() || selectedBrand() || selectedCollectionId()) {
        <div class="mb-6 flex flex-col gap-3 bg-stone-100/70 p-3 rounded-2xl border border-stone-200/50 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-wrap items-center gap-2 text-xs text-stone-600">
            @if (productService.searchQuery()) {
              <span>Resultados para:</span>
              <span class="font-bold text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
              "{{ productService.searchQuery() }}"
              </span>
            }
            @if (selectedBrand()) {
              <span class="font-bold text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200">Mini tienda: {{ selectedBrand() }}</span>
            }
            @if (selectedCollection()) {
              <span class="font-bold text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200">Mini tienda: {{ selectedCollection()!.name }}</span>
            }
            <span class="text-stone-400">({{ filteredProducts().length }} {{ filteredProducts().length === 1 ? 'producto' : 'productos' }})</span>
          </div>

          <button
            (click)="resetFilters()"
            class="text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
          >
            Limpiar filtro
          </button>
        </div>
      }

      <section class="mb-6 rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="catalog-filters-title">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="catalog-filters-title" class="text-base font-black text-stone-900">Filtrar y ordenar</h2>
            <p class="mt-1 text-xs text-stone-500">{{ filteredProducts().length }} productos encontrados.</p>
          </div>
          <button (click)="resetCatalogControls()" class="min-h-11 text-sm font-semibold text-stone-500 transition-colors hover:text-stone-900">Restablecer</button>
        </div>
        <div class="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-5">
          <label class="text-xs font-semibold text-stone-600">Precio mínimo
            <input type="number" min="0" [(ngModel)]="minPrice" (ngModelChange)="resetPage()" placeholder="$0" class="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900" />
          </label>
          <label class="text-xs font-semibold text-stone-600">Precio máximo
            <input type="number" min="0" [(ngModel)]="maxPrice" (ngModelChange)="resetPage()" placeholder="Sin límite" class="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900" />
          </label>
          <label class="text-xs font-semibold text-stone-600">Disponibilidad
            <select [(ngModel)]="availability" (ngModelChange)="resetPage()" class="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900">
              <option value="all">Todo el catálogo</option><option value="in-stock">Disponible</option><option value="out-of-stock">Agotado</option>
            </select>
          </label>
          <label class="text-xs font-semibold text-stone-600 lg:col-span-2">Ordenar por
            <select [(ngModel)]="sortBy" (ngModelChange)="resetPage()" class="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900">
              <option value="featured">Destacados</option><option value="price-asc">Precio: menor a mayor</option><option value="price-desc">Precio: mayor a menor</option><option value="name">Nombre: A–Z</option>
            </select>
          </label>
        </div>
      </section>

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
          <h3 class="text-lg font-bold text-stone-900 mb-1">{{ storefrontSettings.settings().emptyTitle }}</h3>
          <p class="text-xs text-stone-500 max-w-sm mx-auto mb-6">
            {{ storefrontSettings.settings().emptyDescription }}
          </p>
          <button
            (click)="resetFilters()"
            class="px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
          >
            {{ storefrontSettings.settings().emptyAction }}
          </button>
        </div>
      } @else {
        <!-- Product Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (product of pagedProducts(); track product.id) {
            <app-product-card
              [product]="product"
              (openDetail)="selectedProductModal.set($event)"
            ></app-product-card>
          }
        </div>
        @if (totalPages() > 1) {
          <nav class="mt-8 flex items-center justify-center gap-3" aria-label="Paginación del catálogo">
            <button (click)="goToPage(displayPage() - 1)" [disabled]="displayPage() === 1" class="min-h-11 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
            <span class="text-sm font-semibold text-stone-600">Página {{ displayPage() }} de {{ totalPages() }}</span>
            <button (click)="goToPage(displayPage() + 1)" [disabled]="displayPage() === totalPages()" class="min-h-11 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 disabled:cursor-not-allowed disabled:opacity-40">Siguiente</button>
          </nav>
        }
      }

      <!-- Detail Modal -->
      @defer (when selectedProductModal()) {
        <app-product-detail-modal
          [product]="selectedProductModal()"
          (close)="selectedProductModal.set(null)"
        ></app-product-detail-modal>
      }
    </section>
  `
})
export class ProductGridComponent {
  public productService = inject(ProductService);
  public categoryService = inject(CategoryService);
  public storefrontSettings = inject(StorefrontSettingsService);
  public collectionService = inject(StorefrontCollectionService);
  public selectedProductModal = signal<Product | null>(null);
  public selectedBrand = signal<string | null>(null);
  public selectedCollectionId = signal<string | null>(null);
  public minPrice: number | null = null;
  public maxPrice: number | null = null;
  public availability: 'all' | 'in-stock' | 'out-of-stock' = 'all';
  public sortBy: 'featured' | 'price-asc' | 'price-desc' | 'name' = 'featured';
  public currentPage = signal(1);
  public readonly pageSize = 12;

  constructor() {
    void this.storefrontSettings.load();
  }

  public categories = computed(() => {
    return ['Todos', ...this.categoryService.names()].sort((a, b) => {
      if (a === 'Todos') return -1;
      if (b === 'Todos') return 1;
      return a.localeCompare(b);
    });
  });

  public departments = computed(() => {
    const products = this.productService.products();
    return this.categories().map(name => ({
      name,
      count: name === 'Todos'
        ? products.length
        : products.filter(product => product.category?.toLowerCase() === name.toLowerCase()).length,
    }));
  });

  public brandStores = computed(() => {
    const grouped = new Map<string, number>();
    for (const product of this.productService.products()) {
      const brand = product.brand?.trim();
      if (brand) grouped.set(brand, (grouped.get(brand) ?? 0) + 1);
    }
    return [...grouped.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  public selectedCollection = computed(() => this.collectionService.collections().find(collection => collection.id === this.selectedCollectionId()) ?? null);

  // Computed filtering for performance
  public filteredProducts = computed(() => {
    const all = this.productService.products().filter((product) => product.is_active !== false);
    const query = this.productService.searchQuery().toLowerCase().trim();
    const category = this.productService.selectedCategory();
    const brand = this.selectedBrand()?.toLowerCase();
    const collection = this.selectedCollection();

    return all.filter((p) => {
      const matchesCategory =
        category === 'Todos' || p.category?.toLowerCase() === category.toLowerCase();

      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        JSON.stringify(p.specs).toLowerCase().includes(query);

      const matchesBrand = !brand || p.brand?.toLowerCase() === brand;
      const matchesCollection = !collection || collection.productIds.includes(p.id);

      const matchesMinimum = this.minPrice === null || this.minPrice === undefined || p.price >= this.minPrice;
      const matchesMaximum = this.maxPrice === null || this.maxPrice === undefined || p.price <= this.maxPrice;
      const matchesAvailability = this.availability === 'all' || (this.availability === 'in-stock' ? p.stock > 0 : p.stock <= 0);
      return matchesCategory && matchesQuery && matchesBrand && matchesCollection && matchesMinimum && matchesMaximum && matchesAvailability;
    });
  });

  public sortedProducts = computed(() => {
    const products = [...this.filteredProducts()];
    if (this.sortBy === 'price-asc') return products.sort((a, b) => a.price - b.price);
    if (this.sortBy === 'price-desc') return products.sort((a, b) => b.price - a.price);
    if (this.sortBy === 'name') return products.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return products;
  });

  public totalPages = computed(() => Math.max(1, Math.ceil(this.sortedProducts().length / this.pageSize)));
  public displayPage = computed(() => Math.min(this.currentPage(), this.totalPages()));
  public pagedProducts = computed(() => {
    const start = (this.displayPage() - 1) * this.pageSize;
    return this.sortedProducts().slice(start, start + this.pageSize);
  });

  public resetFilters(): void {
    this.productService.searchQuery.set('');
    this.productService.selectedCategory.set('Todos');
    this.selectedBrand.set(null);
    this.selectedCollectionId.set(null);
    this.resetCatalogControls();
  }

  public resetCatalogControls(): void {
    this.minPrice = null;
    this.maxPrice = null;
    this.availability = 'all';
    this.sortBy = 'featured';
    this.resetPage();
  }

  public resetPage(): void { this.currentPage.set(1); }
  public goToPage(page: number): void { this.currentPage.set(Math.max(1, Math.min(page, this.totalPages()))); }
  public selectCategory(category: string): void { this.productService.selectedCategory.set(category); this.resetPage(); }

  public selectBrandStore(brand: string): void {
    this.selectedBrand.set(this.selectedBrand() === brand ? null : brand);
    this.productService.selectedCategory.set('Todos');
    this.selectedCollectionId.set(null);
    this.resetPage();
  }

  public selectCollection(collectionId: string): void {
    this.selectedCollectionId.set(this.selectedCollectionId() === collectionId ? null : collectionId);
    this.selectedBrand.set(null);
    this.productService.selectedCategory.set('Todos');
    this.resetPage();
  }
}
