import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { AuthService } from '../../../services/auth.service';
import { CategoryService } from '../../../services/category.service';
import { OrderService } from '../../../services/order.service';
import { Product } from '../../../models/product.model';
import { ProductFormComponent } from '../product-form-modal/product-form-modal.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductFormComponent],
  template: `
    @if (productService.isAdminOpen() && authService.isAuthenticated()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="admin-title" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div 
          (click)="productService.isAdminOpen.set(false)"
          class="fixed inset-0 bg-stone-900/60 backdrop-blur-md transition-opacity animate-fade-in"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
          <div 
            class="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden animate-slide-up flex flex-col max-h-[90vh]"
          >
            <!-- Top Admin Header -->
            <div class="p-6 border-b border-stone-200/70 bg-stone-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-stone-950 uppercase tracking-wider">
                    Panel Admin Autenticado
                  </span>
                  <span class="text-xs text-stone-400 font-mono">
                    {{ authService.currentUser()?.email }}
                  </span>
                </div>
                <h2 class="text-2xl font-black tracking-tight mt-1 text-white">
                  Control de Productos & Stock
                </h2>
              </div>

              <div class="flex items-center gap-3">
                <button
                  (click)="openCreateModal()"
                  class="px-4 py-2.5 rounded-2xl bg-white text-stone-900 font-bold text-xs hover:bg-stone-100 active:scale-95 shadow-md transition-all flex items-center gap-1.5"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Nuevo Producto</span>
                </button>

                <button (click)="isCategoryManagerOpen.update(value => !value)" class="px-4 py-2.5 rounded-2xl bg-stone-800 text-white font-bold text-xs hover:bg-stone-700 transition-all">
                  Categorías
                </button>
                <button (click)="toggleOrders()" class="px-4 py-2.5 rounded-2xl bg-stone-800 text-white font-bold text-xs hover:bg-stone-700 transition-all">
                  Pedidos
                </button>

                <button
                  (click)="onLogout()"
                  class="px-3 py-2 rounded-xl bg-stone-800 text-stone-300 hover:text-rose-400 hover:bg-stone-700 font-semibold text-xs transition-colors"
                  title="Cerrar sesión de administrador"
                >
                  Salir
                </button>

                <button
                  (click)="productService.isAdminOpen.set(false)"
                  class="p-2 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
                  aria-label="Cerrar panel admin"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Stats Bar -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-stone-50 border-b border-stone-100">
              <div class="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-sm">
                <span class="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Total Catálogo</span>
                <span class="text-2xl font-black text-stone-900">{{ productService.totalProductsCount() }} productos</span>
              </div>

              <div class="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-sm">
                <span class="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Stock Crítico (≤ 5)</span>
                <span class="text-2xl font-black" [ngClass]="productService.lowStockCount() > 0 ? 'text-amber-600' : 'text-emerald-600'">
                  {{ productService.lowStockCount() }} en alerta
                </span>
              </div>

              <div class="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-sm">
                <span class="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Valor Total Inventario</span>
                <span class="text-2xl font-black text-stone-900">
                  \${{ productService.totalInventoryValue() | number:'1.2-2' }}
                </span>
              </div>
            </div>

            <!-- Filter & Search Subheader -->
            @if (isCategoryManagerOpen()) {
              <section class="p-6 border-b border-stone-100 bg-stone-50">
                <div class="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
                  <div class="flex-1">
                    <label class="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Nueva categoría</label>
                    <div class="flex gap-2">
                      <input [(ngModel)]="newCategoryName" placeholder="Ej. Hogar" class="flex-1 px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900" />
                      <button (click)="createCategory()" class="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold">Agregar</button>
                    </div>
                  </div>
                  <span class="text-xs text-stone-400">Las categorías sin productos pueden eliminarse.</span>
                </div>
                <div class="flex flex-wrap gap-2 mt-4">
                  @for (category of categoryService.categories(); track category.id) {
                    <div class="inline-flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700">
                      {{ category.name }}
                      <button (click)="renameCategory(category)" class="text-stone-400 hover:text-stone-900" title="Renombrar">✎</button>
                      <button (click)="deleteCategory(category)" class="text-stone-400 hover:text-rose-600" title="Eliminar">×</button>
                    </div>
                  }
                </div>
              </section>
            }

            @if (isOrdersOpen()) {
              <section class="p-6 border-b border-stone-100 bg-stone-50">
                <div class="flex items-center justify-between mb-4"><h3 class="font-bold text-stone-900">Pedidos recientes</h3><button (click)="orderService.load()" class="text-xs font-semibold text-stone-600">Actualizar</button></div>
                @if (orderService.orders().length === 0) {
                  <p class="text-xs text-stone-500">Aún no hay pedidos.</p>
                } @else {
                  <div class="space-y-2">
                    @for (order of orderService.orders(); track order.id) {
                      <div class="bg-white border border-stone-200 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
                        <span class="font-mono font-bold text-stone-900">{{ order.order_number }}</span>
                        <span class="text-stone-500">{{ order.created_at | date:'short' }}</span>
                        <span class="font-bold ml-auto">\${{ order.total | number:'1.2-2' }}</span>
                        <select [ngModel]="order.status" (ngModelChange)="orderService.setStatus(order, $event)" class="rounded-lg border border-stone-200 px-2 py-1 text-xs">
                          <option value="pending">Pendiente</option><option value="paid">Pagado</option><option value="shipped">Enviado</option><option value="cancelled">Cancelado</option>
                        </select>
                      </div>
                    }
                  </div>
                }
              </section>
            }

            <div class="px-6 py-3 border-b border-stone-100 flex items-center justify-between gap-4 bg-white">
              <div class="relative flex-1 max-w-sm">
                <input
                  type="text"
                  [(ngModel)]="adminSearch"
                  placeholder="Filtrar por SKU o nombre..."
                  class="w-full pl-9 pr-4 py-2 text-xs bg-stone-100 rounded-xl border border-transparent focus:border-stone-300 focus:outline-none"
                />
                <svg class="w-4 h-4 text-stone-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <span class="text-xs text-stone-400">
                Mostrando {{ filteredAdminProducts().length }} ítems
              </span>
            </div>

            <!-- Products Table -->
            <div class="flex-1 overflow-y-auto p-6">
              <div class="overflow-x-auto rounded-2xl border border-stone-200/80">
                <table class="w-full text-left border-collapse text-xs">
                  <thead class="bg-stone-100 text-stone-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th class="p-3.5">Producto</th>
                      <th class="p-3.5">SKU</th>
                      <th class="p-3.5">Categoría</th>
                      <th class="p-3.5">Precio</th>
                      <th class="p-3.5">Stock</th>
                      <th class="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-stone-100 bg-white">
                    @for (product of filteredAdminProducts(); track product.id) {
                      <tr class="hover:bg-stone-50/80 transition-colors">
                        <!-- Product thumbnail & title -->
                        <td class="p-3.5 flex items-center gap-3">
                          <img 
                            [src]="product.images[0]" 
                            [alt]="product.name"
                            class="w-10 h-10 object-contain bg-stone-100 rounded-lg p-1 flex-shrink-0"
                          />
                          <div>
                            <span class="font-bold text-stone-900 block truncate max-w-xs">
                              {{ product.name }}
                            </span>
                            <span class="text-[10px] text-stone-400 truncate block max-w-xs">
                              {{ product.description }}
                            </span>
                          </div>
                        </td>

                        <!-- SKU -->
                        <td class="p-3.5 font-mono text-stone-600 font-medium">
                          {{ product.sku }}
                        </td>

                        <!-- Category -->
                        <td class="p-3.5">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                            {{ product.category || 'General' }}
                          </span>
                        </td>

                        <!-- Price -->
                        <td class="p-3.5 font-bold font-mono text-stone-900">
                          \${{ product.price | number:'1.2-2' }}
                        </td>

                        <!-- Stock Quick Adjust -->
                        <td class="p-3.5">
                          <div class="flex items-center gap-1.5">
                            <button
                              (click)="productService.adjustStock(product.id, -1)"
                              class="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center"
                              title="Reducir stock"
                            >
                              -
                            </button>

                            <span 
                              class="font-mono font-bold px-2 py-0.5 rounded text-xs"
                              [ngClass]="product.stock <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800'"
                            >
                              {{ product.stock }}
                            </span>

                            <button
                              (click)="productService.adjustStock(product.id, 1)"
                              class="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center"
                              title="Aumentar stock"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <!-- Actions -->
                        <td class="p-3.5 text-right space-x-2">
                          <button
                            (click)="openEditModal(product)"
                            class="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold transition-colors"
                          >
                            Editar
                          </button>

                          <button
                            (click)="confirmDelete(product)"
                            class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition-colors"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Modal Sub-component -->
        <app-product-form-modal
          [isOpen]="isFormModalOpen()"
          [productToEdit]="selectedProductForEdit()"
          (close)="closeFormModal()"
        ></app-product-form-modal>
      </div>
    }
  `
})
export class AdminDashboardComponent {
  public productService = inject(ProductService);
  public authService = inject(AuthService);
  public categoryService = inject(CategoryService);
  public orderService = inject(OrderService);

