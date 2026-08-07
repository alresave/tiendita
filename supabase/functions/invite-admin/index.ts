import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = (origin: string | null) => ({
  // La autorización se valida con el JWT y el rol de administrador; reflejar el
  // origen permite usar dominios de producción y previews sin romper CORS.
  "Access-Control-Allow-Origin": origin ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
});

serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) throw new Error("Inicia sesión como administrador.");
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const token = authorization.replace(/^Bearer\s+/i, "");
    const { data: userData, error: userError } = await admin.auth.getUser(
      token,
    );
    if (userError || !userData.user) throw new Error("Sesión no válida.");

    const { data: role } = await admin.from("user_roles").select("role").eq(
      "user_id",
      userData.user.id,
    ).maybeSingle();
    if (role?.role !== "admin") {
      throw new Error("No tienes permiso para agregar administradores.");
    }

    const { email, redirectTo } = await req.json();
    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error("Indica un correo válido.");
    }
    const normalizedEmail = email.trim().toLowerCase();
    const invitationOptions = {
      redirectTo: typeof redirectTo === "string" ? redirectTo : undefined,
    };
    const { data, error } = await admin.auth.admin.inviteUserByEmail(
      normalizedEmail,
      invitationOptions,
    );

    // Supabase rechaza invitar usuarios existentes. Para ese caso el administrador
    // puede conceder el rol y enviar una recuperación para que la persona defina
    // (o restablezca) su contraseña.
    if (error?.message.toLowerCase().includes("already registered")) {
      const { data: users, error: usersError } = await admin.auth.admin
        .listUsers({ page: 1, perPage: 1000 });
      if (usersError) throw usersError;
      const existingUser = users.users.find((user) =>
        user.email?.toLowerCase() === normalizedEmail
      );
      if (!existingUser) throw error;
      const { error: roleError } = await admin.from("user_roles").upsert({
        user_id: existingUser.id,
        role: "admin",
      });
      if (roleError) throw roleError;
      const { error: resetError } = await admin.auth.resetPasswordForEmail(
        normalizedEmail,
        invitationOptions,
      );
      if (resetError) throw resetError;
      return new Response(JSON.stringify({ ok: true, mode: "existing" }), {
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    if (error || !data.user) {
      throw error ?? new Error("No se pudo crear la invitación.");
    }

    const { error: roleError } = await admin.from("user_roles").upsert({
      user_id: data.user.id,
      role: "admin",
    });
    if (roleError) throw roleError;
    return new Response(JSON.stringify({ ok: true, mode: "new" }), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message || "No se pudo enviar la invitación.",
      }),
      {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      },
    );
  }
});
