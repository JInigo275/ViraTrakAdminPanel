import { supabase } from "./supabaseClient";
import { assertValid, formatName, formatPlate, formatPhone, validateDeviceId, validateEmail, validateName, validatePassword, validatePhone, validatePlate } from "../utils/validation";

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
  device_id: string | null;
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
    const { data: detectionRows, error: detectionError } = await client
      .from("detection_data")
      .select("vehicle_id, device_id, created_at")
      .not("vehicle_id", "is", null)
      .order("created_at", { ascending: false });
    if (detectionError) throw detectionError;
    const devicesByVehicle = new Map<number, string>();
    for (const detection of detectionRows ?? []) {
      if (detection.vehicle_id !== null && !devicesByVehicle.has(detection.vehicle_id)) {
        devicesByVehicle.set(detection.vehicle_id, detection.device_id);
      }
    }
    return (data ?? []).map((vehicle) => ({ ...vehicle, device_id: devicesByVehicle.get(vehicle.vehicle_id) ?? null })) as DbVehicle[];
  },
  create: async (vehicle: Pick<DbVehicle, "plate_number" | "model" | "device_id" | "driver_id" | "secondary_driver_id">) => {
    const client = requireSupabase();
    assertValid(validatePlate(vehicle.plate_number));
    assertValid(validateDeviceId(vehicle.device_id));
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
    return { ...data, device_id: vehicle.device_id } as DbVehicle;
  },
  update: async (id: number, patch: Partial<Pick<DbVehicle, "plate_number" | "model" | "device_id" | "driver_id" | "secondary_driver_id">>) => {
    const client = requireSupabase();
    const { device_id: deviceId, ...vehiclePatch } = patch;
    const dbPatch: Partial<Pick<DbVehicle, "plate_number" | "model" | "driver_id" | "secondary_driver_id">> = { ...vehiclePatch };
    if (deviceId !== undefined) assertValid(validateDeviceId(deviceId));

    if (patch.driver_id !== undefined && patch.secondary_driver_id !== undefined && patch.driver_id !== null && patch.driver_id === patch.secondary_driver_id) {
      throw new Error("Select two different drivers.");
    }

    const currentVehicle = ((patch.driver_id !== undefined || patch.secondary_driver_id !== undefined)
      ? (await client.from("vehicle").select("vehicle_id, driver_id, secondary_driver_id").eq("vehicle_id", id).maybeSingle()).data
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
    const { data: latestDetection } = await client
      .from("detection_data")
      .select("device_id")
      .eq("vehicle_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { ...data, device_id: deviceId ?? latestDetection?.device_id ?? null } as DbVehicle;
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

    let detectionsQuery = client
      .from("detection_data")
      .select("created_at, reported_at, eyes_status, yawn_status, posture_status, head_pose_status")
      .in("vehicle_id", vehicleIds);
    if (startAt) detectionsQuery = detectionsQuery.gte("created_at", startAt);
    if (endAt) detectionsQuery = detectionsQuery.lte("created_at", endAt);
    const { data: detections, error: detectionError } = await detectionsQuery.order("created_at", { ascending: true });
    if (detectionError) throw detectionError;
    return (detections ?? []).map((reading) => ({
      timestamp: reading.reported_at ?? reading.created_at,
      perclos: extractStatusMetric(reading.eyes_status),
      blinkRate: null,
      yawn: extractStatusMetric(reading.yawn_status),
      bodyPosture: extractStatusMetric(reading.posture_status),
      headPose: extractStatusMetric(reading.head_pose_status),
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
  id?: number;
  alert_id?: number;
  created_at?: string;
  reported_at?: string | null;
  alert_level?: string;
  alert_type?: string;
  timestamp?: string;
  driver?: string;
  driver_name?: string;
  vehicle?: string;
  vehicle_name?: string;
  plate_number?: string;
  evidence?: boolean;
  image_url?: string | null;
  device_id?: string | null;
  triggered_metrics?: string[];
  driver_state?: string | null;
  detection?: RawDetection | RawDetection[];
};

type AlertQueryRow = RawAlert;

type RecentAlertRow = RawAlert & Record<string, unknown>;

function firstRelation<T>(relation: T | T[] | null | undefined): T | undefined {
  return Array.isArray(relation) ? relation[0] : relation ?? undefined;
}

function firstString(row: RecentAlertRow, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function formatMetricName(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeAlertLevel(value?: string | null): string {
  return (value ?? "").trim().toUpperCase();
}

const SEVERITY_MAP: Record<string, "High" | "Moderate" | "Low"> = {
  HIGH: "High",
  MODERATE: "Moderate",
  MEDIUM: "Moderate",
  LOW: "Low",
  ALERT: "High",
  WARNING: "Moderate",
  CRITICAL: "High",
  NORMAL: "Low",
  INFO: "Low",
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
  const { data, error } = await client
    .from("detection_data")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  const rows = (data ?? []) as unknown as AlertQueryRow[];
  return rows;
}

function buildMetricAlertId(raw: RawAlert, metric: string, index: number): number {
  const baseId = raw.id ?? raw.alert_id ?? 0;
  if (index === 0) return baseId;
  const source = `${baseId}:${metric}:${index}`;
  let hash = 0;
  for (let characterIndex = 0; characterIndex < source.length; characterIndex += 1) {
    hash = (hash * 31 + source.charCodeAt(characterIndex)) | 0;
  }
  return Math.abs(hash) || index;
}

function mapRawAlertToDbAlerts(raw: RawAlert, driverName: string, vehicleName: string): DbAlert[] {
  const viewRow = raw as RecentAlertRow;
  const detection = firstRelation(raw.detection);
  const evidence = firstRelation(detection?.recorded_evidence);
  const detectionEvent = firstRelation(detection?.detection_events);
  const timestamp = raw.timestamp
    || firstString(viewRow, ["alert_timestamp", "detection_timestamp", "event_timestamp", "reported_at", "created_at"])
    || raw.reported_at
    || raw.created_at
    || detection?.timestamp
    || evidence?.timestamp
    || detectionEvent?.created_at
    || new Date().toISOString();
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
  
  const severityValue = raw.alert_level || firstString(viewRow, ["severity", "level"]);
  const severity = severityValue ? SEVERITY_MAP[normalizeAlertLevel(severityValue)] || "Low" : "Low";
  const iconMap = EVENT_ICON_MAP[severity];
  const imageUrl = firstString(viewRow, ["image_url", "screenshot_url"]);
  const deviceId = firstString(viewRow, ["device_id"]);
  const eventId = firstString(viewRow, ["event_id", "evidence_event_id"]) || (raw.id !== undefined ? String(raw.id) : undefined);
  const triggeredMetrics = Array.isArray(viewRow.triggered_metrics) ? viewRow.triggered_metrics.filter(Boolean) : [];
  const hasEvidence = typeof viewRow.evidence === "boolean"
    ? viewRow.evidence
    : Boolean(evidence || detectionEvent?.screenshot_url || imageUrl);

  const metrics = triggeredMetrics.length > 0
    ? triggeredMetrics
    : [raw.alert_type || firstString(viewRow, ["type", "event_type"]) || "Alert"];

  return metrics.map((metric, index) => ({
    id: buildMetricAlertId(raw, metric, index),
    type: formatMetricName(metric),
    driver: driverName,
    vehicle: vehicleName,
    date,
    time,
    severity,
    evidence: hasEvidence,
    evidenceDetails: evidence || detectionEvent || imageUrl || deviceId || eventId
      ? {
          eventId: detection?.event_id || eventId || "Unavailable",
          timestamp,
          deviceId: evidence?.device_id || detectionEvent?.device_id || deviceId || null,
          imageUrl: imageUrl || detectionEvent?.screenshot_url || null,
          triggeredMetrics: [metric],
          driverState: detection?.driver_state || raw.driver_state || null,
        }
      : undefined,
    icon_color: iconMap.color,
    icon_bg: iconMap.bg,
  }));
}

export const alertsApi = {
  list: async () => {
    try {
      const client = requireSupabase();
      const { data: vehicles, error: vehicleError } = await client
        .from("vehicle")
        .select("vehicle_id, plate_number, driver_id, secondary_driver_id")
        .order("created_at", { ascending: false });
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
      const { data: alerts, error: alertError } = await client
        .from("detection_data")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (alertError) throw alertError;
      
      return (alerts ?? []).flatMap((row) => {
        const raw = row as RecentAlertRow;
        const vehicleInfo = raw.vehicle_id === null || raw.vehicle_id === undefined ? undefined : vehicleMap.get(raw.vehicle_id);
        const driverName = firstString(raw, ["driver", "driver_name"]) || vehicleInfo?.driver || "Unknown Driver";
        const vehicleName = firstString(raw, ["vehicle", "vehicle_name", "plate_number"]) || vehicleInfo?.vehicle || "Unknown Vehicle";
        return mapRawAlertToDbAlerts(
          raw,
          driverName,
          vehicleName
        );
      });
    } catch (error) {
      console.error("Error fetching alerts from schema2:", error);
      return [];
    }
  },
  
  create: async (a: Omit<DbAlert, "id" | "created_at">) => {
    const client = requireSupabase();
    const { data: alert, error: alertError } = await client
      .from("detection_data")
      .insert({
        alert_level: a.severity === "High" ? "ALERT" : a.severity === "Moderate" ? "WARNING" : "normal",
        triggered_metrics: [a.type],
      })
      .select("*")
      .single();
    
    if (alertError) throw alertError;
    
    const raw = alert as RawAlert;
    return mapRawAlertToDbAlerts(raw, a.driver, a.vehicle)[0];
  },
  
  remove: async (id: number) => {
    const client = requireSupabase();
    const { error } = await client
      .from("detection_data")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },
};

// ---------- Detection Metrics ----------
export type DbMetric = {
  timestamp: string;
  perclos: number | null;
  blink_rate: number | null;
  yawn: number | null;
  head_pose: number | null;
  eyes_status?: string | null;
  yawn_status?: string | null;
  head_pose_status?: string | null;
  posture_status?: string | null;
};

function extractStatusMetric(rawValue: string | null): number | null {
  if (!rawValue) return null;
  const match = rawValue.match(/-?\d*\.?\d+(?:\.\d+)?/);
  if (!match) return null;
  const numericValue = Number(match[0]);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export const metricsApi = {
  list: async () => {
    const client = requireSupabase();
    const { data, error } = await client
      .from("detection_data")
      .select("created_at, reported_at, eyes_status, yawn_status, head_pose_status, posture_status, alert_level")
      .order("reported_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      timestamp: row.reported_at ?? row.created_at,
      perclos: extractStatusMetric(row.eyes_status),
      blink_rate: null,
      yawn: extractStatusMetric(row.yawn_status),
      body_posture: extractStatusMetric(row.posture_status),
      head_pose: extractStatusMetric(row.head_pose_status),
      eyes_status: row.eyes_status ?? null,
      yawn_status: row.yawn_status ?? null,
      head_pose_status: row.head_pose_status ?? null,
      posture_status: row.posture_status ?? null,
    })) as DbMetric[];
  },
};

// ---------- System Logs ----------
export type DbLog = {
  id: number;
  date: string;
  time: string;
  level: "INFO" | "ERROR";
  ref: string;
  action: string;
  actor: string;
};

type RawSystemLog = {
  systemlog_id: number;
  message: string;
  log_type: string;
  timestamp: string;
  device_id: string | null;
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
  device_id: string | null;
};

function determineLogLevel(logType: string): "INFO" | "ERROR" {
  const type = (logType || "").toLowerCase();
  if (type.includes("error") || type.includes("failed")) return "ERROR";
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
  return {
    id: raw.log_id,
    date: timestamp.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
    time: timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
    level: "INFO",
    ref: raw.alert_id ? `ALERT_${raw.alert_id}` : "BEHAVIOR_EVENT",
    action: raw.message || "Driver behavior event",
    actor: raw.device_id || "Device",
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
      
      const { data: behaviorLogs, error: behaviorError } = await client
        .from("behavior_log")
        .select("log_id, message, timestamp, date, alert_id, device_id")
        .order("timestamp", { ascending: false });
      if (behaviorError) throw behaviorError;

      const combined = [...(sysLogs ?? []).map(mapSystemLogToDbLog), ...(behaviorLogs ?? []).map(mapBehaviorLogToDbLog)].sort((a, b) => {
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
