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

const seedUsers: DbUser[] = [
  {
    id: "usr-owner-001",
    first_name: "Admin",
    last_name: "User",
    email: "admin@viratrak.com",
    role: "Owner",
    status: "Active",
    last_login: "Never",
    password: "admin123",
    must_change_password: false,
  },
];

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

const seedDrivers: DbDriver[] = [
  { id: "EMP-001", first_name: "Juan", last_name: "Dela Cruz", vehicle: "TRK-101", contact: "+63 917 111 2233", safety_score: 87 },
  { id: "EMP-002", first_name: "Mark", last_name: "Santos", vehicle: "TRK-104", contact: "+63 917 222 3344", safety_score: 92 },
  { id: "EMP-003", first_name: "Pedro", last_name: "Reyes", vehicle: "TRK-107", contact: "+63 917 333 4455", safety_score: 74 },
  { id: "EMP-004", first_name: "Luis", last_name: "Fernandez", vehicle: "TRK-103", contact: "+63 917 444 5566", safety_score: 95 },
  { id: "EMP-005", first_name: "Ramon", last_name: "Garcia", vehicle: "TRK-102", contact: "+63 917 555 6677", safety_score: 88 },
  { id: "EMP-006", first_name: "Carlos", last_name: "Santos", vehicle: "TRK-108", contact: "+63 917 666 7788", safety_score: 61 },
  { id: "EMP-007", first_name: "Mario", last_name: "Cruz", vehicle: "TRK-105", contact: "+63 917 777 8899", safety_score: 78 },
];

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

const seedAlerts: DbAlert[] = [
  { id: 1, type: "Yawning", driver: "Juan Dela Cruz", vehicle: "TRK-101", date: "2026-06-16", time: "10:12:00", severity: "Moderate", evidence: true, icon_color: "#F59E0B", icon_bg: "#FFF7ED" },
  { id: 2, type: "Eyes Closed", driver: "Mark Santos", vehicle: "TRK-104", date: "2026-06-16", time: "10:18:07", severity: "High", evidence: true, icon_color: "#EF4444", icon_bg: "#FEF2F2" },
  { id: 3, type: "Body Posture", driver: "Pedro Reyes", vehicle: "TRK-107", date: "2026-06-16", time: "10:30:45", severity: "Low", evidence: false, icon_color: "#10B981", icon_bg: "#ECFDF5" },
];

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

const seedLogs: DbLog[] = [
  { id: 1, source: "System", date: "2026-06-16", time: "10:24:01", level: "INFO", ref: "Monitoring", action: "Live monitoring feed started for TRK-101" },
  { id: 3, source: "System", date: "2026-06-16", time: "10:18:07", level: "ERROR", ref: "Detection", action: "Eyes closed alert triggered - Mark Santos (TRK-104)" },
  { id: 4, source: "System", date: "2026-06-16", time: "10:15:30", level: "INFO", ref: "Auth", action: "User logged in from 192.168.1.10 - Admin User" },
  { id: 101, source: "Hardware", date: "2026-06-16", time: "10:20:05", level: "ERROR", ref: "CAM-01 / TRK-101", action: "Frame drop detected - packet loss 14% [HW-4001]" },
  { id: 102, source: "Hardware", date: "2026-06-16", time: "10:15:22", level: "WARNING", ref: "CAM-03 / TRK-107", action: "Low light compensation active - IR enabled [HW-3002]" },
];

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
