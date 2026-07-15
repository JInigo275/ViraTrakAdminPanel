import { supabase } from "./supabaseClient";

// ---------- Users ----------
export type DbUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "Owner" | "Administrator" | "Supervisor";
  status: "Active" | "Inactive";
  last_login: string;
  password: string;
  must_change_password: boolean;
  avatar?: string | null;
};

export const demoLoginUser: DbUser = {
  id: "usr-owner-001",
  first_name: "Admin",
  last_name: "User",
  email: "admin@viratrak.com",
  role: "Owner",
  status: "Active",
  last_login: "Never",
  password: "admin123",
  must_change_password: false,
};

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

async function selectRows<T>(table: string, orderBy?: string) {
  const client = requireSupabase();
  let query = client.from(table).select("*");
  if (orderBy) query = query.order(orderBy, { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as T[];
}

async function insertRow<T>(table: string, row: Record<string, unknown>) {
  const client = requireSupabase();
  const { data, error } = await client.from(table).insert(row).select("*").single();
  if (error) throw error;
  return data as T;
}

async function updateRow<T>(table: string, idColumn: string, id: string | number, patch: Record<string, unknown>) {
  const client = requireSupabase();
  const { data, error } = await client.from(table).update(patch).eq(idColumn, id).select("*").single();
  if (error) throw error;
  return data as T;
}

async function deleteRow(table: string, idColumn: string, id: string | number) {
  const client = requireSupabase();
  const { error } = await client.from(table).delete().eq(idColumn, id);
  if (error) throw error;
}

export const usersApi = {
  list: async () => {
    try {
      return await selectRows<DbUser>("users", "created_at");
    } catch (error) {
      console.warn("Falling back to the built-in admin account because Supabase users could not be loaded.", error);
      return [demoLoginUser];
    }
  },
  create: async (u: Omit<DbUser, "created_at">) => insertRow<DbUser>("users", u as DbUser),
  update: async (id: string, patch: Partial<DbUser>) => updateRow<DbUser>("users", "id", id, patch),
  remove: async (id: string) => deleteRow("users", "id", id),
};

// ---------- Drivers ----------
export type DbDriver = {
  id: string;
  first_name: string;
  last_name: string;
  vehicle: string;
  contact: string;
  safety_score: number;
};

export const driversApi = {
  list: async () => selectRows<DbDriver>("drivers", "created_at"),
  create: async (e: Omit<DbDriver, "created_at">) => insertRow<DbDriver>("drivers", e as DbDriver),
  update: async (id: string, patch: Partial<DbDriver>) => updateRow<DbDriver>("drivers", "id", id, patch),
  remove: async (id: string) => deleteRow("drivers", "id", id),
};

// ---------- Alerts ----------
export type DbAlert = {
  id: number;
  type: string;
  driver: string;
  vehicle: string;
  date: string;
  time: string;
  severity: "High" | "Moderate" | "Low";
  evidence: boolean;
  icon_color: string;
  icon_bg: string;
};

export const alertsApi = {
  list: async () => selectRows<DbAlert>("alerts", "id"),
  create: async (a: Omit<DbAlert, "id" | "created_at">) => insertRow<DbAlert>("alerts", a as DbAlert),
  remove: async (id: number) => deleteRow("alerts", "id", id),
};

// ---------- System Logs ----------
export type DbLog = {
  id: number;
  source: "System" | "Hardware";
  date: string;
  time: string;
  level: "INFO" | "WARNING" | "ERROR";
  ref: string;
  action: string;
};

export const logsApi = {
  list: async () => selectRows<DbLog>("logs", "id"),
  create: async (l: Omit<DbLog, "id" | "created_at">) => insertRow<DbLog>("logs", l as DbLog),
  remove: async (id: number) => deleteRow("logs", "id", id),
};
