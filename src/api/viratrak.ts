import { supabase } from "./supabaseClient";
import { assertValid, formatName, formatPlate, formatPhone, validateEmail, validateName, validatePassword, validatePhone, validatePlate } from "../utils/validation";

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

export const usersApi = {
  list: async () => {
    try {
      const client = requireSupabase();
      const { data, error } = await client
        .from("users")
        .select("id, first_name, last_name, email, role, status, last_login, must_change_password, avatar")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data ?? []) as DbUser[];
    } catch (error) {
      console.warn("Falling back to the built-in admin account because Supabase users could not be loaded.", error);
      return [demoLoginUser];
    }
  },
  getByEmail: async (email: string) => {
    const client = requireSupabase();
    const { data, error } = await client
      .from("users")
      .select("id, first_name, last_name, email, role, status, last_login, must_change_password, avatar")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    return data as DbUser | null;
  },
  create: async (u: Omit<DbUser, "created_at">) => {
    const client = requireSupabase();
    assertValid(validateName(u.first_name, "First name"));
    assertValid(validateName(u.last_name, "Last name"));
    assertValid(validateEmail(u.email));
    if (u.password) assertValid(validatePassword(u.password));
    const normalizedEmail = u.email.trim().toLowerCase();
    const { data: existing } = await client.from("users").select("id").eq("email", normalizedEmail).maybeSingle();
    if (existing) throw new Error("Email already exists.");
    const { data, error } = await client
      .from("users")
      .insert({ ...u, first_name: formatName(u.first_name), last_name: formatName(u.last_name), email: normalizedEmail })
      .select("*")
      .single();
    
    if (error) throw error;
    return data as DbUser;
  },
  update: async (id: string, patch: Partial<DbUser>) => {
    const client = requireSupabase();
    if (patch.first_name !== undefined) assertValid(validateName(patch.first_name, "First name"));
    if (patch.last_name !== undefined) assertValid(validateName(patch.last_name, "Last name"));
    if (patch.email !== undefined) assertValid(validateEmail(patch.email));
    if (patch.password) assertValid(validatePassword(patch.password));
    const { data, error } = await client
      .from("users")
      .update({ ...patch, ...(patch.first_name !== undefined ? { first_name: formatName(patch.first_name) } : {}), ...(patch.last_name !== undefined ? { last_name: formatName(patch.last_name) } : {}), ...(patch.email !== undefined ? { email: patch.email.trim().toLowerCase() } : {}) })
      .eq("id", id)
      .select("*")
      .single();
    
    if (error) throw error;
    return data as DbUser;
  },
  remove: async (id: string) => {
    const client = requireSupabase();
    const { error } = await client
      .from("users")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },
};

// ---------- Drivers ----------
export type DbDriver = {
  id: string;
  first_name: string;
  last_name: string;
  vehicle: string;
  contact: string;
};

type RawDriver = {
  driver_id: number;
  first_name: string;
  last_name: string;
  contact_info: string | null;
  vehicle?: { plate_number: string; model: string | null }[];
};

type DriverQueryVehicle = { plate_number: string; model: string | null };
type DriverQueryRow = {
  driver_id: number;
  first_name: string;
  last_name: string;
  contact_info: string | null;
  vehicle: DriverQueryVehicle[] | DriverQueryVehicle | null;
};

type RawDevice = {
  device_id: number;
  vehicle?: {
    plate_number: string;
    driver?: { first_name: string; last_name: string }[];
  }[];
};

async function fetchDriversWithVehicles(): Promise<RawDriver[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("driver")
    .select("driver_id, first_name, last_name, contact_info, vehicle(plate_number, model)")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  const rows = (data ?? []) as unknown as DriverQueryRow[];
  return rows.map((row): RawDriver => ({
    driver_id: row.driver_id,
    first_name: row.first_name,
    last_name: row.last_name,
    contact_info: row.contact_info,
    vehicle: Array.isArray(row.vehicle)
      ? row.vehicle.map((vehicle) => ({
          plate_number: vehicle.plate_number,
          model: vehicle.model,
        }))
      : row.vehicle
        ? [{ plate_number: row.vehicle.plate_number, model: row.vehicle.model }]
        : [],
  }));
}

function mapRawDriverToDbDriver(raw: RawDriver): DbDriver {
  return {
    id: String(raw.driver_id),
    first_name: raw.first_name,
    last_name: raw.last_name,
    vehicle: raw.vehicle?.[0]?.plate_number || raw.vehicle?.[0]?.model || "Unassigned",
    contact: raw.contact_info || "",
  };
}

