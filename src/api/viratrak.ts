import { supabase } from "./supabaseClient";
import { assertValid, formatName, formatPlate, formatPhone, validateEmail, validateName, validatePassword, validatePhone, validatePlate } from "../utils/validation";

// ---------- Users ----------
export type DbUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "Owner" | "Administrator" | "Supervisor";
  status: "Active" | "Deactivated" | "Inactive";
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
    const { data, error } = await client.functions.invoke("create-user", {
      body: {
        firstName: formatName(u.first_name),
        lastName: formatName(u.last_name),
        email: u.email.trim().toLowerCase(),
        role: u.role,
        password: u.password,
      },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return { ...data.profile, password: "" } as DbUser;
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
      .select("id, first_name, last_name, email, role, status, last_login, password, must_change_password, avatar")
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

type RawDevice = {
  device_id: string;
  vehicle_id: number | null;
};

function normalizeDriverId(value: string | number): number {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) throw new Error("Driver ID is required.");
  const numeric = Number.parseInt(digits, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) throw new Error("Driver ID must be a positive integer.");
  if (String(numeric).length !== 8) throw new Error("Driver ID must match the YYMMDDNN format.");
  return numeric;
}

async function assertDriverIdAvailable(client: ReturnType<typeof requireSupabase>, id: number, excludedId?: number) {
  const { data, error } = await client
    .from("driver")
    .select("driver_id")
    .eq("driver_id", id)
    .maybeSingle();

  if (error) throw error;
  if (data && Number(data.driver_id) !== excludedId) {
    throw new Error("Driver ID is already assigned to another active driver.");
  }
}

async function fetchDriversWithVehicles(): Promise<RawDriver[]> {
  const client = requireSupabase();
  const { data: driverRows, error: driverError } = await client
    .from("driver")
    .select("driver_id, first_name, last_name, contact_info")
    .order("created_at", { ascending: false });

  if (driverError) throw driverError;

  const { data: vehicleRows, error: vehicleError } = await client
    .from("vehicle")
    .select("plate_number, model, driver_id, secondary_driver_id");

  if (vehicleError) throw vehicleError;

  const vehiclesByDriver = new Map<number, DriverQueryVehicle[]>();
  for (const vehicle of vehicleRows ?? []) {
    const mappedVehicle = { plate_number: vehicle.plate_number, model: vehicle.model };
    for (const driverId of [vehicle.driver_id, vehicle.secondary_driver_id]) {
      if (driverId === null) continue;
      const existing = vehiclesByDriver.get(driverId) ?? [];
      existing.push(mappedVehicle);
      vehiclesByDriver.set(driverId, existing);
    }
  }

  return (driverRows ?? []).map((row): RawDriver => ({
    driver_id: row.driver_id,
    first_name: row.first_name,
    last_name: row.last_name,
    contact_info: row.contact_info,
    vehicle: vehiclesByDriver.get(row.driver_id) ?? [],
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
    const rawDrivers = await fetchDriversWithVehicles();
    return rawDrivers.map(mapRawDriverToDbDriver);
  },
  create: async (e: Omit<DbDriver, "created_at">) => {
    const client = requireSupabase();
    assertValid(validateName(e.first_name, "First name"));
    assertValid(validateName(e.last_name, "Last name"));
    if (e.vehicle) assertValid(validatePlate(e.vehicle));
    assertValid(validatePhone(e.contact));
    const driverId = normalizeDriverId(e.id);
    await assertDriverIdAvailable(client, driverId);
    const plate = e.vehicle ? formatPlate(e.vehicle) : "";

    const { data, error } = await client
      .from("driver")
      .insert({
        driver_id: driverId,
        first_name: formatName(e.first_name),
        last_name: formatName(e.last_name),
        license_number: `LIC-${Date.now()}`,
        contact_info: formatPhone(e.contact),
      })
      .select("driver_id, first_name, last_name, contact_info")
      .single();

    if (error) throw error;

    if (plate) {
      const { data: vehicle, error: vehicleLookupError } = await client
        .from("vehicle")
        .select("vehicle_id, driver_id, secondary_driver_id")
        .eq("plate_number", plate)
        .maybeSingle();
      if (vehicleLookupError) throw vehicleLookupError;
      if (!vehicle) throw new Error("Selected vehicle was not found.");
      if (vehicle.driver_id !== null && vehicle.secondary_driver_id !== null) {
        throw new Error("Selected vehicle already has two assigned drivers.");
      }
      const assignment = vehicle.driver_id === null
        ? { driver_id: data.driver_id }
        : { secondary_driver_id: data.driver_id };
      const { error: vehicleError } = await client
        .from("vehicle")
        .update(assignment)
        .eq("vehicle_id", vehicle.vehicle_id);
      if (vehicleError) {
        await client.from("driver").delete().eq("driver_id", data.driver_id);
        throw vehicleError;
      }
    }

    const raw = data as RawDriver;
    return { ...mapRawDriverToDbDriver(raw), id: String(data.driver_id), vehicle: plate || "Unassigned" };
  },
  update: async (id: string, patch: Partial<DbDriver>) => {
    const client = requireSupabase();
    if (patch.first_name !== undefined) assertValid(validateName(patch.first_name, "First name"));
    if (patch.last_name !== undefined) assertValid(validateName(patch.last_name, "Last name"));
    if (patch.vehicle !== undefined) assertValid(validatePlate(patch.vehicle));
    if (patch.contact !== undefined) assertValid(validatePhone(patch.contact));
    const numericId = parseInt(id, 10);
    const { data, error } = await client
      .from("driver")
      .update({
        first_name: patch.first_name === undefined ? undefined : formatName(patch.first_name),
        last_name: patch.last_name === undefined ? undefined : formatName(patch.last_name),
        contact_info: patch.contact === undefined ? undefined : formatPhone(patch.contact),
      })
      .eq("driver_id", numericId)
      .select("driver_id, first_name, last_name, contact_info")
      .single();

    if (error) throw error;
    if (patch.vehicle !== undefined) {
      const plate = formatPlate(patch.vehicle);
      const { data: vehicleRows, error: vehicleLookupError } = await client
        .from("vehicle")
        .select("vehicle_id, plate_number, driver_id, secondary_driver_id");
      if (vehicleLookupError) throw vehicleLookupError;
      const currentVehicle = (vehicleRows ?? []).find((vehicle) => vehicle.driver_id === numericId || vehicle.secondary_driver_id === numericId);
      const selectedVehicle = (vehicleRows ?? []).find((vehicle) => vehicle.plate_number === plate);
      if (!selectedVehicle) throw new Error("Selected vehicle was not found.");
      if (currentVehicle?.vehicle_id !== selectedVehicle.vehicle_id) {
        if (selectedVehicle.driver_id !== null && selectedVehicle.secondary_driver_id !== null) {
          throw new Error("Selected vehicle already has two assigned drivers.");
        }
        if (currentVehicle) {
          const clearAssignment = currentVehicle.driver_id === numericId
            ? { driver_id: null }
            : { secondary_driver_id: null };
          const { error: clearError } = await client.from("vehicle").update(clearAssignment).eq("vehicle_id", currentVehicle.vehicle_id);
          if (clearError) throw clearError;
        }
        const assignment = selectedVehicle.driver_id === null
          ? { driver_id: numericId }
          : { secondary_driver_id: numericId };
        const { error: assignError } = await client.from("vehicle").update(assignment).eq("vehicle_id", selectedVehicle.vehicle_id);
        if (assignError) throw assignError;
      }
    }

    const raw = data as RawDriver;
    return { ...mapRawDriverToDbDriver(raw), ...(patch.vehicle !== undefined ? { vehicle: formatPlate(patch.vehicle) } : {}) };
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

// ---------- Vehicles ----------
export type DbVehicle = {
  vehicle_id: number;
  plate_number: string;
  model: string | null;
  driver_id: number | null;
  secondary_driver_id: number | null;
};

async function assertDriversAvailable(client: ReturnType<typeof requireSupabase>, driverIds: Array<number | null>, excludedVehicleId?: number) {
  const normalizedDriverIds = [...new Set(driverIds.filter((id): id is number => id !== null && Number.isInteger(id) && id > 0))];
  if (normalizedDriverIds.length === 0) return;

  const { data: vehicleRows, error } = await client
    .from("vehicle")
    .select("vehicle_id, driver_id, secondary_driver_id");

  if (error) throw error;

  const hasConflict = (vehicleRows ?? []).some((row) => {
    if (excludedVehicleId !== undefined && row.vehicle_id === excludedVehicleId) return false;
    const assignedDriverIds = [row.driver_id, row.secondary_driver_id].filter((id): id is number => id !== null);
    return assignedDriverIds.some((assignedId) => normalizedDriverIds.includes(assignedId));
  });

  if (hasConflict) {
    throw new Error("One or more selected drivers are already assigned to another vehicle.");
  }
}

export const vehiclesApi = {
  list: async () => {
    const client = requireSupabase();
    const { data, error } = await client
      .from("vehicle")
      .select("vehicle_id, plate_number, model, driver_id, secondary_driver_id")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as DbVehicle[];
  },
  create: async (vehicle: Pick<DbVehicle, "plate_number" | "model" | "driver_id" | "secondary_driver_id">) => {
    const client = requireSupabase();
    assertValid(validatePlate(vehicle.plate_number));
    if (vehicle.driver_id !== null && vehicle.driver_id === vehicle.secondary_driver_id) throw new Error("Select two different drivers.");
    const plate = formatPlate(vehicle.plate_number);
    const { data: duplicate } = await client
      .from("vehicle")
      .select("vehicle_id")
      .eq("plate_number", plate)
      .maybeSingle();
    if (duplicate) throw new Error("Vehicle plate already exists.");
    await assertDriversAvailable(client, [vehicle.driver_id, vehicle.secondary_driver_id]);
    const { data, error } = await client
      .from("vehicle")
      .insert({ plate_number: plate, model: vehicle.model?.trim() || null, driver_id: vehicle.driver_id, secondary_driver_id: vehicle.secondary_driver_id })
      .select("vehicle_id, plate_number, model, driver_id, secondary_driver_id")
      .single();
    if (error) throw error;
    return data as DbVehicle;
  },
  update: async (id: number, patch: Partial<Pick<DbVehicle, "plate_number" | "model" | "driver_id" | "secondary_driver_id">>) => {
    const client = requireSupabase();
    const dbPatch: Partial<Pick<DbVehicle, "plate_number" | "model" | "driver_id" | "secondary_driver_id">> = { ...patch };

    if (patch.driver_id !== undefined && patch.secondary_driver_id !== undefined && patch.driver_id !== null && patch.driver_id === patch.secondary_driver_id) {
      throw new Error("Select two different drivers.");
    }

    const currentVehicle = ((patch.driver_id !== undefined || patch.secondary_driver_id !== undefined)
      ? await client.from("vehicle").select("vehicle_id, driver_id, secondary_driver_id").eq("vehicle_id", id).maybeSingle()
      : null);

    const nextDriverIds = [
      patch.driver_id ?? currentVehicle?.driver_id ?? null,
      patch.secondary_driver_id ?? currentVehicle?.secondary_driver_id ?? null,
    ];

    if (nextDriverIds[0] !== null && nextDriverIds[0] === nextDriverIds[1]) {
      throw new Error("Select two different drivers.");
    }

    if (patch.driver_id !== undefined || patch.secondary_driver_id !== undefined) {
      await assertDriversAvailable(client, nextDriverIds, id);
    }

    if (patch.plate_number !== undefined) {
      assertValid(validatePlate(patch.plate_number));
      dbPatch.plate_number = formatPlate(patch.plate_number);
      const { data: duplicate } = await client
        .from("vehicle")
        .select("vehicle_id")
        .eq("plate_number", dbPatch.plate_number)
        .neq("vehicle_id", id)
        .maybeSingle();
      if (duplicate) throw new Error("Vehicle plate already exists.");
    }
    if (patch.model !== undefined) dbPatch.model = patch.model?.trim() || null;
    const { data, error } = await client
      .from("vehicle")
      .update(dbPatch)
      .eq("vehicle_id", id)
      .select("vehicle_id, plate_number, model, driver_id, secondary_driver_id")
      .single();
    if (error) throw error;
    return data as DbVehicle;
  },
  remove: async (id: number) => {
    const client = requireSupabase();
    const { error } = await client.from("vehicle").delete().eq("vehicle_id", id);
    if (error) throw error;
  },
};

export type DriverMetricReading = {
  timestamp: string;
  perclos: number | null;
  blinkRate: number | null;
  yawn: number | null;
  bodyPosture: number | null;
  headPose: number | null;
};

export const driverMetricsApi = {
  list: async (driverId: string, startAt?: string, endAt?: string) => {
    const client = requireSupabase();
    const numericDriverId = parseInt(driverId, 10);
    if (!Number.isFinite(numericDriverId)) return [] as DriverMetricReading[];

    const { data: vehicles, error: vehicleError } = await client
      .from("vehicle")
      .select("vehicle_id")
      .or(`driver_id.eq.${numericDriverId},secondary_driver_id.eq.${numericDriverId}`);
    if (vehicleError) throw vehicleError;
    const vehicleIds = (vehicles ?? []).map((vehicle) => vehicle.vehicle_id as number);
    if (vehicleIds.length === 0) return [];

    const { data: devices, error: deviceError } = await client
      .from("device")
      .select("device_id")
      .in("vehicle_id", vehicleIds);
    if (deviceError) throw deviceError;
    const deviceIds = (devices ?? []).map((device) => device.device_id as string);
    if (deviceIds.length === 0) return [];

    const { data: events, error: eventError } = await client
      .from("detection_events")
      .select("id, device_id")
      .in("device_id", deviceIds);
    if (eventError) throw eventError;
    const eventIds = (events ?? []).map((event) => event.id as number);
    if (eventIds.length === 0) return [];

    let detectionsQuery = client
      .from("detection")
      .select("timestamp, perclos, blink_rate, yawn, body_posture, head_pose")
      .in("detection_event_id", eventIds);
    if (startAt) detectionsQuery = detectionsQuery.gte("timestamp", startAt);
    if (endAt) detectionsQuery = detectionsQuery.lte("timestamp", endAt);
    const { data: detections, error: detectionError } = await detectionsQuery.order("timestamp", { ascending: true });
    if (detectionError) throw detectionError;
    return (detections ?? []).map((reading) => ({
      timestamp: reading.timestamp,
      perclos: reading.perclos,
      blinkRate: reading.blink_rate,
      yawn: reading.yawn,
      bodyPosture: reading.body_posture,
      headPose: reading.head_pose,
    })) as DriverMetricReading[];
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
  evidenceDetails?: {
    eventId: string;
    timestamp: string;
    deviceId: string | null;
    imageUrl: string | null;
    triggeredMetrics: string[];
    driverState: string | null;
  };
  icon_color: string;
  icon_bg: string;
};

type RawEvidence = {
  timestamp: string;
  device_id: string;
};

type RawDetectionEvent = {
  created_at: string;
  device_id: string;
  screenshot_url: string | null;
  triggered_metrics: string[];
};

type RawDetection = {
  timestamp: string;
  event_id: string;
  driver_state?: string | null;
  recorded_evidence?: RawEvidence | RawEvidence[];
  detection_events?: RawDetectionEvent | RawDetectionEvent[];
};

type RawAlert = {
  alert_id: number;
  alert_level?: string;
  alert_type?: string;
  timestamp?: string;
  detection?: RawDetection | RawDetection[];
};

type AlertQueryRow = RawAlert;

function firstRelation<T>(relation: T | T[] | null | undefined): T | undefined {
  return Array.isArray(relation) ? relation[0] : relation ?? undefined;
}

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
  return rows;
}

function mapRawAlertToDbAlert(raw: RawAlert, driverName: string, vehicleName: string): DbAlert {
  const detection = firstRelation(raw.detection);
  const evidence = firstRelation(detection?.recorded_evidence);
  const detectionEvent = firstRelation(detection?.detection_events);
  const timestamp = raw.timestamp || detection?.timestamp || evidence?.timestamp || detectionEvent?.created_at || new Date().toISOString();
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
    evidence: Boolean(evidence || detectionEvent?.screenshot_url),
    evidenceDetails: evidence || detectionEvent
      ? {
          eventId: detection?.event_id || "Unavailable",
          timestamp,
          deviceId: evidence?.device_id || detectionEvent?.device_id || null,
          imageUrl: detectionEvent?.screenshot_url || null,
          triggeredMetrics: detectionEvent?.triggered_metrics || [],
          driverState: detection?.driver_state || null,
        }
      : undefined,
    icon_color: iconMap.color,
    icon_bg: iconMap.bg,
  };
}

export const alertsApi = {
  list: async () => {
    try {
      // Resolve device ownership with flat lookups because vehicle has two
      // foreign keys to driver (primary and secondary).
      const client = requireSupabase();
      const { data: devices, error: devError } = await client
        .from("device")
        .select("device_id, vehicle_id");
      
      if (devError) throw devError;
      const vehicleIds = [...new Set((devices ?? []).map((device: RawDevice) => device.vehicle_id).filter((id): id is number => id !== null))];
      const { data: vehicles, error: vehicleError } = await client
        .from("vehicle")
        .select("vehicle_id, plate_number, driver_id, secondary_driver_id")
        .in("vehicle_id", vehicleIds.length > 0 ? vehicleIds : [-1]);
      if (vehicleError) throw vehicleError;

      const driverIds = [...new Set((vehicles ?? []).flatMap((vehicle) => [vehicle.driver_id, vehicle.secondary_driver_id]).filter((id): id is number => id !== null))];
      const { data: drivers, error: driverError } = await client
        .from("driver")
        .select("driver_id, first_name, last_name")
        .in("driver_id", driverIds.length > 0 ? driverIds : [-1]);
      if (driverError) throw driverError;

      const driverMap = new Map((drivers ?? []).map((driver) => [driver.driver_id, `${driver.first_name} ${driver.last_name}`]));
      const vehicleMap = new Map((vehicles ?? []).map((vehicle) => [vehicle.vehicle_id, {
        vehicle: vehicle.plate_number,
        driver: driverMap.get(vehicle.driver_id) || driverMap.get(vehicle.secondary_driver_id) || "Unknown Driver",
      }]));
      const deviceMap = new Map<string, { driver: string; vehicle: string }>();
      devices?.forEach((device: RawDevice) => {
        const vehicleInfo = device.vehicle_id === null ? undefined : vehicleMap.get(device.vehicle_id);
        deviceMap.set(device.device_id, vehicleInfo || { driver: "Unknown Driver", vehicle: "Unknown Vehicle" });
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
            driver_state,
            recorded_evidence(
              timestamp,
              device_id
            ),
            detection_events(
              created_at,
              device_id,
              screenshot_url,
              triggered_metrics
            )
          )
        `)
        .order("alert_id", { ascending: false });
      
      if (alertError) throw alertError;
      
      // Map alerts with driver/vehicle info
      return (alerts ?? []).map((raw: RawAlert) => {
        const detection = firstRelation(raw.detection);
        const evidence = firstRelation(detection?.recorded_evidence);
        const deviceId = evidence?.device_id;
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

// ---------- Detection Metrics ----------
export type DbMetric = {
  timestamp: string;
  perclos: number | null;
  blink_rate: number | null;
  yawn: number | null;
  body_posture: number | null;
  head_pose: number | null;
};

export const metricsApi = {
  list: async () => {
    const client = requireSupabase();
    const { data, error } = await client
      .from("detection")
      .select("timestamp, perclos, blink_rate, yawn, body_posture, head_pose")
      .order("timestamp", { ascending: false })
      .limit(30);

    if (error) throw error;
    return (data ?? []) as DbMetric[];
  },
};

// ---------- System Logs ----------
export type DbLog = {
  id: number;
  source: "System" | "Hardware" | "Behavior";
  date: string;
  time: string;
  level: "INFO" | "WARNING" | "ERROR";
  ref: string;
  action: string;
  actor: string;
};

type RawSystemLog = {
  systemlog_id: number;
  message: string;
  log_type: string;
  timestamp: string;
  device_id: number | null;
  actor_role: string | null;
  actor_name: string | null;
  operation: string | null;
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
    second: "2-digit",
    hour12: false,
  });

  const logType = (raw.log_type || "").toUpperCase();
  const operation = (raw.operation || "").toUpperCase();
  const message = (raw.message || "").trim();
  const isPasswordUpdate =
    logType === "USER_PASSWORD_UPDATE" ||
    operation === "UPDATE_PASSWORD" ||
    message.toLowerCase().includes("password");

  return {
    id: raw.systemlog_id,
    source: "System",
    date,
    time,
    level: determineLogLevel(raw.log_type),
    ref: isPasswordUpdate ? "USER_PASSWORD_UPDATE" : (raw.log_type || "SYSTEM"),
    action: isPasswordUpdate ? "User updated password" : message || "System event",
    actor: raw.actor_name || raw.actor_role || "System",
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
    second: "2-digit",
    hour12: false,
  });

  // Behavior logs are a separate source from system/audit logs.
  // Treating them as System/Hardware causes alert-backed rows like ALERT_15 to
  // appear in the System Logs source filter and look like a new system event.
  return {
    id: raw.log_id,
    source: "Behavior",
    date,
    time,
    level: "INFO",
    ref: raw.alert_id ? `ALERT_${raw.alert_id}` : "BEHAVIOR",
    action: raw.message,
    actor: "System",
  };
}

export const logsApi = {
  list: async () => {
    try {
      const client = requireSupabase();
      
      // Fetch system logs
      const { data: sysLogs, error: sysError } = await client
        .from("system_log")
        .select("systemlog_id, message, log_type, timestamp, device_id, actor_role, actor_name, operation")
        .order("timestamp", { ascending: false });
      
      if (sysError) throw sysError;
      
      // Fetch behavior logs as secondary source
      const { data: behaviorLogs, error: behError } = await client
        .from("behavior_log")
        .select("log_id, message, timestamp, date, alert_id, device_id")
        .order("timestamp", { ascending: false })
        .limit(10); // Limit to avoid too many logs
      
      if (behError) throw behError;
      
      // Keep system/audit entries and behavior entries separate so the UI can
      // filter them correctly instead of mixing alert references into the System source.
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
  
  create: async (l: Pick<DbLog, "action" | "ref">) => {
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
