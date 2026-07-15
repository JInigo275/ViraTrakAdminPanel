function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStore<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
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

const USERS_KEY = "viratrak_users";
const DRIVERS_KEY = "viratrak_drivers";
const ALERTS_KEY = "viratrak_alerts";
const LOGS_KEY = "viratrak_logs";

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

const seedUsers: DbUser[] = [demoLoginUser];

export const usersApi = {
  list: async () => readStore<DbUser[]>(USERS_KEY, seedUsers),
  create: async (u: Omit<DbUser, "created_at">) => {
    const rows = readStore<DbUser[]>(USERS_KEY, seedUsers);
    const saved = u as DbUser;
    writeStore(USERS_KEY, [...rows, saved]);
    return saved;
  },
  update: async (id: string, patch: Partial<DbUser>) => {
    const rows = readStore<DbUser[]>(USERS_KEY, seedUsers);
    const idx = rows.findIndex((u) => u.id === id);
    if (idx < 0) throw new Error("User not found");
    const saved = { ...rows[idx], ...patch };
    rows[idx] = saved;
    writeStore(USERS_KEY, rows);
    return saved;
  },
  remove: async (id: string) => {
    const rows = readStore<DbUser[]>(USERS_KEY, seedUsers);
    writeStore(USERS_KEY, rows.filter((u) => u.id !== id));
  },
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

const seedDrivers: DbDriver[] = [];

export const driversApi = {
  list: async () => readStore<DbDriver[]>(DRIVERS_KEY, seedDrivers),
  create: async (e: Omit<DbDriver, "created_at">) => {
    const rows = readStore<DbDriver[]>(DRIVERS_KEY, seedDrivers);
    const saved = e as DbDriver;
    writeStore(DRIVERS_KEY, [...rows, saved]);
    return saved;
  },
  update: async (id: string, patch: Partial<DbDriver>) => {
    const rows = readStore<DbDriver[]>(DRIVERS_KEY, seedDrivers);
    const idx = rows.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error("Driver not found");
    const saved = { ...rows[idx], ...patch };
    rows[idx] = saved;
    writeStore(DRIVERS_KEY, rows);
    return saved;
  },
  remove: async (id: string) => {
    const rows = readStore<DbDriver[]>(DRIVERS_KEY, seedDrivers);
    writeStore(DRIVERS_KEY, rows.filter((e) => e.id !== id));
  },
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

const seedAlerts: DbAlert[] = [];

export const alertsApi = {
  list: async () => readStore<DbAlert[]>(ALERTS_KEY, seedAlerts),
  create: async (a: Omit<DbAlert, "id" | "created_at">) => {
    const rows = readStore<DbAlert[]>(ALERTS_KEY, seedAlerts);
    const nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    const saved = { ...(a as DbAlert), id: nextId };
    writeStore(ALERTS_KEY, [saved, ...rows]);
    return saved;
  },
  remove: async (id: number) => {
    const rows = readStore<DbAlert[]>(ALERTS_KEY, seedAlerts);
    writeStore(ALERTS_KEY, rows.filter((a) => a.id !== id));
  },
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

const seedLogs: DbLog[] = [];

export const logsApi = {
  list: async () => readStore<DbLog[]>(LOGS_KEY, seedLogs),
  create: async (l: Omit<DbLog, "id" | "created_at">) => {
    const rows = readStore<DbLog[]>(LOGS_KEY, seedLogs);
    const nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    const saved = { ...(l as DbLog), id: nextId };
    writeStore(LOGS_KEY, [saved, ...rows]);
    return saved;
  },
  remove: async (id: number) => {
    const rows = readStore<DbLog[]>(LOGS_KEY, seedLogs);
    writeStore(LOGS_KEY, rows.filter((l) => l.id !== id));
  },
};
