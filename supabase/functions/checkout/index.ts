import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && (origin === "http://localhost:4200" || /^https:\/\/[^/]+\.vercel\.app$/.test(origin)) ? origin : "http://localhost:4200",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
});

interface CheckoutPayload {
  cartId?: string;
  sessionId?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    note?: string;
    address?: { recipient_name?: string; line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string };
  };
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
    if (!body.cartId || !body.sessionId || !body.customer) {
      return new Response(JSON.stringify({ error: "El carrito no es válido." }), {
        status: 400, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const userClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
      const { data: userData } = await userClient.auth.getUser();
      userId = userData.user?.id ?? null;
    }
    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const rateKey = userId ? `user:${userId}` : `ip:${forwarded || body.sessionId}`;
    const { data, error } = await supabase.rpc("process_checkout_v2", {
      p_cart_id: body.cartId,
      p_session_id: body.sessionId,
      p_customer_name: body.customer.name || "",
      p_customer_email: body.customer.email || "",
      p_customer_phone: body.customer.phone || "",
      p_shipping_address: body.customer.address || {},
      p_customer_note: body.customer.note || "",
      p_user_id: userId,
      p_rate_key: rateKey,
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