export const driversApi = {
  list: async () => {
    try {
      const rawDrivers = await fetchDriversWithVehicles();
      return rawDrivers.map(mapRawDriverToDbDriver);
    } catch (error) {
      console.error("Error fetching drivers from schema2:", error);
      return [];
    }
  },
  create: async (e: Omit<DbDriver, "created_at">) => {
    const client = requireSupabase();
    assertValid(validateName(e.first_name, "First name"));
    assertValid(validateName(e.last_name, "Last name"));
    assertValid(validatePlate(e.vehicle));
    assertValid(validatePhone(e.contact));
    const plate = formatPlate(e.vehicle);
    const { data: existingVehicle } = await client.from("vehicle").select("vehicle_id").eq("plate_number", plate).maybeSingle();
    if (existingVehicle) throw new Error("Vehicle plate already exists.");
    const { data, error } = await client
      .from("driver")
      .insert({
        first_name: formatName(e.first_name),
        last_name: formatName(e.last_name),
        license_number: `LIC-${Date.now()}`, // Generate placeholder
        contact_info: formatPhone(e.contact),
      })
      .select("*")
      .single();
    
    if (error) throw error;
    const { error: vehicleError } = await client.from("vehicle").insert({ plate_number: plate, driver_id: data.driver_id });
    if (vehicleError) throw vehicleError;
    
    const raw = data as RawDriver;
    return mapRawDriverToDbDriver(raw);
  },
  update: async (id: string, patch: Partial<DbDriver>) => {
    const client = requireSupabase();
    if (patch.first_name !== undefined) assertValid(validateName(patch.first_name, "First name"));
    if (patch.last_name !== undefined) assertValid(validateName(patch.last_name, "Last name"));
    if (patch.vehicle !== undefined) assertValid(validatePlate(patch.vehicle));
    if (patch.contact !== undefined) assertValid(validatePhone(patch.contact));
    const { data, error } = await client
      .from("driver")
      .update({
        first_name: patch.first_name === undefined ? undefined : formatName(patch.first_name),
        last_name: patch.last_name === undefined ? undefined : formatName(patch.last_name),
        contact_info: patch.contact === undefined ? undefined : formatPhone(patch.contact),
      })
      .eq("driver_id", parseInt(id))
      .select("*")
      .single();
    
    if (error) throw error;
    if (patch.vehicle !== undefined) {
      const plate = formatPlate(patch.vehicle);
      const { data: duplicate } = await client.from("vehicle").select("vehicle_id").eq("plate_number", plate).neq("driver_id", parseInt(id)).maybeSingle();
      if (duplicate) throw new Error("Vehicle plate already exists.");
      const { data: vehicle, error: vehicleLookupError } = await client.from("vehicle").select("vehicle_id").eq("driver_id", parseInt(id)).maybeSingle();
      if (vehicleLookupError) throw vehicleLookupError;
      const vehicleResult = vehicle
        ? await client.from("vehicle").update({ plate_number: plate }).eq("vehicle_id", vehicle.vehicle_id)
        : await client.from("vehicle").insert({ plate_number: plate, driver_id: parseInt(id) });
      if (vehicleResult.error) throw vehicleResult.error;
    }
    
    const raw = data as RawDriver;
    return mapRawDriverToDbDriver(raw);
  },
  remove: async (id: string) => {
    const client = requireSupabase();
    const { error } = await client
      .from("driver")
      .delete()
      .eq("driver_id", parseInt(id));
    
    if (error) throw error;
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

type RawAlert = {
  alert_id: number;
  alert_level?: string;
  alert_type?: string;
  timestamp?: string;
  detection?: {
    timestamp: string;
    event_id: string;
    recorded_evidence?: {
      timestamp: string;
      device_id: number;
    }[];
  }[];
  device?: {
    vehicle_id: number;
    vehicle?: {
      driver_id: number;
      driver?: {
        first_name: string;
        last_name: string;
      };
    };
  };
};

type AlertQueryRow = {
  alert_id: number;
  alert_level?: string;
  alert_type?: string;
  timestamp?: string;
  detection?: {
    timestamp: string;
    event_id: string;
    recorded_evidence?: { timestamp: string; device_id: number }[];
  }[];
};

const SEVERITY_MAP: Record<string, "High" | "Moderate" | "Low"> = {
  High: "High",
  Moderate: "Moderate",
  Low: "Low",
};

const EVENT_ICON_MAP: Record<string, { color: string; bg: string }> = {
  High: { color: "#EF4444", bg: "#FEE2E2" },
  Moderate: { color: "#F59E0B", bg: "#FEF3C7" },
  Low: { color: "#10B981", bg: "#ECFDF5" },
};

function buildRecordEvidenceId(alertNumber: number) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toISOString().slice(11, 19).replace(/:/g, "");
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${date}${time}${String(alertNumber).padStart(2, "0")}-${random}`;
}

async function fetchAlertsWithRelations(): Promise<RawAlert[]> {
  const client = requireSupabase();
  
  // Query alerts with nested relations through detection → recorded_evidence → device → vehicle → driver
  const { data, error } = await client
    .from("alert")
    .select(`
      alert_id,
      alert_level,
      alert_type,
      detection(
        timestamp,
        event_id,
        recorded_evidence(
          timestamp,
          device_id
        )
      )
    `)
    .order("alert_id", { ascending: false });
  
  if (error) throw error;
  const rows = (data ?? []) as unknown as AlertQueryRow[];
  return rows.map((row): RawAlert => ({
    alert_id: row.alert_id,
    alert_level: row.alert_level,
    alert_type: row.alert_type,
    timestamp: row.timestamp,
    detection: Array.isArray(row.detection)
      ? row.detection.map((detection) => ({
          timestamp: detection.timestamp,
          event_id: detection.event_id,
          recorded_evidence: Array.isArray(detection.recorded_evidence)
            ? detection.recorded_evidence.map((evidence) => ({
                timestamp: evidence.timestamp,
                device_id: evidence.device_id,
              }))
            : [],
        }))
      : [],
  }));
}

function mapRawAlertToDbAlert(raw: RawAlert, driverName: string, vehicleName: string): DbAlert {
  const timestamp = raw.timestamp || raw.detection?.[0]?.timestamp || raw.detection?.[0]?.recorded_evidence?.[0]?.timestamp || new Date().toISOString();
  const date = new Date(timestamp).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const time = new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  const severity = raw.alert_level ? SEVERITY_MAP[raw.alert_level] || "Low" : "Low";
  const iconMap = EVENT_ICON_MAP[severity];
  
  return {
    id: raw.alert_id,
    type: raw.alert_type || "Unknown",
    driver: driverName,
    vehicle: vehicleName,
    date,
    time,
    severity,
    evidence: true,
    icon_color: iconMap.color,
    icon_bg: iconMap.bg,
  };
}

export const alertsApi = {
  list: async () => {
    try {
      // First, get all devices and their vehicle/driver associations
      const client = requireSupabase();
      const { data: devices, error: devError } = await client
        .from("device")
        .select("device_id, vehicle(vehicle_id, plate_number, driver(driver_id, first_name, last_name))");
      
      if (devError) throw devError;
      
      const deviceMap = new Map<number, { driver: string; vehicle: string }>();
      devices?.forEach((device: RawDevice) => {
        const vehicleInfo = device.vehicle?.[0];
        const driverInfo = vehicleInfo?.driver?.[0];
        
        deviceMap.set(device.device_id, {
          driver: driverInfo ? `${driverInfo.first_name} ${driverInfo.last_name}` : "Unknown Driver",
          vehicle: vehicleInfo?.plate_number || "Unknown Vehicle",
        });
      });
      
      // Now get alerts with detection info
      const { data: alerts, error: alertError } = await client
        .from("alert")
        .select(`
          alert_id,
          alert_level,
          alert_type,
          detection(
            timestamp,
            event_id,
            recorded_evidence(
              timestamp,
              device_id
            )
          )
        `)
        .order("alert_id", { ascending: false });
      
      if (alertError) throw alertError;
      
      // Map alerts with driver/vehicle info
      return (alerts ?? []).map((raw: RawAlert) => {
        const deviceId = raw.detection?.[0]?.recorded_evidence?.[0]?.device_id;
        const deviceInfo = deviceId ? deviceMap.get(deviceId) : undefined;
        
        return mapRawAlertToDbAlert(
          raw,
          deviceInfo?.driver || "Unknown Driver",
          deviceInfo?.vehicle || "Unknown Vehicle"
        );
      });
    } catch (error) {
      console.error("Error fetching alerts from schema2:", error);
      return [];
    }
  },
  
  create: async (a: Omit<DbAlert, "id" | "created_at">) => {
    const client = requireSupabase();
    
    // Create a recorded_evidence entry first
    const evidenceEventId = buildRecordEvidenceId(0);
    const { data: evidence, error: evidError } = await client
      .from("recorded_evidence")
      .insert({ event_id: evidenceEventId, timestamp: new Date().toISOString() })
      .select("event_id")
      .single();
    
    if (evidError || !evidence) throw evidError;
    
    // Then create detection
    const { data: detection, error: detError } = await client
      .from("detection")
      .insert({
        event_id: evidence.event_id,
        timestamp: new Date().toISOString(),
        driver_state: "alert",
      })
      .select("detection_id")
      .single();
    
    if (detError || !detection) throw detError;
    
    // Finally create alert
    const { data: alert, error: alertError } = await client
      .from("alert")
      .insert({
        detection_id: detection.detection_id,
        alert_type: a.type,
        alert_level: a.severity,
      })
      .select("*")
      .single();
    
    if (alertError) throw alertError;
    
    const raw = alert as RawAlert;
    return mapRawAlertToDbAlert(raw, a.driver, a.vehicle);
  },
  
  remove: async (id: number) => {
    const client = requireSupabase();
    
    // Delete alert (cascade will handle detection and evidence cleanup)
    const { error } = await client
      .from("alert")
      .delete()
      .eq("alert_id", id);
    
    if (error) throw error;
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

type RawSystemLog = {
  systemlog_id: number;
  message: string;
  log_type: string;
  timestamp: string;
  device_id: number | null;
};

type RawBehaviorLog = {
  log_id: number;
  message: string;
  timestamp: string;
  date: string;
  alert_id: number | null;
  device_id: number | null;
};

function determineLogLevel(logType: string): "INFO" | "WARNING" | "ERROR" {
  const type = (logType || "").toLowerCase();
  if (type.includes("error") || type.includes("failed")) return "ERROR";
  if (type.includes("warning") || type.includes("warn")) return "WARNING";
  return "INFO";
}

function mapSystemLogToDbLog(raw: RawSystemLog): DbLog {
  const timestamp = new Date(raw.timestamp);
  const date = timestamp.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const time = timestamp.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  return {
    id: raw.systemlog_id,
    source: "System",
    date,
    time,
    level: determineLogLevel(raw.log_type),
    ref: raw.log_type || "SYSTEM",
    action: raw.message,
  };
}

function mapBehaviorLogToDbLog(raw: RawBehaviorLog): DbLog {
  const timestamp = new Date(raw.timestamp);
  const date = timestamp.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const time = timestamp.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  return {
    id: raw.log_id,
    source: raw.device_id ? "Hardware" : "System",
    date,
    time,
    level: "INFO",
    ref: raw.alert_id ? `ALERT_${raw.alert_id}` : "BEHAVIOR",
    action: raw.message,
  };
}

export const logsApi = {
  list: async () => {
    try {
      const client = requireSupabase();
      
      // Fetch system logs
      const { data: sysLogs, error: sysError } = await client
        .from("system_log")
        .select("systemlog_id, message, log_type, timestamp, device_id")
        .order("timestamp", { ascending: false });
      
      if (sysError) throw sysError;
      
      // Fetch behavior logs as secondary source
      const { data: behaviorLogs, error: behError } = await client
        .from("behavior_log")
        .select("log_id, message, timestamp, date, alert_id, device_id")
        .order("timestamp", { ascending: false })
        .limit(10); // Limit to avoid too many logs
      
      if (behError) throw behError;
      
      // Combine and map
      const systemMapped = (sysLogs ?? []).map(mapSystemLogToDbLog);
      const behaviorMapped = (behaviorLogs ?? []).map(mapBehaviorLogToDbLog);
      
      // Merge and sort by timestamp (newest first)
      const combined = [...systemMapped, ...behaviorMapped].sort((a, b) => {
        const aTime = `${a.date}T${a.time}`;
        const bTime = `${b.date}T${b.time}`;
        return bTime.localeCompare(aTime);
      });
      
      return combined.slice(0, 20); // Return top 20 logs
    } catch (error) {
      console.error("Error fetching logs from schema2:", error);
      return [];
    }
  },
  
  create: async (l: Omit<DbLog, "id" | "created_at">) => {
    const client = requireSupabase();
    
    // Insert into system_log
    const { data, error } = await client
      .from("system_log")
      .insert({
        message: l.action,
        log_type: l.ref,
        timestamp: new Date().toISOString(),
      })
      .select("*")
      .single();
    
    if (error) throw error;
    
    return mapSystemLogToDbLog(data as RawSystemLog);
  },
  
  remove: async (id: number) => {
    const client = requireSupabase();
    
    // Try to delete from system_log first
    const { error } = await client
      .from("system_log")
      .delete()
      .eq("systemlog_id", id);
    
    if (error) {
      // If not found in system_log, try behavior_log
      const { error: behError } = await client
        .from("behavior_log")
        .delete()
        .eq("log_id", id);
      
      if (behError) throw behError;
    }
  },
};
