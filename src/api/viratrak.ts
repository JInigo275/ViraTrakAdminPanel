import { projectId, publicAnonKey } from "../../utils/supabase/info";

const REST = `https://${projectId}.supabase.co/rest/v1`;

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "apikey": publicAnonKey,
    "Authorization": `Bearer ${publicAnonKey}`,
    "Prefer": "return=representation",
    ...extra,
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${REST}${path}`, {
    ...options,
    headers: headers(options.headers as Record<string, string> ?? {}),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data as { message?: string })?.message ?? res.statusText);
  return data as T;
}

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
};

export const usersApi = {
  list: () => request<DbUser[]>("/users?order=created_at"),
  create: (u: Omit<DbUser, "created_at">) => request<DbUser[]>("/users", { method: "POST", body: JSON.stringify(u) }).then((r) => r[0]),
  update: (id: string, patch: Partial<DbUser>) => request<DbUser[]>(`/users?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }).then((r) => r[0]),
  remove: (id: string) => request<void>(`/users?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }),
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
  list: () => request<DbDriver[]>("/employees?order=created_at"),
  create: (e: Omit<DbDriver, "created_at">) => request<DbDriver[]>("/employees", { method: "POST", body: JSON.stringify(e) }).then((r) => r[0]),
  update: (id: string, patch: Partial<DbDriver>) => request<DbDriver[]>(`/employees?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }).then((r) => r[0]),
  remove: (id: string) => request<void>(`/employees?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }),
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
  list: () => request<DbAlert[]>("/alerts?order=date.desc,time.desc"),
  create: (a: Omit<DbAlert, "id" | "created_at">) => request<DbAlert[]>("/alerts", { method: "POST", body: JSON.stringify(a) }).then((r) => r[0]),
  remove: (id: number) => request<void>(`/alerts?id=eq.${id}`, { method: "DELETE" }),
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
  list: () => request<DbLog[]>("/system_logs?order=date.desc,time.desc"),
  create: (l: Omit<DbLog, "id" | "created_at">) => request<DbLog[]>("/system_logs", { method: "POST", body: JSON.stringify(l) }).then((r) => r[0]),
  remove: (id: number) => request<void>(`/system_logs?id=eq.${id}`, { method: "DELETE" }),
};
