import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { usersApi, driversApi, vehiclesApi, logsApi, DbUser, DbDriver, DbVehicle, demoLoginUser } from "../../api/viratrak";
import { supabase } from "../../api/supabaseClient";

export type Role = "Owner" | "Administrator" | "Supervisor";

function normalizeRole(role: string): Role {
  return role as Role;
}

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  status: "Active" | "Deactivated";
  lastLogin: string;
  password: string;
  mustChangePassword: boolean;
  avatar?: string | null;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  vehicle: string;
  contact: string;
  avatar?: string | null;
}

export interface Vehicle {
  id: number;
  plateNumber: string;
  model: string;
  deviceId: string | null;
  driverIds: string[];
}

export interface AppSettings {
  firstName: string;
  lastName: string;
  avatar?: string;
}

const adjectives = [
  "Advanced",
  "Active",
  "Secure",
  "Reliable",
  "Professional",
  "Intelligent",
  "Precision",
  "Integrated",
  "Enhanced",
  "Optimal",
  "Trusted",
  "Responsive",
  "Consistent",
  "Efficient",
  "Proactive"
];

const nouns = [
  "Driver",
  "Fleet",
  "Safety",
  "Monitor",
  "Control",
  "Insight",
  "Vision",
  "Analytics",
  "Operations",
  "Performance",
  "Awareness",
  "Management",
  "Tracking",
  "Command",
  "System"
];

export function genTempPassword() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(10 + Math.random() * 90);
  const sym = ["@", "#", "!"][Math.floor(Math.random() * 3)];
  return `${adj}${sym}${noun}${num}`;
}

export function genDriverId(existing: Driver[]) {
  const now = new Date();
  const datePrefix = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const usedSuffixes = new Set<number>();

  existing.forEach((driver) => {
    const digits = driver.id.replace(/\D/g, "");
    if (!digits || digits.length < 8) return;
    const numeric = Number.parseInt(digits, 10);
    if (!Number.isFinite(numeric)) return;
    const raw = String(numeric);
    if (!raw.startsWith(datePrefix)) return;
    const suffix = Number.parseInt(raw.slice(datePrefix.length), 10);
    if (Number.isFinite(suffix)) usedSuffixes.add(suffix);
  });

  for (let suffix = 1; suffix <= 99; suffix += 1) {
    if (!usedSuffixes.has(suffix)) {
      return `${datePrefix}${String(suffix).padStart(2, "0")}`;
    }
  }

  return `${datePrefix}01`;
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
    role: normalizeRole(String(u.role)),
    status: u.status === "Inactive" ? "Deactivated" : u.status,
    lastLogin: u.last_login,
    password: u.password,
    mustChangePassword: u.must_change_password,
    avatar: u.avatar,
  };
}

function mapDriver(e: DbDriver): Driver {
  return {
    id: e.id,
    firstName: e.first_name,
    lastName: e.last_name,
    vehicle: e.vehicle,
    contact: e.contact,
    avatar: e.avatar ?? null,
  };
}

function mapVehicle(v: DbVehicle): Vehicle {
  return {
    id: v.vehicle_id,
    plateNumber: v.plate_number,
    model: v.model ?? "",
    deviceId: v.device_id,
    driverIds: [v.driver_id, v.secondary_driver_id].filter((id): id is number => id !== null).map(String),
  };
}

const seedUsers: AppUser[] = [
  {
    id: demoLoginUser.id,
    firstName: demoLoginUser.first_name,
    lastName: demoLoginUser.last_name,
    email: demoLoginUser.email,
    role: demoLoginUser.role,
    status: demoLoginUser.status === "Inactive" ? "Deactivated" : demoLoginUser.status,
    lastLogin: demoLoginUser.last_login,
    password: demoLoginUser.password,
    mustChangePassword: demoLoginUser.must_change_password,
  },
];

