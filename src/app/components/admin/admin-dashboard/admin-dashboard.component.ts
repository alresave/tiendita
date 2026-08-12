import { Component, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { AuthService } from '../../../services/auth.service';
import { CategoryService } from '../../../services/category.service';
import { OrderService } from '../../../services/order.service';
import { Product } from '../../../models/product.model';
import { ProductFormComponent } from '../product-form-modal/product-form-modal.component';
import { StorefrontSettingsService } from '../../../services/storefront-settings.service';
import { STOREFRONT_THEMES, StorefrontSettings, StorefrontTheme } from '../../../models/storefront-settings.model';
import { StorefrontCollectionService } from '../../../services/storefront-collection.service';
import { StorefrontCollection } from '../../../models/storefront-collection.model';
import { FocusTrapDirective } from '../../../directives/focus-trap.directive';

type AdminView = 'inventory' | 'categories' | 'orders' | 'content' | 'themes' | 'collections' | 'administrators';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductFormComponent, FocusTrapDirective],
  template: `
    @if (productService.isAdminOpen() && authService.isAuthenticated()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="admin-title" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div 
          (click)="productService.isAdminOpen.set(false)"
          class="fixed inset-0 hidden bg-stone-900/60 backdrop-blur-md transition-opacity animate-fade-in sm:block"
        ></div>

        <div class="flex min-h-[100dvh] items-stretch justify-center sm:min-h-full sm:items-center sm:p-6 lg:p-8">
          <div appFocusTrap id="admin-content"
            class="relative flex h-[100dvh] w-full flex-col overflow-y-auto bg-white animate-slide-up sm:h-auto sm:min-h-0 sm:max-h-[90vh] sm:max-w-6xl sm:overflow-hidden sm:rounded-3xl sm:border sm:border-stone-100 sm:shadow-2xl"
          >
            <!-- Top Admin Header -->
            <div class="sticky top-0 z-10 border-b border-stone-200/70 bg-stone-900 p-4 text-white sm:static sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-6">
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

              <div class="mt-4 flex w-full gap-2 overflow-x-auto pb-1 sm:mt-0 sm:w-auto sm:flex-wrap sm:items-center sm:gap-3 sm:overflow-visible sm:pb-0">
                <button
                  (click)="openCreateModal()"
                  class="flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-stone-900 shadow-md transition-all active:scale-95 hover:bg-stone-100 sm:text-xs"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Nuevo Producto</span>
                </button>

                <button (click)="selectView('inventory')" [attr.aria-current]="activeView() === 'inventory' ? 'page' : null" [ngClass]="activeView() === 'inventory' ? 'bg-white text-stone-900' : 'bg-stone-800 text-white hover:bg-stone-700'" class="min-h-11 shrink-0 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all sm:px-4 sm:text-xs">
                  <span aria-hidden="true">▦</span> Productos
                </button>

                <button (click)="selectView('categories')" [attr.aria-current]="activeView() === 'categories' ? 'page' : null" [ngClass]="activeView() === 'categories' ? 'bg-white text-stone-900' : 'bg-stone-800 text-white hover:bg-stone-700'" class="min-h-11 shrink-0 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all sm:px-4 sm:text-xs">
                  <span aria-hidden="true">⌘</span> Categorías
                </button>
                <button (click)="selectView('orders')" [attr.aria-current]="activeView() === 'orders' ? 'page' : null" [ngClass]="activeView() === 'orders' ? 'bg-white text-stone-900' : 'bg-stone-800 text-white hover:bg-stone-700'" class="min-h-11 shrink-0 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all sm:px-4 sm:text-xs">
                  <span aria-hidden="true">□</span> Pedidos
                </button>
                <button (click)="selectView('content')" [attr.aria-current]="activeView() === 'content' ? 'page' : null" [ngClass]="activeView() === 'content' ? 'bg-white text-stone-900' : 'bg-stone-800 text-white hover:bg-stone-700'" class="min-h-11 shrink-0 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all sm:px-4 sm:text-xs">
                  <span aria-hidden="true">⌂</span> Inicio
                </button>
                <button (click)="selectView('themes')" [attr.aria-current]="activeView() === 'themes' ? 'page' : null" [ngClass]="activeView() === 'themes' ? 'bg-white text-stone-900' : 'bg-stone-800 text-white hover:bg-stone-700'" class="min-h-11 shrink-0 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all sm:px-4 sm:text-xs">
                  <span aria-hidden="true">◐</span> Temas
                </button>
                <button (click)="selectView('collections')" [attr.aria-current]="activeView() === 'collections' ? 'page' : null" [ngClass]="activeView() === 'collections' ? 'bg-white text-stone-900' : 'bg-stone-800 text-white hover:bg-stone-700'" class="min-h-11 shrink-0 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all sm:px-4 sm:text-xs">
                  <span aria-hidden="true">◇</span> Mini tiendas
                </button>
                <button (click)="selectView('administrators')" [attr.aria-current]="activeView() === 'administrators' ? 'page' : null" [ngClass]="activeView() === 'administrators' ? 'bg-white text-stone-900' : 'bg-stone-800 text-white hover:bg-stone-700'" class="min-h-11 shrink-0 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all sm:px-4 sm:text-xs">
                  <span aria-hidden="true">♙</span> Administradores
                </button>

                <button
                  (click)="onLogout()"
                  class="min-h-11 rounded-xl bg-stone-800 px-3 py-2 text-sm font-semibold text-stone-300 transition-colors hover:bg-stone-700 hover:text-rose-400 sm:text-xs"
                  title="Cerrar sesión de administrador"
                >
                  Salir
                </button>

                <button
                  (click)="productService.isAdminOpen.set(false)"
                  class="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-stone-800 text-stone-300 transition-colors hover:bg-stone-700 hover:text-white"
                  aria-label="Cerrar panel admin"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Stats Bar -->
            <div [ngClass]="activeView() === 'inventory' ? 'grid' : 'hidden sm:grid'" class="grid-cols-3 gap-2 border-b border-stone-100 bg-stone-50 p-3 sm:gap-4 sm:p-6">
              <div class="rounded-2xl border border-stone-200/70 bg-white p-3 shadow-sm sm:p-4">
                <span class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-stone-400 sm:text-xs sm:tracking-wider">Catálogo</span>
                <span class="block text-base font-black text-stone-900 sm:text-2xl">{{ productService.totalProductsCount() }}<span class="hidden sm:inline"> productos</span></span>
              </div>

              <div class="rounded-2xl border border-stone-200/70 bg-white p-3 shadow-sm sm:p-4">
                <span class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-stone-400 sm:text-xs sm:tracking-wider">Stock crítico</span>
                <span class="block text-base font-black sm:text-2xl" [ngClass]="productService.lowStockCount() > 0 ? 'text-amber-600' : 'text-emerald-600'">
                  {{ productService.lowStockCount() }}<span class="hidden sm:inline"> en alerta</span>
                </span>
              </div>

              <div class="rounded-2xl border border-stone-200/70 bg-white p-3 shadow-sm sm:p-4">
                <span class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-stone-400 sm:text-xs sm:tracking-wider">Inventario</span>
                <span class="block truncate text-base font-black text-stone-900 sm:text-2xl">
                  \${{ productService.totalInventoryValue() | number:'1.2-2' }}
                </span>
              </div>
            </div>

            <!-- Filter & Search Subheader -->
            @if (activeView() === 'categories') {
              <section class="min-h-full flex-1 bg-stone-50 p-4 sm:min-h-0 sm:flex-none sm:border-b sm:border-stone-100 sm:p-6">
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

            @if (activeView() === 'orders') {
              <section class="min-h-full flex-1 bg-stone-50 p-4 sm:min-h-0 sm:flex-none sm:border-b sm:border-stone-100 sm:p-6">
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

            @if (activeView() === 'content') {
              <section class="min-h-full flex-1 bg-stone-50 p-4 sm:min-h-0 sm:flex-none sm:border-b sm:border-stone-100 sm:p-6">
                <div class="flex items-center justify-between gap-3 mb-4">
                  <div><h3 class="font-bold text-stone-900">Contenido de inicio</h3><p class="text-xs text-stone-500 mt-1">Edita los mensajes visibles en la página principal.</p></div>
                  <button (click)="saveStorefrontContent()" class="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold">Guardar cambios</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label class="text-xs font-semibold text-stone-600">Distintivo<input [(ngModel)]="storefrontDraft.heroBadge" class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-normal" /></label>
                  <label class="text-xs font-semibold text-stone-600">Título<input [(ngModel)]="storefrontDraft.heroTitle" class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-normal" /></label>
                  <label class="text-xs font-semibold text-stone-600 md:col-span-2">Tagline / descripción<textarea [(ngModel)]="storefrontDraft.heroTagline" rows="2" class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-normal"></textarea></label>
                  <label class="text-xs font-semibold text-stone-600">Título sin resultados<input [(ngModel)]="storefrontDraft.emptyTitle" class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-normal" /></label>
                  <label class="text-xs font-semibold text-stone-600">Botón sin resultados<input [(ngModel)]="storefrontDraft.emptyAction" class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-normal" /></label>
                  <label class="text-xs font-semibold text-stone-600 md:col-span-2">Mensaje sin resultados<textarea [(ngModel)]="storefrontDraft.emptyDescription" rows="2" class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-normal"></textarea></label>
                </div>
              </section>
            }

            @if (activeView() === 'themes') {
              <section class="min-h-full flex-1 bg-stone-50 p-4 sm:min-h-0 sm:flex-none sm:border-b sm:border-stone-100 sm:p-6">
                <div class="flex items-center justify-between gap-3 mb-4">
                  <div><h3 class="font-bold text-stone-900">Apariencia de la tienda</h3><p class="text-xs text-stone-500 mt-1">El tema elegido se publica para todos los visitantes.</p></div>
                  <button (click)="saveTheme()" class="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold">Guardar tema</button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  @for (theme of storefrontThemes; track theme.id) {
                    <button (click)="themeDraft = theme.id" class="text-left rounded-2xl border-2 p-3 transition-all" [ngClass]="themeDraft === theme.id ? 'border-stone-900 bg-white shadow-sm' : 'border-stone-200 bg-white/70 hover:border-stone-400'">
                      <span class="block h-10 rounded-xl mb-3" [ngClass]="themePreviewClass(theme.id)"></span>
                      <span class="block text-sm font-bold text-stone-900">{{ theme.name }}</span>
                      <span class="block text-xs text-stone-500 mt-1">{{ theme.description }}</span>
                    </button>
                  }
                </div>
              </section>
            }

            @if (activeView() === 'collections') {
              <section class="min-h-full flex-1 bg-stone-50 p-4 sm:min-h-0 sm:flex-none sm:border-b sm:border-stone-100 sm:p-6">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label class="flex-1 text-xs font-semibold text-stone-600">Nombre de la mini tienda<input [(ngModel)]="newCollectionName" class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-normal" placeholder="Ej. Regalos para oficina" /></label>
                  <label class="flex-1 text-xs font-semibold text-stone-600">Descripción (opcional)<input [(ngModel)]="newCollectionDescription" class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-normal" placeholder="Una selección especial" /></label>
                  <button (click)="createCollection()" class="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold">Crear</button>
                </div>
                @if (collectionService.collections().length === 0) {
                  <p class="mt-4 text-xs text-stone-500">Crea una mini tienda para seleccionar sus productos manualmente.</p>
                } @else {
                  <div class="mt-4 flex flex-wrap gap-2">
                    @for (collection of collectionService.collections(); track collection.id) {
                      <button (click)="selectedCollectionForEditId = collection.id" class="rounded-xl border px-3 py-2 text-left text-xs" [ngClass]="selectedCollectionForEditId === collection.id ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-700'">{{ collection.name }} <span class="opacity-70">({{ collection.productIds.length }})</span></button>
                    }
                  </div>
                  @if (collectionForEdit()) {
                    <div class="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
                      <div class="mb-3 flex items-center justify-between gap-3"><div><h3 class="font-bold text-stone-900">{{ collectionForEdit()!.name }}</h3><p class="text-xs text-stone-500">Marca los productos que formarán parte de esta mini tienda.</p></div><button (click)="deleteCollection(collectionForEdit()!)" class="text-xs font-semibold text-rose-600">Eliminar mini tienda</button></div>
                      <div class="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                        @for (product of productService.products(); track product.id) {
                          <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-100 p-2 text-xs hover:bg-stone-50"><input type="checkbox" [checked]="collectionForEdit()!.productIds.includes(product.id)" (change)="toggleCollectionProduct(product.id)" /><span class="min-w-0"><span class="block truncate font-semibold text-stone-800">{{ product.name }}</span><span class="text-stone-400">{{ product.category }}</span></span></label>
                        }
                      </div>
                    </div>
                  }
                }
              </section>
            }

            @if (activeView() === 'administrators') {
              <section class="min-h-full flex-1 bg-stone-50 p-4 sm:min-h-0 sm:flex-none sm:border-b sm:border-stone-100 sm:p-6">
                <h3 class="font-bold text-stone-900">Agregar administrador</h3>
                <p class="text-xs text-stone-500 mt-1 mb-3">Enviaremos una invitación para que esta persona cree su contraseña y acceda al panel.</p>
                <div class="flex flex-col sm:flex-row gap-2 max-w-xl">
                  <input [(ngModel)]="newAdminEmail" type="email" placeholder="admin@tu-dominio.com" class="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm" />
                  <button (click)="inviteAdmin()" [disabled]="isInvitingAdmin()" class="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold disabled:opacity-50">{{ isInvitingAdmin() ? 'Enviando…' : 'Enviar invitación' }}</button>
                </div>
              </section>
            }

            @if (activeView() === 'inventory') {
            <div class="flex items-center justify-between gap-3 border-b border-stone-100 bg-white px-4 py-3 sm:px-6">
              <div class="relative flex-1 max-w-sm">
                <input
                  type="text"
                  [(ngModel)]="adminSearch"
                  placeholder="Filtrar por SKU o nombre..."
                  class="w-full rounded-xl border border-transparent bg-stone-100 py-2.5 pl-9 pr-4 text-sm focus:border-stone-300 focus:outline-none sm:text-xs"
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
            <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div class="space-y-3 sm:hidden">
                @for (product of filteredAdminProducts(); track product.id) {
                  <article class="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
                    <div class="flex items-start gap-3">
                      <img [src]="product.images[0]" [alt]="product.name" class="h-14 w-14 shrink-0 rounded-xl bg-stone-100 object-contain p-1" />
                      <div class="min-w-0 flex-1">
                        <h3 class="truncate text-sm font-bold text-stone-900">{{ product.name }}</h3>
                        <p class="mt-0.5 text-xs text-stone-500">{{ product.sku }} · {{ product.category || 'General' }} @if (product.is_active === false) { · Oculto }</p>
                        <p class="mt-1 font-mono text-sm font-bold text-stone-900">\${{ product.price | number:'1.2-2' }}</p>
                      </div>
                    </div>
                    <div class="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                      <div class="flex items-center gap-2" aria-label="Ajustar stock">
                        <button (click)="productService.adjustStock(product.id, -1)" class="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-lg font-bold text-stone-700 transition-colors hover:bg-stone-200" [attr.aria-label]="'Reducir stock de ' + product.name">−</button>
                        <span class="min-w-11 rounded-lg px-2 py-2 text-center font-mono text-sm font-bold" [ngClass]="product.stock <= (product.low_stock_threshold ?? 5) ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800'">{{ product.stock }}</span>
                        <button (click)="productService.adjustStock(product.id, 1)" class="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-lg font-bold text-stone-700 transition-colors hover:bg-stone-200" [attr.aria-label]="'Aumentar stock de ' + product.name">+</button>
                      </div>
                      <div class="flex w-full gap-2 min-[380px]:w-auto">
                        <button (click)="openEditModal(product)" class="min-h-11 flex-1 rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-200 min-[380px]:flex-none">Editar</button>
                        <button (click)="requestDelete(product)" class="min-h-11 flex-1 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 min-[380px]:flex-none">Eliminar</button>
                      </div>
                    </div>
                  </article>
                }
              </div>

              <div class="hidden overflow-x-auto rounded-2xl border border-stone-200/80 sm:block">
                <table class="w-full text-left border-collapse text-xs">
                  <thead class="bg-stone-100 text-stone-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th class="p-3.5">Producto</th>
                      <th class="p-3.5">SKU</th>
                      <th class="p-3.5">Categoría</th>
                      <th class="p-3.5">Marca</th>
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

                        <td class="p-3.5 text-stone-600">{{ product.brand || '—' }}</td>

                        <!-- Price -->
                        <td class="p-3.5 font-bold font-mono text-stone-900">
                          \${{ product.price | number:'1.2-2' }}
                        </td>

                        <!-- Stock Quick Adjust -->
                        <td class="p-3.5">
                          <div class="flex items-center gap-1.5">
                            <button
                              (click)="productService.adjustStock(product.id, -1)"
                              class="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 font-bold text-stone-700 hover:bg-stone-200"
                              title="Reducir stock"
                            >
                              -
                            </button>

                            <span 
                              class="font-mono font-bold px-2 py-0.5 rounded text-xs"
                              [ngClass]="product.stock <= (product.low_stock_threshold ?? 5) ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800'"
                            >
                              {{ product.stock }}
                            </span>

                            <button
                              (click)="productService.adjustStock(product.id, 1)"
                              class="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 font-bold text-stone-700 hover:bg-stone-200"
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
                            class="min-h-11 rounded-xl bg-stone-100 px-3 py-2 font-semibold text-stone-800 transition-colors hover:bg-stone-200"
                          >
                            Editar
                          </button>

                          <button
                            (click)="requestDelete(product)"
                            class="min-h-11 rounded-xl bg-rose-50 px-3 py-2 font-semibold text-rose-700 transition-colors hover:bg-rose-100"
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
            }
          </div>
        </div>

        <!-- Form Modal Sub-component -->
        <app-product-form-modal
          [isOpen]="isFormModalOpen()"
          [productToEdit]="selectedProductForEdit()"
          (close)="closeFormModal()"
        ></app-product-form-modal>

        @if (productPendingDelete()) {
          <div class="fixed inset-0 z-[60] flex items-end bg-stone-900/60 p-4 sm:items-center sm:justify-center sm:p-6" role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title">
            <div appFocusTrap class="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-lg text-rose-700" aria-hidden="true">!</div>
              <h2 id="delete-product-title" class="mt-4 text-lg font-black text-stone-900">¿Eliminar producto?</h2>
              <p class="mt-2 text-sm leading-relaxed text-stone-600">Eliminarás <span class="font-bold text-stone-900">{{ productPendingDelete()!.name }}</span> del catálogo. Esta acción no se puede deshacer.</p>
              <div class="mt-6 grid grid-cols-2 gap-3">
                <button (click)="cancelDelete()" [disabled]="isDeletingProduct()" class="min-h-11 rounded-xl border border-stone-200 px-4 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50">Cancelar</button>
                <button (click)="deleteSelectedProduct()" [disabled]="isDeletingProduct()" class="min-h-11 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-50">{{ isDeletingProduct() ? 'Eliminando…' : 'Eliminar' }}</button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class AdminDashboardComponent {
  public productService = inject(ProductService);
  public authService = inject(AuthService);
  public categoryService = inject(CategoryService);
  public orderService = inject(OrderService);
  public storefrontSettingsService = inject(StorefrontSettingsService);
  public collectionService = inject(StorefrontCollectionService);

  public activeView = signal<AdminView>(this.getSavedView());

  public adminSearch = '';
  public isFormModalOpen = signal<boolean>(false);
  public selectedProductForEdit = signal<Product | null>(null);
  public productPendingDelete = signal<Product | null>(null);
  public isDeletingProduct = signal<boolean>(false);
  public isCategoryManagerOpen = signal<boolean>(false);
  public isOrdersOpen = signal<boolean>(false);
  public isContentManagerOpen = signal<boolean>(false);
  public isThemeManagerOpen = signal<boolean>(false);
  public isCollectionManagerOpen = signal<boolean>(false);
  public isAdminManagerOpen = signal<boolean>(false);
  public isInvitingAdmin = signal<boolean>(false);
  public newCategoryName = '';
  public newAdminEmail = '';
  public storefrontDraft: StorefrontSettings = { ...this.storefrontSettingsService.settings() };
  public themeDraft: StorefrontTheme = this.storefrontSettingsService.settings().theme;
  public storefrontThemes = STOREFRONT_THEMES;
  public newCollectionName = '';
  public newCollectionDescription = '';
  public selectedCollectionForEditId: string | null = null;

  private getSavedView(): AdminView {
    if (typeof localStorage === 'undefined') return 'inventory';
    const value = localStorage.getItem('tiendita.admin-view');
    return ['inventory', 'categories', 'orders', 'content', 'themes', 'collections', 'administrators'].includes(value ?? '')
      ? value as AdminView
      : 'inventory';
  }

  @HostListener('document:keydown.escape')
  public closeOnEscape(): void {
    if (this.isFormModalOpen()) {
      this.closeFormModal();
    } else if (this.productPendingDelete()) {
      this.cancelDelete();
    } else if (this.productService.isAdminOpen()) {
      this.productService.isAdminOpen.set(false);
    }
  }

  public selectView(view: AdminView): void {
    this.activeView.set(view);
    localStorage.setItem('tiendita.admin-view', view);

    if (view === 'content') this.storefrontDraft = { ...this.storefrontSettingsService.settings() };
    if (view === 'themes') this.themeDraft = this.storefrontSettingsService.settings().theme;
    if (view === 'collections' && !this.selectedCollectionForEditId) {
      this.selectedCollectionForEditId = this.collectionService.collections()[0]?.id ?? null;
    }
    if (view === 'orders') void this.orderService.load();

    queueMicrotask(() => document.getElementById('admin-content')?.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  public async saveStorefrontContent(): Promise<void> {
    await this.storefrontSettingsService.save(this.storefrontDraft);
  }

  public toggleContentManager(): void {
    this.isContentManagerOpen.update(value => !value);
    if (this.isContentManagerOpen()) this.storefrontDraft = { ...this.storefrontSettingsService.settings() };
  }

  public toggleThemeManager(): void {
    this.isThemeManagerOpen.update(value => !value);
    if (this.isThemeManagerOpen()) this.themeDraft = this.storefrontSettingsService.settings().theme;
  }

  public async saveTheme(): Promise<void> {
    const current = this.storefrontSettingsService.settings();
    await this.storefrontSettingsService.save({ ...current, theme: this.themeDraft });
  }

  public themePreviewClass(theme: StorefrontTheme): string {
    return `theme-preview-${theme}`;
  }

  public toggleCollectionManager(): void {
    this.isCollectionManagerOpen.update(value => !value);
    if (this.isCollectionManagerOpen() && !this.selectedCollectionForEditId) this.selectedCollectionForEditId = this.collectionService.collections()[0]?.id ?? null;
  }

  public collectionForEdit = computed(() => this.collectionService.collections().find(collection => collection.id === this.selectedCollectionForEditId) ?? null);

  public async createCollection(): Promise<void> {
    if (await this.collectionService.create(this.newCollectionName, this.newCollectionDescription)) {
      this.selectedCollectionForEditId = this.collectionService.collections().at(-1)?.id ?? null;
      this.newCollectionName = '';
      this.newCollectionDescription = '';
    }
  }

  public async toggleCollectionProduct(productId: string): Promise<void> {
    const collection = this.collectionForEdit();
    if (collection) await this.collectionService.toggleProduct(collection, productId);
  }

  public async deleteCollection(collection: StorefrontCollection): Promise<void> {
    if (confirm(`¿Eliminar la mini tienda "${collection.name}"?`)) {
      if (await this.collectionService.remove(collection)) this.selectedCollectionForEditId = this.collectionService.collections()[0]?.id ?? null;
    }
  }

  public async inviteAdmin(): Promise<void> {
    this.isInvitingAdmin.set(true);
    const invited = await this.authService.inviteAdmin(this.newAdminEmail);
    this.isInvitingAdmin.set(false);
    if (invited) this.newAdminEmail = '';
  }

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
        p.category?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query)
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

  public requestDelete(product: Product): void {
    this.productPendingDelete.set(product);
  }

  public cancelDelete(): void {
    if (!this.isDeletingProduct()) this.productPendingDelete.set(null);
  }

  public async deleteSelectedProduct(): Promise<void> {
    const product = this.productPendingDelete();
    if (!product || this.isDeletingProduct()) return;
    this.isDeletingProduct.set(true);
    const deleted = await this.productService.deleteProduct(product.id);
    this.isDeletingProduct.set(false);
    if (deleted) this.productPendingDelete.set(null);
  }

  public async onLogout(): Promise<void> {
    await this.authService.logout();
    this.productService.isAdminOpen.set(false);
  }
}
