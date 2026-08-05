import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && (origin === "http://localhost:4200" || /^https:\/\/[^/]+\.vercel\.app$/.test(origin)) ? origin : "http://localhost:4200",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
});

interface CheckoutPayload {
  cartId?: string;
  sessionId?: string;
  items: { productId: string; quantity: number }[];
}

serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const body: CheckoutPayload = await req.json();
    if (!body.cartId || !body.sessionId || !body.items?.length) {
      return new Response(JSON.stringify({ error: "El carrito no es válido." }), {
        status: 400, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase.rpc("process_checkout", {
      p_cart_id: body.cartId,
      p_session_id: body.sessionId,
      p_items: body.items,
    });
    if (error) throw error;

    // El correo no afecta la transacción: si Resend falla, el pedido sigue válido.
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && data?.orderId) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: Deno.env.get("RESEND_FROM_EMAIL") || "Aidé storefront <onboarding@resend.dev>",
          to: [Deno.env.get("ADMIN_EMAIL") || "alresave@gmail.com"],
          subject: `Nuevo pedido ${data.orderId}`,
          html: `<h2>Nuevo pedido recibido</h2><p>Pedido <strong>${data.orderId}</strong> creado correctamente.</p>`,
        }),
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200, headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Error procesando el checkout" }), {
      status: 400, headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