interface AppContextType {
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  vehicles: Vehicle[];
  currentUser: AppUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  dbReady: boolean;
  // Persistent CRUD helpers (write-through to local storage)
  addUser: (u: AppUser, password: string) => Promise<void>;
  updateUser: (id: string, patch: Partial<AppUser>) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  addDriver: (e: Driver) => Promise<void>;
  updateDriver: (id: string, patch: Partial<Driver>) => Promise<void>;
  removeDriver: (id: string) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, "id">) => Promise<void>;
  updateVehicle: (id: number, patch: Partial<Omit<Vehicle, "id">>) => Promise<void>;
  removeVehicle: (id: number) => Promise<void>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(seedUsers);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ firstName: "Admin", lastName: "User" });
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    async function hydrateSession(session: Session | null) {
      if (!session?.user.email) return;
      try {
        const profile = await usersApi.getByEmail(session.user.email);
        if (profile?.status === "Active") {
          setCurrentUser((previous) => {
            const mapped = mapUser(profile);
            if (previous?.id === mapped.id && previous.lastLogin !== "Never" && mapped.lastLogin === "Never") {
              return { ...mapped, lastLogin: previous.lastLogin };
            }
            return mapped;
          });
          setSettings((previous) => ({ ...previous, firstName: profile.first_name, lastName: profile.last_name, avatar: profile.avatar ?? previous.avatar }));
        }
      } catch (error) {
        console.error("Could not restore the Supabase session profile:", error);
      }
    }

    void supabase.auth.getSession().then(({ data: { session } }) => hydrateSession(session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setCurrentUser(null);
      else void hydrateSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load protected lists after authentication is available.
  useEffect(() => {
    if (!currentUser?.id) {
      setDbReady(true);
      return;
    }
    if (!supabase) {
      setDbReady(true);
      return;
    }

    let isActive = true;
    setDbReady(false);
    Promise.all([
      usersApi.list().then((rows) => {
        if (!isActive) return;
        setUsers(rows.map(mapUser));
      }),
      driversApi.list().then((rows) => {
        if (!isActive) return;
        setDrivers(rows.map(mapDriver));
      }),
      vehiclesApi.list().then((rows) => {
        if (!isActive) return;
        setVehicles(rows.map(mapVehicle));
      }),
    ])
      .catch((e) => {
        if (!isActive) return;
        console.warn("Data load failed, using available data:", e);
      })
      .finally(() => {
        if (isActive) setDbReady(true);
      });

    return () => {
      isActive = false;
    };
  }, [currentUser?.id]);

  // Persist currentUser in session storage while logged in, and in local storage only when stayLoggedIn is true.
  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem("currentUser");
      }
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
    if (patch.avatar !== undefined) dbPatch.avatar = patch.avatar ?? null;
    const saved = await usersApi.update(id, dbPatch);
    setUsers((prev) => prev.map((u) => u.id === id ? mapUser(saved) : u));
  }

  async function removeUser(id: string) {
    await usersApi.remove(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  // --- Drivers write-through ---
  function recordDriverAction(action: string, ref: string) {
    void logsApi.create({ action, ref }).catch((error) => console.warn("Could not record driver audit log:", error));
  }

  async function addDriver(e: Driver) {
    const db: DbDriver = {
      id: e.id, first_name: e.firstName, last_name: e.lastName,
      vehicle: e.vehicle, contact: e.contact, avatar: e.avatar ?? null,
    };
    const saved = await driversApi.create(db);
    setDrivers((prev) => [...prev, mapDriver(saved)]);
    if (e.vehicle) {
      setVehicles((prev) => prev.map((vehicle) => vehicle.plateNumber === e.vehicle
        ? { ...vehicle, driverIds: [...vehicle.driverIds, saved.id] }
        : vehicle));
    }
    recordDriverAction(`Driver ${saved.first_name} ${saved.last_name} was added with ID ${saved.id}${saved.vehicle !== "Unassigned" ? ` and assigned vehicle ${saved.vehicle}.` : ". No vehicle was assigned."}`, "DRIVER_CREATED");
  }

  async function updateDriver(id: string, patch: Partial<Driver>) {
    const dbPatch: Partial<DbDriver> = {};
    if (patch.firstName !== undefined) dbPatch.first_name = patch.firstName;
    if (patch.lastName !== undefined) dbPatch.last_name = patch.lastName;
    if (patch.vehicle !== undefined) dbPatch.vehicle = patch.vehicle;
    if (patch.contact !== undefined) dbPatch.contact = patch.contact;
    if (patch.avatar !== undefined) dbPatch.avatar = patch.avatar ?? null;
    const saved = await driversApi.update(id, dbPatch);
    setDrivers((prev) => prev.map((e) => e.id === id ? mapDriver(saved) : e));
    if (patch.vehicle !== undefined) {
      setVehicles((prev) => prev.map((vehicle) => {
        const driverIds = vehicle.driverIds.filter((driverId) => driverId !== id);
        if (saved.vehicle === vehicle.plateNumber) {
          return { ...vehicle, driverIds: [...driverIds, id] };
        }
        return { ...vehicle, driverIds };
      }));
    }
    recordDriverAction(`Driver ${saved.first_name} ${saved.last_name} (${saved.id}) was updated${saved.vehicle !== "Unassigned" ? `; assigned vehicle is now ${saved.vehicle}.` : "; no vehicle is assigned."}`, "DRIVER_UPDATED");
  }

  async function removeDriver(id: string) {
    const removedDriver = drivers.find((driver) => driver.id === id);
    await driversApi.remove(id);
    setDrivers((prev) => prev.filter((e) => e.id !== id));
    if (removedDriver) recordDriverAction(`Driver ${removedDriver.firstName} ${removedDriver.lastName} (${removedDriver.id}) was removed from the system.`, "DRIVER_DELETED");
  }

  async function addVehicle(vehicle: Omit<Vehicle, "id">) {
    const saved = await vehiclesApi.create({
      plate_number: vehicle.plateNumber,
      model: vehicle.model,
      device_id: vehicle.deviceId,
      driver_id: vehicle.driverIds[0] ? parseInt(vehicle.driverIds[0], 10) : null,
      secondary_driver_id: vehicle.driverIds[1] ? parseInt(vehicle.driverIds[1], 10) : null,
    });
    setVehicles((prev) => [mapVehicle(saved), ...prev]);
  }

  async function updateVehicle(id: number, patch: Partial<Omit<Vehicle, "id">>) {
    const saved = await vehiclesApi.update(id, {
      ...(patch.plateNumber === undefined ? {} : { plate_number: patch.plateNumber }),
      ...(patch.model === undefined ? {} : { model: patch.model }),
      ...(patch.deviceId === undefined ? {} : { device_id: patch.deviceId }),
      ...(patch.driverIds === undefined ? {} : {
        driver_id: patch.driverIds[0] ? parseInt(patch.driverIds[0], 10) : null,
        secondary_driver_id: patch.driverIds[1] ? parseInt(patch.driverIds[1], 10) : null,
      }),
    });
    setVehicles((prev) => prev.map((vehicle) => vehicle.id === id ? mapVehicle(saved) : vehicle));
  }

  async function removeVehicle(id: number) {
    await vehiclesApi.remove(id);
    setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== id));
  }

  return (
    <AppContext.Provider value={{
      users, setUsers, drivers, setDrivers, vehicles,
      currentUser, setCurrentUser, settings, setSettings,
      dbReady,
      addUser, updateUser, removeUser,
      addDriver, updateDriver, removeDriver,
      addVehicle, updateVehicle, removeVehicle,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
