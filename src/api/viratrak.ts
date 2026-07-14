import { projectId } from "../../utils/supabase/info";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-2033c26b`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json();
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
  list: () => request<DbUser[]>("/users"),
  create: (u: Omit<DbUser, "created_at">) => request<DbUser>("/users", { method: "POST", body: JSON.stringify(u) }),
  update: (id: string, patch: Partial<DbUser>) => request<DbUser>(`/users/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  remove: (id: string) => request<{ success: boolean }>(`/users/${id}`, { method: "DELETE" }),
};

// ---------- Employees ----------
export type DbEmployee = {
  id: string;
  first_name: string;
  last_name: string;
  vehicle: string;
  contact: string;
  safety_score: number;
};

export const employeesApi = {
  list: () => request<DbEmployee[]>("/employees"),
  create: (e: Omit<DbEmployee, "created_at">) => request<DbEmployee>("/employees", { method: "POST", body: JSON.stringify(e) }),
  update: (id: string, patch: Partial<DbEmployee>) => request<DbEmployee>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  remove: (id: string) => request<{ success: boolean }>(`/employees/${id}`, { method: "DELETE" }),
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
  list: () => request<DbAlert[]>("/alerts"),
  create: (a: Omit<DbAlert, "id" | "created_at">) => request<DbAlert>("/alerts", { method: "POST", body: JSON.stringify(a) }),
  remove: (id: number) => request<{ success: boolean }>(`/alerts/${id}`, { method: "DELETE" }),
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
  list: () => request<DbLog[]>("/system-logs"),
  create: (l: Omit<DbLog, "id" | "created_at">) => request<DbLog>("/system-logs", { method: "POST", body: JSON.stringify(l) }),
  remove: (id: number) => request<{ success: boolean }>(`/system-logs/${id}`, { method: "DELETE" }),
};
