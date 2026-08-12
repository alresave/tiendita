import { Injectable, signal, computed, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';
import { Product } from '../models/product.model';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1a2b3c4d-0001-4000-8000-000000000001',
    sku: 'AUD-ANC-01',
    name: 'Audífonos Studio Wireless Pro',
    description: 'Auriculares de diadema con cancelación activa de ruido adaptativa, drivers de titanio de 40mm y 40 horas de autonomía continua.',
    price: 289.99,
    stock: 15,
    specs: {
      color: 'Matte Black',
      connectivity: 'Bluetooth 5.3',
      battery: '40h',
      noiseCancellation: 'ANC Adaptativo',
      weight: '250g',
    },
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80',
    ],
    category: 'Audio',
    brand: 'Sonic',
  },
  {
    id: '1a2b3c4d-0002-4000-8000-000000000002',
    sku: 'KEY-MECH-02',
    name: 'Teclado Mecánico Custom 75%',
    description: 'Teclado mecánico con chasis de aluminio CNC, interruptores lubricados de fábrica, conectividad tri-modo y teclas PBT de doble inyección.',
    price: 189.50,
    stock: 8,
    specs: {
      layout: '75% ANSI',
      switches: 'Linear Cream',
      material: 'Aluminio CNC',
      rgb: 'Per-key RGB',
      wireless: true,
    },
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=80',
    ],
    category: 'Periféricos',
    brand: 'Nexa',
  },
  {
    id: '1a2b3c4d-0003-4000-8000-000000000003',
    sku: 'SPK-HI-03',
    name: 'Altavoz Hi-Fi Sculpt Dual',
    description: 'Altavoz inalámbrico estereofónico acústicamente afinado con acabado en tela premium y madera de nogal sostenible.',
    price: 340.00,
    stock: 5,
    specs: {
      power: '60W RMS',
      audioFormats: 'FLAC, AAC, MP3',
      connectivity: 'Wi-Fi, AirPlay 2, Bluetooth',
      finish: 'Nogal y Lino',
    },
    images: [
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1000&q=80',
    ],
    category: 'Audio',
    brand: 'Sonic',
  },
  {
    id: '1a2b3c4d-0004-4000-8000-000000000004',
    sku: 'MOU-ERG-04',
    name: 'Mouse Ergonómico Precision Silent',
    description: 'Mouse inalámbrico ultra-preciso con sensor magnético MagSpeed, diseño ergonómico para reducir tensión muscular y clics silenciosos.',
    price: 99.90,
    stock: 22,
    specs: {
      sensor: '8000 DPI Darkfield',
      battery: '70 días',
      buttons: '7 programables',
      connectivity: 'Bluetooth & Logi Bolt',
    },
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1000&q=80',
    ],
    category: 'Periféricos',
    brand: 'Nexa',
  },
  {
    id: '1a2b3c4d-0005-4000-8000-000000000005',
    sku: 'LAMP-LED-05',
    name: 'Lámpara Minimalista Halo Ambient',
    description: 'Lámpara de escritorio inteligente con control táctil, temperatura de luz regulable de 2700K a 6500K y base de carga Qi inalámbrica integrada.',
    price: 125.00,
    stock: 12,
    specs: {
      lumens: '800 lm',
      power: '12W',
      wirelessCharging: '15W Fast Qi',
      colorTemp: '2700K - 6500K',
    },
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80',
    ],
    category: 'Iluminación',
    brand: 'Lumina',
  },
  {
    id: '1a2b3c4d-0006-4000-8000-000000000006',
    sku: 'MON-DEV-06',
    name: 'Monitor Ultrawide 34" Curved Studio',
    description: 'Pantalla curva QD-OLED de 34 pulgadas con resolución UWQHD (3440x1440), frecuencia de refresco de 175Hz y cobertura de color DCI-P3 al 99.3%.',
    price: 899.00,
    stock: 4,
    specs: {
      resolution: '3440 x 1440 UWQHD',
      refreshRate: '175Hz',
      panelType: 'QD-OLED',
      hdr: 'VESA DisplayHDR True Black 400',
    },
    images: [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=80',
    ],
    category: 'Monitores',
    brand: 'Vertex',
  },
];

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);

  public products = signal<Product[]>([]);
  public isLoading = signal<boolean>(true);
  public selectedCategory = signal<string>('Todos');
  public searchQuery = signal<string>('');
  public isAdminOpen = signal<boolean>(false);

  // Computed signals para métricas administrativas
  public totalProductsCount = computed(() => this.products().length);

  public lowStockCount = computed(() =>
    this.products().filter((p) => p.stock <= (p.low_stock_threshold ?? 5)).length
  );

  public totalInventoryValue = computed(() =>
    this.products().reduce((sum, p) => sum + p.price * p.stock, 0)
  );

  constructor() {
    this.loadProducts();
  }

  public async loadProducts(): Promise<void> {
    this.isLoading.set(true);

    try {
      if (this.supabaseService.isReady) {
        const client = this.supabaseService.clientInstance!;
        const { data, error } = await client
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase fetch error, usando mock:', error);
          this.products.set(MOCK_PRODUCTS);
        } else if (data && data.length > 0) {
          this.products.set(data as Product[]);
        } else {
          this.products.set(MOCK_PRODUCTS);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400));
        this.products.set(MOCK_PRODUCTS);
      }
    } catch (err) {
      console.error('Error al obtener productos:', err);
      this.products.set(MOCK_PRODUCTS);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Crear un nuevo producto en Supabase o en estado reactivo local
   */
  public async createProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<boolean> {
    if (this.supabaseService.isReady) {
      const client = this.supabaseService.clientInstance!;
      const { data, error } = await client
        .from('products')
        .insert({
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          previous_price: productData.previous_price ?? null,
          stock: productData.stock,
          low_stock_threshold: productData.low_stock_threshold ?? 5,
          is_active: productData.is_active ?? true,
          category: productData.category,
          brand: productData.brand,
          specs: productData.specs,
          images: productData.images,
        })
        .select()
        .single();

      if (error) {
        this.toastService.error('Error en Supabase', error.message);
        return false;
      } else if (data) {
        this.products.update((current) => [data as Product, ...current]);
        this.toastService.success('¡Producto Creado!', `${data.name} añadido a Supabase.`);
        return true;
      }
    }

    this.toastService.error('Administración no disponible', 'Configura Supabase para gestionar el catálogo.');
    return false;
  }

  /**
   * Actualizar un producto existente
   */
  public async updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
    if (this.supabaseService.isReady) {
      const client = this.supabaseService.clientInstance!;
      const { error } = await client
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) {
        this.toastService.error('Error al actualizar', error.message);
        return false;
      }
    }

    if (!this.supabaseService.isReady) {
      this.toastService.error('Administración no disponible', 'Configura Supabase para gestionar el catálogo.');
      return false;
    }

    this.products.update((current) => current.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    this.toastService.success('Producto Actualizado', 'Los cambios han sido guardados.');
    return true;
  }

  /**
   * Eliminar un producto
   */
  public async deleteProduct(id: string): Promise<boolean> {
    const prodToDelete = this.products().find((p) => p.id === id);

    if (this.supabaseService.isReady) {
      const client = this.supabaseService.clientInstance!;
      const { error } = await client.from('products').delete().eq('id', id);

      if (error) {
        this.toastService.error('Error al eliminar', error.message);
        return false;
      }
    }

    if (!this.supabaseService.isReady) {
      this.toastService.error('Administración no disponible', 'Configura Supabase para gestionar el catálogo.');
      return false;
    }

    this.products.update((current) => current.filter((p) => p.id !== id));
    this.toastService.info(
      'Producto Eliminado',
      `Se eliminó ${prodToDelete?.name || 'el producto'}.`
    );
    return true;
  }

  /**
   * Modificar el stock rápidamente (+1 / -1)
   */
  public async adjustStock(id: string, delta: number): Promise<void> {
    const prod = this.products().find((p) => p.id === id);
    if (!prod) return;

    const newStock = Math.max(0, prod.stock + delta);
    await this.updateProduct(id, { stock: newStock });
  }

  public getProductById(id: string): Product | undefined {
    return this.products().find((p) => p.id === id);
  }

  public toggleAdmin(): void {
    this.isAdminOpen.update((open) => !open);
  }
}
