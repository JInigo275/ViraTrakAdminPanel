import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const namePattern = /^[A-Za-z][A-Za-z' -]*$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const allowedRoles = new Set(["Administrator", "Supervisor"]);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  const authorization = request.headers.get("Authorization");
  if (!authorization) return new Response(JSON.stringify({ error: "Authentication required." }), { status: 401, headers });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return new Response(JSON.stringify({ error: "Function configuration is incomplete." }), { status: 500, headers });

  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
  const callerRole = caller?.app_metadata?.role;
  if (callerError || !caller || !["Owner", "Administrator"].includes(callerRole)) {
    return new Response(JSON.stringify({ error: "Only Owners and Administrators can create users." }), { status: 403, headers });
  }

  try {
    const body = await request.json();
    const firstName = String(body.firstName ?? "").trim().replace(/\s+/g, " ");
    const lastName = String(body.lastName ?? "").trim().replace(/\s+/g, " ");
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = String(body.role ?? "");

    if (!namePattern.test(firstName) || !namePattern.test(lastName)) throw new Error("Names may contain only letters, spaces, apostrophes, and hyphens.");
    if (!emailPattern.test(email)) throw new Error("Enter a valid email address.");
    if (!passwordPattern.test(password)) throw new Error("Password must include uppercase, lowercase, number, special character, and 8 characters.");
    if (!allowedRoles.has(role) || (callerRole === "Administrator" && role !== "Supervisor")) throw new Error("You cannot create that role.");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
    });
    if (authError || !authData.user) throw authError ?? new Error("Auth user was not created.");

    const { data: profile, error: profileError } = await adminClient.from("users").insert({
      id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      email,
      role,
      status: "Active",
      last_login: "Never",
      password: null,
      must_change_password: true,
    }).select("id, first_name, last_name, email, role, status, last_login, must_change_password, avatar").single();

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    const { error: auditError } = await adminClient.from("system_log").insert({
      message: `users create ${authData.user.id}`,
      log_type: "AUDIT_INSERT",
      timestamp: new Date().toISOString(),
      actor_id: caller.id,
      actor_role: callerRole,
      actor_name: caller.user_metadata?.full_name ?? caller.email ?? "",
      entity_type: "users",
      entity_id: authData.user.id,
      operation: "INSERT",
    });
    if (auditError) {
      await adminClient.from("users").delete().eq("id", authData.user.id);
      await adminClient.auth.admin.deleteUser(authData.user.id);
      throw auditError;
    }

    return new Response(JSON.stringify({ profile, temporaryPassword: password }), { status: 201, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Could not create user." }), { status: 400, headers });
  }
});
