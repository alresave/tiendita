// Supabase Edge Function: Checkout y Reserva de Stock Atómica
// Entorno: Deno / TypeScript (Supabase Functions)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
};

interface CheckoutPayload {
  cartId?: string;
  sessionId?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

serve(async (req) => {
  // Manejo de Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CheckoutPayload = await req.json();
    const { cartId, sessionId, items } = body;

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "El carrito no contiene productos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Validar disponibilidad de stock para cada producto
    for (const item of items) {
      const { data: product, error } = await supabase
        .from("products")
        .select("id, name, stock, price")
        .eq("id", item.productId)
        .single();

      if (error || !product) {
        return new Response(
          JSON.stringify({ error: `Producto no encontrado (ID: ${item.productId})` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (product.stock < item.quantity) {
        return new Response(
          JSON.stringify({
            error: `Stock insuficiente para ${product.name}. Disponibles: ${product.stock}, requeridos: ${item.quantity}`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 2. Transacción atómica: Descuenta el stock de productos
    for (const item of items) {
      const { data: currentProd } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.productId)
        .single();

      if (currentProd) {
        const newStock = Math.max(0, currentProd.stock - item.quantity);
        await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.productId);
      }
    }

    // 3. Limpiar ítems del carrito en la base de datos
    if (cartId) {
      await supabase.from("cart_items").delete().eq("cart_id", cartId);
    } else if (sessionId) {
      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (cart) {
        await supabase.from("cart_items").delete().eq("cart_id", cart.id);
      }
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        message: "¡Orden procesada y reservada exitosamente en Supabase!",
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Error procesando el checkout" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
