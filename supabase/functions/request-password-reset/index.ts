import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Function configuration is incomplete." }), { status: 500, headers });
  }

  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const redirectTo = String(body.redirectTo ?? "");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Enter a valid email address." }), { status: 400, headers });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error: profileError } = await adminClient
      .from("users")
      .select("role")
      .eq("email", email)
      .maybeSingle();
    if (profileError) throw profileError;

    if (!profile || profile.role !== "Owner") {
      return new Response(JSON.stringify({ action: "contact_admin" }), { status: 200, headers });
    }

    const recoveryClient = createClient(supabaseUrl, anonKey);
    const { error: resetError } = await recoveryClient.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || undefined,
    });
    if (resetError) throw resetError;

    return new Response(JSON.stringify({ action: "email_sent" }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Could not start password recovery." }), { status: 400, headers });
  }
});