  public adminSearch = '';
  public isFormModalOpen = signal<boolean>(false);
  public selectedProductForEdit = signal<Product | null>(null);
  public isCategoryManagerOpen = signal<boolean>(false);
  public isOrdersOpen = signal<boolean>(false);
  public newCategoryName = '';

  public async createCategory(): Promise<void> {
    if (await this.categoryService.ensure(this.newCategoryName)) this.newCategoryName = '';
  }

  public async renameCategory(category: any): Promise<void> {
    const name = prompt('Nuevo nombre de categoría', category.name);
    if (name) await this.categoryService.rename(category, name);
  }

  public async deleteCategory(category: any): Promise<void> {
    const inUse = this.productService.products().some(product => product.category === category.name);
    if (inUse) return;
    if (confirm(`¿Eliminar la categoría "${category.name}"?`)) await this.categoryService.remove(category);
  }

  public async toggleOrders(): Promise<void> {
    this.isOrdersOpen.update(value => !value);
    if (this.isOrdersOpen()) await this.orderService.load();
  }

  public filteredAdminProducts = computed(() => {
    const all = this.productService.products();
    const query = this.adminSearch.toLowerCase().trim();

    if (!query) return all;

    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
    );
  });

  public openCreateModal(): void {
    this.selectedProductForEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  public openEditModal(product: Product): void {
    this.selectedProductForEdit.set(product);
    this.isFormModalOpen.set(true);
  }

  public closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedProductForEdit.set(null);
  }

  public async confirmDelete(product: Product): Promise<void> {
    if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      await this.productService.deleteProduct(product.id);
    }
  }

  public async onLogout(): Promise<void> {
    await this.authService.logout();
    this.productService.isAdminOpen.set(false);
  }
}
