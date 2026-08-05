import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';
import { ToastService } from './toast.service';
import { SupabaseService } from './supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class CartService implements OnDestroy {
  private toastService = inject(ToastService);
  private supabaseService = inject(SupabaseService);

  // 1. Session ID para invitados o usuarios no autenticados
  public readonly sessionId: string = this.getOrCreateSessionId();
  private dbCartId: string | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private sessionClient: ReturnType<SupabaseService['createSessionClient']> = null;

  // 2. Estado reactivo principal con Signals
  public cart = signal<CartItem[]>(this.loadCartFromStorage());
  public isDrawerOpen = signal<boolean>(false);
  public lastAddedProductId = signal<string | null>(null);

  // Metas de negocio
  public readonly FREE_SHIPPING_THRESHOLD = 500;

  // 3. Computed Signals para valores derivados
  public itemCount = computed(() =>
    this.cart().reduce((acc, item) => acc + item.quantity, 0)
  );

  public subtotalPrice = computed(() =>
    this.cart().reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    )
  );

  public totalPrice = computed(() => this.subtotalPrice());

  public isEmpty = computed(() => this.cart().length === 0);

  public freeShippingProgress = computed(() => {
    const total = this.subtotalPrice();
    if (total >= this.FREE_SHIPPING_THRESHOLD) return 100;
    return Math.min(100, Math.round((total / this.FREE_SHIPPING_THRESHOLD) * 100));
  });

  public remainingForFreeShipping = computed(() => {
    const total = this.subtotalPrice();
    return Math.max(0, this.FREE_SHIPPING_THRESHOLD - total);
  });

  constructor() {
    this.initCartInSupabase();
  }

  ngOnDestroy(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
  }

  /**
   * Inicializa la sesión de carrito en la DB Supabase y activa Supabase Realtime
   */
  private async initCartInSupabase(): Promise<void> {
    if (!this.supabaseService.isReady) return;

    const client = this.supabaseService.createSessionClient(this.sessionId);
    if (!client) return;
    this.sessionClient = client;

    try {
      // Obtener o crear carrito en la tabla `carts`
      let { data: existingCart } = await client
        .from('carts')
        .select('id')
        .eq('session_id', this.sessionId)
        .maybeSingle();

      if (!existingCart) {
        const { data: newCart, error } = await client
          .from('carts')
          .insert({ session_id: this.sessionId })
          .select('id')
          .single();

        if (!error && newCart) {
          this.dbCartId = newCart.id;
        }
      } else {
        this.dbCartId = existingCart.id;
      }

      if (this.dbCartId) {
        // Cargar ítems remotos desde la tabla `cart_items`
        await this.syncFromSupabase();

        // Configurar Supabase Realtime para cambios en tiempo real
        this.setupRealtimeSubscription(client);
      }
    } catch (err) {
      console.warn('Error inicializando carrito en Supabase:', err);
    }
  }

  /**
   * Suscripción en Tiempo Real con Supabase Realtime
   */
  private setupRealtimeSubscription(client: any): void {
    this.realtimeChannel = client
      .channel(`public:cart_items:${this.sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: this.dbCartId ? `cart_id=eq.${this.dbCartId}` : undefined,
        },
        async (payload: any) => {
          console.info('⚡ Supabase Realtime Update en Carrito:', payload);
          await this.syncFromSupabase();
        }
      )
      .subscribe();
  }

  private async syncFromSupabase(): Promise<void> {
    if (!this.dbCartId || !this.supabaseService.isReady) return;

    const client = this.sessionClient;
    if (!client) return;

    const { data: items, error } = await client
      .from('cart_items')
      .select('quantity, products(*)')
      .eq('cart_id', this.dbCartId);

    if (!error && items) {
      const mappedItems: CartItem[] = items.map((row: any) => ({
        product: row.products as Product,
        quantity: row.quantity,
        addedAt: new Date(),
      }));

      this.cart.set(mappedItems);
      this.saveCartToStorage();
    }
  }

  public async addToCart(product: Product, quantity = 1): Promise<void> {
    if (product.stock <= 0) {
      this.toastService.warning(
        'Sin stock disponible',
        `El producto ${product.name} está agotado actualmente.`
      );
      return;
    }

    let itemAdded = false;

    this.cart.update((items) => {
      const existingIndex = items.findIndex((i) => i.product.id === product.id);

      if (existingIndex > -1) {
        const currentQty = items[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > product.stock) {
          this.toastService.warning(
            'Límite de stock alcanzado',
            `Solo hay ${product.stock} unidades disponibles de ${product.name}.`
          );
          return items;
        }

        const updated = [...items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        itemAdded = true;
        return updated;
      } else {
        itemAdded = true;
        return [
          ...items,
          {
            product,
            quantity: Math.min(quantity, product.stock),
            addedAt: new Date(),
          },
        ];
      }
    });

    if (itemAdded) {
      this.saveCartToStorage();
      this.lastAddedProductId.set(product.id);
      setTimeout(() => this.lastAddedProductId.set(null), 600);

      this.toastService.success(
        '¡Agregado al carrito!',
        `${product.name} se añadió a tu cesta.`
      );

      // Sincronizar en DB Supabase si el cliente está listo
      await this.persistItemToSupabase(product.id);
    }
  }

  public async removeFromCart(productId: string): Promise<void> {
    const itemToRemove = this.cart().find((i) => i.product.id === productId);

    this.cart.update((items) => items.filter((i) => i.product.id !== productId));
    this.saveCartToStorage();

    if (itemToRemove) {
      this.toastService.info(
        'Producto removido',
        `Se eliminó ${itemToRemove.product.name} del carrito.`
      );

      if (this.dbCartId && this.supabaseService.isReady) {
        const client = this.sessionClient;
        if (!client) return;
        await client
          .from('cart_items')
          .delete()
          .match({ cart_id: this.dbCartId, product_id: productId });
      }
    }
  }

  public async updateQuantity(productId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeFromCart(productId);
      return;
    }

    this.cart.update((items) => {
      return items.map((item) => {
        if (item.product.id === productId) {
          const validQty = Math.min(quantity, item.product.stock);
          return { ...item, quantity: validQty };
        }
        return item;
      });
    });

    this.saveCartToStorage();
    await this.persistItemToSupabase(productId);
  }

  public async clearCart(): Promise<void> {
    this.cart.set([]);
    this.saveCartToStorage();

    if (this.dbCartId && this.supabaseService.isReady) {
      const client = this.sessionClient;
      if (!client) return;
      await client.from('cart_items').delete().eq('cart_id', this.dbCartId);
    }

    this.toastService.info('Carrito vaciado', 'Todos los productos han sido removidos.');
  }

  /**
   * Invoca la Supabase Edge Function 'checkout' para procesamiento atómico de órdenes
   */
  public async checkoutWithEdgeFunction(): Promise<boolean> {
    if (this.isEmpty()) return false;

    const payload = {
      cartId: this.dbCartId,
      sessionId: this.sessionId,
      items: this.cart().map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    if (this.supabaseService.isReady) {
      const client = this.sessionClient;
      if (!client) return false;
      try {
        const { data, error } = await client.functions.invoke('checkout', {
          body: payload,
        });

        if (error) {
          this.toastService.error('No se pudo procesar el pedido', error.message);
          return false;
        } else if (data?.success) {
          this.toastService.success(
            '¡Orden Confirmada!',
            `Orden N° ${data.orderId} procesada por Supabase Edge Function.`
          );
          await this.clearCart();
          return true;
        }
      } catch (e) {
        this.toastService.error('No se pudo procesar el pedido', 'No fue posible conectar con el checkout.');
        return false;
      }
    }

    this.toastService.error('Checkout no disponible', 'La tienda requiere conexión con Supabase para confirmar pedidos.');
    return false;
  }

  public toggleDrawer(): void {
    this.isDrawerOpen.update((open) => !open);
  }

  public openDrawer(): void {
    this.isDrawerOpen.set(true);
  }

  public closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  private async persistItemToSupabase(productId: string): Promise<void> {
    if (!this.dbCartId || !this.supabaseService.isReady) return;

    const client = this.sessionClient;
    if (!client) return;
    const item = this.cart().find((i) => i.product.id === productId);

    if (item) {
      await client.from('cart_items').upsert(
        {
          cart_id: this.dbCartId,
          product_id: productId,
          quantity: item.quantity,
        },
        { onConflict: 'cart_id,product_id' }
      );
    }
  }

  private getOrCreateSessionId(): string {
    try {
      let id = localStorage.getItem('aura_session_id');
      if (!id) {
        id = 'sess-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now();
        localStorage.setItem('aura_session_id', id);
      }
      return id;
    } catch (e) {
      return 'sess-fallback-' + Date.now();
    }
  }

  private saveCartToStorage(): void {
    try {
      localStorage.setItem('aura_cart', JSON.stringify(this.cart()));
    } catch (e) {}
  }

  private loadCartFromStorage(): CartItem[] {
    try {
      const data = localStorage.getItem('aura_cart');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }
}
