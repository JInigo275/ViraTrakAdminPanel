import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usersApi, driversApi, DbUser, DbDriver } from "../../api/viratrak";

export type Role = "Owner" | "Administrator" | "Supervisor";

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  status: "Active" | "Inactive";
  lastLogin: string;
  password: string;
  mustChangePassword: boolean;
  avatar?: string;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  vehicle: string;
  contact: string;
  safetyScore: number;
}

export interface AppSettings {
  firstName: string;
  lastName: string;
  avatar?: string;
}

const adjectives = ["Swift", "Bold", "Keen", "Iron", "Apex", "Nova", "Flux", "Echo", "Volt", "Peak"];
const nouns = ["Tiger", "Falcon", "Hawk", "Storm", "Blaze", "Ridge", "Forge", "Crest", "Spark", "Wave"];

export function genTempPassword() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(10 + Math.random() * 90);
  const sym = ["@", "#", "!"][Math.floor(Math.random() * 3)];
  return `${adj}${sym}${noun}${num}`;
}

export function genDriverId(existing: Driver[]) {
  const max = existing.reduce((m, e) => {
    const n = parseInt(e.id.replace("EMP-", ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `EMP-${String(max + 1).padStart(3, "0")}`;
}

export function getFullName(u: { firstName: string; lastName: string }) {
  return `${u.firstName} ${u.lastName}`.trim();
}

export function getAddableRoles(adderRole: Role): Role[] {
  if (adderRole === "Owner") return ["Administrator", "Supervisor"];
  if (adderRole === "Administrator") return ["Supervisor"];
  return [];
}

export function canManageUsers(role: Role): boolean {
  return role === "Owner" || role === "Administrator";
}

// Map DB snake_case → app camelCase
function mapUser(u: DbUser): AppUser {
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    role: u.role,
    status: u.status,
    lastLogin: u.last_login,
    password: u.password,
    mustChangePassword: u.must_change_password,
  };
}

function mapDriver(e: DbDriver): Driver {
  return {
    id: e.id,
    firstName: e.first_name,
    lastName: e.last_name,
    vehicle: e.vehicle,
    contact: e.contact,
    safetyScore: e.safety_score,
  };
}

// Fallback seed data used while Supabase loads or on error
const seedUsers: AppUser[] = [
  { id: "usr-owner-001", firstName: "Admin", lastName: "User", email: "admin@viratrak.com", role: "Owner", status: "Active", lastLogin: "Never", password: "admin123", mustChangePassword: false },
];

const seedDrivers: Driver[] = [
  { id: "EMP-001", firstName: "Juan",   lastName: "Dela Cruz",  vehicle: "TRK-101", contact: "+63 917 111 2233", safetyScore: 87 },
  { id: "EMP-002", firstName: "Mark",   lastName: "Santos",     vehicle: "TRK-104", contact: "+63 917 222 3344", safetyScore: 92 },
  { id: "EMP-003", firstName: "Pedro",  lastName: "Reyes",      vehicle: "TRK-107", contact: "+63 917 333 4455", safetyScore: 74 },
  { id: "EMP-004", firstName: "Luis",   lastName: "Fernandez",  vehicle: "TRK-103", contact: "+63 917 444 5566", safetyScore: 95 },
  { id: "EMP-005", firstName: "Ramon",  lastName: "Garcia",     vehicle: "TRK-102", contact: "+63 917 555 6677", safetyScore: 88 },
  { id: "EMP-006", firstName: "Carlos", lastName: "Santos",     vehicle: "TRK-108", contact: "+63 917 666 7788", safetyScore: 61 },
  { id: "EMP-007", firstName: "Mario",  lastName: "Cruz",       vehicle: "TRK-105", contact: "+63 917 777 8899", safetyScore: 78 },
];

interface AppContextType {
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  currentUser: AppUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  dbReady: boolean;
  // Persistent CRUD helpers (write-through to Supabase)
  addUser: (u: AppUser, password: string) => Promise<void>;
  updateUser: (id: string, patch: Partial<AppUser>) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  addDriver: (e: Driver) => Promise<void>;
  updateDriver: (id: string, patch: Partial<Driver>) => Promise<void>;
  removeDriver: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(seedUsers);
  const [drivers, setDrivers] = useState<Driver[]>(seedDrivers);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const stay = localStorage.getItem("stayLoggedIn");
      if (stay === "true") {
        const raw = localStorage.getItem("currentUser");
        if (raw) return JSON.parse(raw) as AppUser;
      }
    } catch (e) {
      // ignore
    }
    return null;
  });
  const [settings, setSettings] = useState<AppSettings>({ firstName: "Admin", lastName: "User" });
  const [dbReady, setDbReady] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    Promise.all([
      usersApi.list().then((rows) => setUsers(rows.map(mapUser))),
      driversApi.list().then((rows) => setDrivers(rows.map(mapDriver))),
    ])
      .catch((e) => console.warn("Supabase load failed, using seed data:", e))
      .finally(() => setDbReady(true));
  }, []);

  // Persist currentUser only when stayLoggedIn is true
  useEffect(() => {
    try {
      const stay = localStorage.getItem("stayLoggedIn");
      if (currentUser && stay === "true") {
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("currentUser");
      }
    } catch (e) {
      // ignore
    }
  }, [currentUser]);

  // --- Users write-through ---
  async function addUser(u: AppUser, _password: string) {
    const db: DbUser = {
      id: u.id, first_name: u.firstName, last_name: u.lastName,
      email: u.email, role: u.role, status: u.status,
      last_login: u.lastLogin, password: u.password,
      must_change_password: u.mustChangePassword,
    };
    const saved = await usersApi.create(db);
    setUsers((prev) => [...prev, mapUser(saved)]);
  }

  async function updateUser(id: string, patch: Partial<AppUser>) {
    const dbPatch: Partial<DbUser> = {};
    if (patch.firstName !== undefined) dbPatch.first_name = patch.firstName;
    if (patch.lastName !== undefined) dbPatch.last_name = patch.lastName;
    if (patch.email !== undefined) dbPatch.email = patch.email;
    if (patch.role !== undefined) dbPatch.role = patch.role;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.lastLogin !== undefined) dbPatch.last_login = patch.lastLogin;
    if (patch.password !== undefined) dbPatch.password = patch.password;
    if (patch.mustChangePassword !== undefined) dbPatch.must_change_password = patch.mustChangePassword;
    const saved = await usersApi.update(id, dbPatch);
    setUsers((prev) => prev.map((u) => u.id === id ? mapUser(saved) : u));
  }

  async function removeUser(id: string) {
    await usersApi.remove(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  // --- Drivers write-through ---
  async function addDriver(e: Driver) {
    const db: DbDriver = {
      id: e.id, first_name: e.firstName, last_name: e.lastName,
      vehicle: e.vehicle, contact: e.contact, safety_score: e.safetyScore,
    };
    const saved = await driversApi.create(db);
    setDrivers((prev) => [...prev, mapDriver(saved)]);
  }

  async function updateDriver(id: string, patch: Partial<Driver>) {
    const dbPatch: Partial<DbDriver> = {};
    if (patch.firstName !== undefined) dbPatch.first_name = patch.firstName;
    if (patch.lastName !== undefined) dbPatch.last_name = patch.lastName;
    if (patch.vehicle !== undefined) dbPatch.vehicle = patch.vehicle;
    if (patch.contact !== undefined) dbPatch.contact = patch.contact;
    if (patch.safetyScore !== undefined) dbPatch.safety_score = patch.safetyScore;
    const saved = await driversApi.update(id, dbPatch);
    setDrivers((prev) => prev.map((e) => e.id === id ? mapDriver(saved) : e));
  }

  async function removeDriver(id: string) {
    await driversApi.remove(id);
    setDrivers((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <AppContext.Provider value={{
      users, setUsers, drivers, setDrivers,
      currentUser, setCurrentUser, settings, setSettings,
      dbReady,
      addUser, updateUser, removeUser,
      addDriver, updateDriver, removeDriver,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
