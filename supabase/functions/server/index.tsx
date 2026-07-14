import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import * as kv from "./kv_store.tsx";

// Environment accessor that works in Deno and Node (for typecheckers that
// don't know about the Deno global).
function getEnv(key: string): string | undefined {
  // Use globalThis to safely access Deno in environments where it's available
  // (avoids TS error: Cannot find name 'Deno').
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybeDeno = (globalThis as any).Deno;
  if (typeof maybeDeno !== "undefined" && maybeDeno?.env && typeof maybeDeno.env.get === "function") {
    return maybeDeno.env.get(key) ?? undefined;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((globalThis as any).process?.env as any)?.[key];
}

const app = new Hono();

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// Supabase REST helpers (no SDK needed — plain fetch)
function sbUrl(path: string) {
  const url = getEnv("SUPABASE_URL");
  return `${url}/rest/v1${path}`;
}
function sbHeaders(extra: Record<string, string> = {}) {
  return {
    "Content-Type": "application/json",
    "apikey": getEnv("SUPABASE_SERVICE_ROLE_KEY")!,
    "Authorization": `Bearer ${getEnv("SUPABASE_SERVICE_ROLE_KEY")}`,
    "Prefer": "return=representation",
    ...extra,
  };
}
async function sbFetch(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) return { data: null, error: data };
  return { data, error: null };
}

const BASE = "/make-server-2033c26b";

// Health
app.get(`${BASE}/health`, (c) => c.json({ status: "ok" }));

// -------------------------------------------------------
// USERS
// -------------------------------------------------------
app.get(`${BASE}/users`, async (c) => {
  const { data, error } = await sbFetch(sbUrl("/users?order=created_at"), { method: "GET", headers: sbHeaders() });
  if (error) return c.json({ error }, 500);
  return c.json(data);
});

app.post(`${BASE}/users`, async (c) => {
  const body = await c.req.json();
  const { data, error } = await sbFetch(sbUrl("/users"), { method: "POST", headers: sbHeaders(), body: JSON.stringify(body) });
  if (error) return c.json({ error }, 500);
  return c.json(Array.isArray(data) ? data[0] : data, 201);
});

app.put(`${BASE}/users/:id`, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { data, error } = await sbFetch(sbUrl(`/users?id=eq.${encodeURIComponent(id)}`), { method: "PATCH", headers: sbHeaders(), body: JSON.stringify(body) });
  if (error) return c.json({ error }, 500);
  return c.json(Array.isArray(data) ? data[0] : data);
});

app.delete(`${BASE}/users/:id`, async (c) => {
  const id = c.req.param("id");
  const { error } = await sbFetch(sbUrl(`/users?id=eq.${encodeURIComponent(id)}`), { method: "DELETE", headers: sbHeaders() });
  if (error) return c.json({ error }, 500);
  return c.json({ success: true });
});

// -------------------------------------------------------
// EMPLOYEES
// -------------------------------------------------------
app.get(`${BASE}/employees`, async (c) => {
  const { data, error } = await sbFetch(sbUrl("/employees?order=created_at"), { method: "GET", headers: sbHeaders() });
  if (error) return c.json({ error }, 500);
  return c.json(data);
});

app.post(`${BASE}/employees`, async (c) => {
  const body = await c.req.json();
  const { data, error } = await sbFetch(sbUrl("/employees"), { method: "POST", headers: sbHeaders(), body: JSON.stringify(body) });
  if (error) return c.json({ error }, 500);
  return c.json(Array.isArray(data) ? data[0] : data, 201);
});

app.put(`${BASE}/employees/:id`, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { data, error } = await sbFetch(sbUrl(`/employees?id=eq.${encodeURIComponent(id)}`), { method: "PATCH", headers: sbHeaders(), body: JSON.stringify(body) });
  if (error) return c.json({ error }, 500);
  return c.json(Array.isArray(data) ? data[0] : data);
});

app.delete(`${BASE}/employees/:id`, async (c) => {
  const id = c.req.param("id");
  const { error } = await sbFetch(sbUrl(`/employees?id=eq.${encodeURIComponent(id)}`), { method: "DELETE", headers: sbHeaders() });
  if (error) return c.json({ error }, 500);
  return c.json({ success: true });
});

// -------------------------------------------------------
// ALERTS
// -------------------------------------------------------
app.get(`${BASE}/alerts`, async (c) => {
  const { data, error } = await sbFetch(sbUrl("/alerts?order=date.desc,time.desc"), { method: "GET", headers: sbHeaders() });
  if (error) return c.json({ error }, 500);
  return c.json(data);
});

app.post(`${BASE}/alerts`, async (c) => {
  const body = await c.req.json();
  const { data, error } = await sbFetch(sbUrl("/alerts"), { method: "POST", headers: sbHeaders(), body: JSON.stringify(body) });
  if (error) return c.json({ error }, 500);
  return c.json(Array.isArray(data) ? data[0] : data, 201);
});

app.delete(`${BASE}/alerts/:id`, async (c) => {
  const id = c.req.param("id");
  const { error } = await sbFetch(sbUrl(`/alerts?id=eq.${id}`), { method: "DELETE", headers: sbHeaders() });
  if (error) return c.json({ error }, 500);
  return c.json({ success: true });
});

// -------------------------------------------------------
// SYSTEM LOGS
// -------------------------------------------------------
app.get(`${BASE}/system-logs`, async (c) => {
  const { data, error } = await sbFetch(sbUrl("/system_logs?order=date.desc,time.desc"), { method: "GET", headers: sbHeaders() });
  if (error) return c.json({ error }, 500);
  return c.json(data);
});

app.post(`${BASE}/system-logs`, async (c) => {
  const body = await c.req.json();
  const { data, error } = await sbFetch(sbUrl("/system_logs"), { method: "POST", headers: sbHeaders(), body: JSON.stringify(body) });
  if (error) return c.json({ error }, 500);
  return c.json(Array.isArray(data) ? data[0] : data, 201);
});

app.delete(`${BASE}/system-logs/:id`, async (c) => {
  const id = c.req.param("id");
  const { error } = await sbFetch(sbUrl(`/system_logs?id=eq.${id}`), { method: "DELETE", headers: sbHeaders() });
  if (error) return c.json({ error }, 500);
  return c.json({ success: true });
});

// Use globalThis to avoid referencing the undeclared Deno identifier in non-Deno
// environments. If Deno is available, call its serve function.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const denoGlobal = (globalThis as any).Deno;
if (denoGlobal && typeof denoGlobal.serve === "function") {
  denoGlobal.serve(app.fetch);
}
