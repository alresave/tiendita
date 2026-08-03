import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductSpecs } from '../../../models/product.model';
import { ProductService } from '../../../services/product.service';

interface SpecRow {
  key: string;
  value: string;
}

@Component({
  selector: 'app-product-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div 
          (click)="close.emit()"
          class="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
          <div 
            class="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-stone-100 animate-slide-up p-6 sm:p-8"
          >
            <!-- Header -->
            <div class="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-stone-900 leading-tight">
                    {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
                  </h3>
                  <p class="text-xs text-stone-500 mt-0.5">
                    {{ isEditing ? 'Modifica los detalles del producto en la base de datos.' : 'Añade un nuevo producto al catálogo de Supabase.' }}
                  </p>
                </div>
              </div>

              <button
                (click)="close.emit()"
                class="p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                aria-label="Cerrar modal"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Form -->
            <form (ngSubmit)="onSubmit()" class="space-y-5">
              
              <!-- SKU & Category -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">SKU *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.sku"
                    name="sku"
                    required
                    placeholder="Ej: AUD-ANC-01"
                    class="w-full px-3.5 py-2.5 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Categoría *</label>
                  <select
                    [(ngModel)]="formData.category"
                    name="category"
                    required
                    class="w-full px-3.5 py-2.5 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:outline-none"
                  >
                    <option value="Audio">Audio</option>
                    <option value="Periféricos">Periféricos</option>
                    <option value="Iluminación">Iluminación</option>
                    <option value="Monitores">Monitores</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>
                </div>
              </div>

              <!-- Product Name -->
              <div>
                <label class="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Nombre del Producto *</label>
                <input
                  type="text"
                  [(ngModel)]="formData.name"
                  name="name"
                  required
                  placeholder="Ej: Audífonos Studio Wireless Pro"
                  class="w-full px-3.5 py-2.5 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <!-- Price & Stock -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Precio ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    [(ngModel)]="formData.price"
                    name="price"
                    required
                    placeholder="289.99"
                    class="w-full px-3.5 py-2.5 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Stock Inicial *</label>
                  <input
                    type="number"
                    min="0"
                    [(ngModel)]="formData.stock"
                    name="stock"
                    required
                    placeholder="15"
                    class="w-full px-3.5 py-2.5 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Descripción *</label>
                <textarea
                  [(ngModel)]="formData.description"
                  name="description"
                  rows="3"
                  required
                  placeholder="Descripción detallada de las características del producto..."
                  class="w-full px-3.5 py-2.5 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:outline-none"
                ></textarea>
              </div>

              <!-- Images URLs -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold text-stone-700 uppercase tracking-wider">URL de Imágenes *</label>
                  <button
                    type="button"
                    (click)="addImageUrl()"
                    class="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
                  >
                    + Agregar otra URL
                  </button>
                </div>

                <div class="space-y-2">
                  @for (url of imageUrls; track $index) {
                    <div class="flex items-center gap-2">
                      <input
                        type="url"
                        [(ngModel)]="imageUrls[$index]"
                        [name]="'image_' + $index"
                        placeholder="https://images.unsplash.com/photo-..."
                        class="flex-1 px-3.5 py-2 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:outline-none"
                      />
                      @if (imageUrls.length > 1) {
                        <button
                          type="button"
                          (click)="removeImageUrl($index)"
                          class="p-2 text-stone-400 hover:text-rose-600"
                        >
                          ✕
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Dynamic Specs (JSONB) Editor -->
              <div class="bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
                <div class="flex items-center justify-between mb-3">
                  <label class="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                    Especificaciones Técnicas (JSONB)
                  </label>

                  <button
                    type="button"
                    (click)="addSpecRow()"
                    class="text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-xs"
                  >
                    + Atributo
                  </button>
                </div>

                <div class="space-y-2">
                  @for (spec of specRows; track $index) {
                    <div class="flex items-center gap-2">
                      <input
                        type="text"
                        [(ngModel)]="spec.key"
                        [name]="'spec_key_' + $index"
                        placeholder="Atributo (ej: color)"
                        class="w-1/2 px-3 py-1.5 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none"
                      />
                      <input
                        type="text"
                        [(ngModel)]="spec.value"
                        [name]="'spec_val_' + $index"
                        placeholder="Valor (ej: Matte Black)"
                        class="w-1/2 px-3 py-1.5 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none"
                      />
                      <button
                        type="button"
                        (click)="removeSpecRow($index)"
                        class="text-stone-400 hover:text-rose-600 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- Submit Buttons -->
              <div class="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  (click)="close.emit()"
                  class="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  [disabled]="isSubmitting"
                  class="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  @if (isSubmitting) {
                    <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  }
                  <span>{{ isEditing ? 'Guardar Cambios' : 'Crear Producto' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class ProductFormComponent implements OnInit {
  @Input() isOpen = false;
  @Input() productToEdit: Product | null = null;
  @Output() close = new EventEmitter<void>();

  private productService = inject(ProductService);

  public isEditing = false;
  public isSubmitting = false;

  public formData: Partial<Product> = {
    sku: '',
    name: '',
    description: '',
    category: 'Audio',
    price: 99.99,
    stock: 10,
  };

  public imageUrls: string[] = ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80'];
  public specRows: SpecRow[] = [{ key: 'color', value: 'Matte Black' }];

  ngOnInit(): void {
    const prod = this.productToEdit;
    if (prod) {
      this.isEditing = true;
      this.formData = { ...prod };
      this.imageUrls = [...(prod.images || [])];
      
      if (prod.specs) {
        const specsObj = prod.specs;
        this.specRows = Object.keys(specsObj).map((key) => ({
          key,
          value: String(specsObj[key]),
        }));
      }
    }
  }

  public addImageUrl(): void {
    this.imageUrls.push('');
  }

  public removeImageUrl(index: number): void {
    this.imageUrls.splice(index, 1);
  }

  public addSpecRow(): void {
    this.specRows.push({ key: '', value: '' });
  }

  public removeSpecRow(index: number): void {
    this.specRows.splice(index, 1);
  }

  public async onSubmit(): Promise<void> {
    if (!this.formData.sku || !this.formData.name || !this.formData.description) return;

    this.isSubmitting = true;

    // Reconstruir specs JSONB
    const specsJson: ProductSpecs = {};
    for (const row of this.specRows) {
      if (row.key.trim()) {
        specsJson[row.key.trim()] = row.value.trim();
      }
    }

    const validImages = this.imageUrls.filter((url) => url.trim().length > 0);

    const payload = {
      sku: this.formData.sku.trim(),
      name: this.formData.name.trim(),
      category: this.formData.category || 'General',
      description: this.formData.description.trim(),
      price: Number(this.formData.price),
      stock: Number(this.formData.stock),
      specs: specsJson,
      images: validImages.length > 0 ? validImages : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80'],
    };

    let success = false;

    if (this.isEditing && this.productToEdit) {
      success = await this.productService.updateProduct(this.productToEdit.id, payload);
    } else {
      success = await this.productService.createProduct(payload);
    }

    this.isSubmitting = false;

    if (success) {
      this.close.emit();
    }
  }
}
