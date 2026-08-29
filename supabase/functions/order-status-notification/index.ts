import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Access-Control-Allow-Origin": Deno.env.get("PUBLIC_SITE_URL") || "http://localhost:4200", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const labels: Record<string, string> = { pending: "recibido", paid: "pagado", shipped: "enviado", cancelled: "cancelado" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const token = req.headers.get("authorization") || "";
    const admin = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_ANON_KEY") || "", { global: { headers: { Authorization: token } } });
    const { data: identity } = await admin.auth.getUser();
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", identity.user?.id || "").maybeSingle();
    if (role?.role !== "admin") throw new Error("No autorizado.");
    const { orderId, status } = await req.json();
    const service = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
    const { data: order, error } = await service.from("orders").select("order_number, customer_email").eq("id", orderId).single();
    if (error || !order?.customer_email) throw new Error("Pedido no encontrado.");
    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) return new Response(JSON.stringify({ skipped: true }), { headers: { ...headers, "Content-Type": "application/json" } });
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: Deno.env.get("RESEND_FROM_EMAIL") || "Aidé storefront <onboarding@resend.dev>", to: [order.customer_email], subject: `Actualización de tu pedido ${order.order_number}`, html: `<p>Tu pedido <strong>${order.order_number}</strong> ahora está: <strong>${labels[status] || status}</strong>.</p>` }) });
    if (!response.ok) throw new Error("Resend rechazó el correo.");
    return new Response(JSON.stringify({ success: true }), { headers: { ...headers, "Content-Type": "application/json" } });
  } catch (error: any) { return new Response(JSON.stringify({ error: error.message || "Error" }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } }); }
});
