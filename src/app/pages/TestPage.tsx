import { useEffect, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { PageHeader } from "../components/PageHeader";
import { FlaskConical, UserRound, CarFront, BellRing, ScrollText, DatabaseZap } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { supabase } from "../../api/supabaseClient";

type SubmitStatus = {
  kind: "idle" | "loading" | "success" | "error";
  message: string;
};

type DriverOption = {
  driver_id: number;
  first_name: string;
  last_name: string;
  license_number: string;
};

function buildUniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildUniqueEmail(value: string, suffix: string) {
  const trimmed = value.trim();
  if (!trimmed) return `test+${suffix}@viratrak.test`;
  if (!trimmed.includes("@")) return `${trimmed}+${suffix}@viratrak.test`;
  const [local, domain] = trimmed.split("@", 2);
  return `${local}+${suffix}@${domain}`;
}

function normalizeMetric(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function TestPage() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();

  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userStatus, setUserStatus] = useState<SubmitStatus>({ kind: "idle", message: "" });

  const [driverFirstName, setDriverFirstName] = useState("");
  const [driverLastName, setDriverLastName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [driverStatus, setDriverStatus] = useState<SubmitStatus>({ kind: "idle", message: "" });
  const [driverOptions, setDriverOptions] = useState<DriverOption[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");

  const [alertType, setAlertType] = useState("");
  const [alertLevel, setAlertLevel] = useState("");
  const [alertDuration, setAlertDuration] = useState("");
  const [driverState, setDriverState] = useState("");
  const [fatigueScore, setFatigueScore] = useState("");
  const [perclosMetric, setPerclosMetric] = useState("");
  const [blinkRateMetric, setBlinkRateMetric] = useState("");
  const [yawnMetric, setYawnMetric] = useState("");
  const [bodyPostureMetric, setBodyPostureMetric] = useState("");
  const [headPoseMetric, setHeadPoseMetric] = useState("");
  const [alertStatus, setAlertStatus] = useState<SubmitStatus>({ kind: "idle", message: "" });

  const [logMessage, setLogMessage] = useState("");
  const [logType, setLogType] = useState("");
  const [logStatus, setLogStatus] = useState<SubmitStatus>({ kind: "idle", message: "" });

  const bg = dark ? "#111827" : "#F4F5F7";
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const border = dark ? "#374151" : "#E5E7EB";

  const alertTypes = [
    "Yawning",
    "Eyes Closed",
    "Head Pose",
    "Body Posture",
    "Micro Sleep",
    "Blink Rate",
  ];

  function resetUserForm() {
    setUserFirstName("");
    setUserLastName("");
    setUserEmail("");
    setUserRole("");
  }

  function resetDriverForm() {
    setDriverFirstName("");
    setDriverLastName("");
    setLicenseNumber("");
    setContactInfo("");
    setPlateNumber("");
    setVehicleModel("");
  }

  function resetAlertForm() {
    setAlertType("");
    setAlertLevel("");
    setAlertDuration("");
    setDriverState("");
    setFatigueScore("");
    setPerclosMetric("");
    setBlinkRateMetric("");
    setYawnMetric("");
    setBodyPostureMetric("");
    setHeadPoseMetric("");
  }

  function resetLogForm() {
    setLogMessage("");
    setLogType("");
  }

  async function submitUserForm() {
    if (!supabase) {
      setUserStatus({ kind: "error", message: "Supabase is not configured." });
      return;
    }

    setUserStatus({ kind: "loading", message: "Creating user record..." });
    try {
      const uniqueSuffix = buildUniqueSuffix();
      const { error } = await supabase.from("users").insert({
        id: `test-user-${uniqueSuffix}`,
        first_name: userFirstName.trim(),
        last_name: userLastName.trim(),
        email: buildUniqueEmail(userEmail, uniqueSuffix),
        role: userRole,
        status: "Active",
        last_login: new Date().toISOString(),
        password: "test123",
        must_change_password: false,
      });
      if (error) throw error;
      setUserStatus({ kind: "success", message: "User inserted successfully." });
      resetUserForm();
    } catch (error: any) {
      setUserStatus({ kind: "error", message: error?.message || "User insert failed." });
    }
  }

  async function submitDriverForm() {
    if (!supabase) {
      setDriverStatus({ kind: "error", message: "Supabase is not configured." });
      return;
    }

    setDriverStatus({ kind: "loading", message: "Creating driver and vehicle record..." });
    try {
      const uniqueSuffix = buildUniqueSuffix();
      const safeLicenseNumber = licenseNumber.trim() ? `${licenseNumber.trim()}-${uniqueSuffix}` : `TEST-LICENSE-${uniqueSuffix}`;
      const safePlateNumber = plateNumber.trim() ? `${plateNumber.trim()}-${uniqueSuffix}` : `TEST-PLATE-${uniqueSuffix}`;
      const { data: driverData, error: driverError } = await supabase
        .from("driver")
        .insert({
          first_name: driverFirstName.trim() || "Test",
          last_name: driverLastName.trim() || "Driver",
          license_number: safeLicenseNumber,
          contact_info: contactInfo.trim() || "test@example.com",
        })
        .select("driver_id")
        .single();
      if (driverError) throw driverError;

      const driverId = driverData?.driver_id;
      if (!driverId) throw new Error("Driver insert did not return an id");

      const { error: vehicleError } = await supabase.from("vehicle").insert({
        plate_number: safePlateNumber,
        model: vehicleModel.trim(),
        driver_id: driverId,
      });
      if (vehicleError) throw vehicleError;

      setDriverStatus({ kind: "success", message: "Driver and vehicle inserted successfully." });
      resetDriverForm();
    } catch (error: any) {
      setDriverStatus({ kind: "error", message: error?.message || "Driver insert failed." });
    }
  }

  async function loadDriverOptions() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("driver")
      .select("driver_id, first_name, last_name, license_number")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load drivers for test page", error);
      return;
    }

    const nextDrivers = (data ?? []) as DriverOption[];
    setDriverOptions(nextDrivers);

    if (!selectedDriverId && nextDrivers.length > 0) {
      setSelectedDriverId(String(nextDrivers[0].driver_id));
    }
  }

  useEffect(() => {
    void loadDriverOptions();
  }, []);

  async function submitAlertForm() {
    if (!supabase) {
      setAlertStatus({ kind: "error", message: "Supabase is not configured." });
      return;
    }

    if (!selectedDriverId) {
      setAlertStatus({ kind: "error", message: "Please select a driver before creating the alert chain." });
      return;
    }

    setAlertStatus({ kind: "loading", message: "Creating alert chain..." });
    try {
      const driverId = Number(selectedDriverId);
      const { data: vehicleData, error: vehicleLookupError } = await supabase
        .from("vehicle")
        .select("vehicle_id")
        .eq("driver_id", driverId)
        .maybeSingle();

      if (vehicleLookupError) throw vehicleLookupError;

      let vehicleId = vehicleData?.vehicle_id;
      if (!vehicleId) {
        const uniqueSuffix = buildUniqueSuffix();
        const { data: newVehicle, error: vehicleCreateError } = await supabase
          .from("vehicle")
          .insert({
            plate_number: `TEST-PLATE-${uniqueSuffix}`,
            model: `${driverFirstName || "Test"} Vehicle`,
            driver_id: driverId,
          })
          .select("vehicle_id")
          .single();
        if (vehicleCreateError) throw vehicleCreateError;
        vehicleId = newVehicle?.vehicle_id;
      }

      if (!vehicleId) throw new Error("Vehicle lookup failed.");

      const { data: deviceData, error: deviceLookupError } = await supabase
        .from("device")
        .select("device_id")
        .eq("vehicle_id", vehicleId)
        .maybeSingle();

      if (deviceLookupError) throw deviceLookupError;

      let deviceId = deviceData?.device_id;
      if (!deviceId) {
        const { data: newDevice, error: deviceCreateError } = await supabase
          .from("device")
          .insert({
            status: "Online",
            video_feed: `rtsp://test/${driverId}`,
            vehicle_id: vehicleId,
          })
          .select("device_id")
          .single();
        if (deviceCreateError) throw deviceCreateError;
        deviceId = newDevice?.device_id;
      }

      if (!deviceId) throw new Error("Device lookup failed.");

      const { data: evidenceData, error: evidenceError } = await supabase
        .from("recorded_evidence")
        .insert({
          timestamp: new Date().toISOString(),
          device_id: deviceId,
        })
        .select("event_id")
        .single();
      if (evidenceError) throw evidenceError;

      const { data: detectionData, error: detectionError } = await supabase
        .from("detection")
        .insert({
          timestamp: new Date().toISOString(),
          perclos: normalizeMetric(perclosMetric),
          blink_rate: normalizeMetric(blinkRateMetric),
          yawn: normalizeMetric(yawnMetric),
          body_posture: normalizeMetric(bodyPostureMetric),
          head_pose: normalizeMetric(headPoseMetric),
          driver_state: driverState.trim() || "alert",
          fatigue_score: normalizeMetric(fatigueScore),
          event_id: evidenceData?.event_id,
        })
        .select("detection_id")
        .single();
      if (detectionError) throw detectionError;

      const { error: alertError } = await supabase.from("alert").insert({
        alert_type: alertType.trim(),
        alert_level: alertLevel,
        duration: alertDuration.trim(),
        detection_id: detectionData?.detection_id,
      });
      if (alertError) throw alertError;

      const { error: behaviorLogError } = await supabase.from("behavior_log").insert({
        message: `${alertType.trim()} alert created for ${driverOptions.find((driver) => String(driver.driver_id) === selectedDriverId)?.first_name || "selected driver"}`,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().slice(0, 10),
        device_id: deviceId,
        vehicle_id: vehicleId,
        detection_id: detectionData?.detection_id,
        event_id: evidenceData?.event_id,
      });
      if (behaviorLogError) throw behaviorLogError;

      setAlertStatus({ kind: "success", message: "Alert, detection, evidence, and driver-linked records inserted successfully." });
      resetAlertForm();
      await loadDriverOptions();
    } catch (error: any) {
      setAlertStatus({ kind: "error", message: error?.message || "Alert insert failed." });
    }
  }

  async function submitLogForm() {
    if (!supabase) {
      setLogStatus({ kind: "error", message: "Supabase is not configured." });
      return;
    }

    setLogStatus({ kind: "loading", message: "Creating system log..." });
    try {
      const { error } = await supabase.from("system_log").insert({
        message: logMessage.trim(),
        log_type: logType,
        timestamp: new Date().toISOString(),
      });
      if (error) throw error;
      setLogStatus({ kind: "success", message: "System log inserted successfully." });
      resetLogForm();
    } catch (error: any) {
      setLogStatus({ kind: "error", message: error?.message || "Log insert failed." });
    }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: bg, transition: "background 0.2s" }}>
      <PageHeader icon={FlaskConical} iconColor="#10B981" title="Test Page" subtitle="Use these forms to create sample data for each page area" />

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", marginTop: 16 }}>
        <FormCard icon={UserRound} title="Users Page" subtitle="Create a test account with a realistic name and email address" dark={dark} textMain={textMain} textSub={textSub} border={border} cardBg={cardBg}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>First name</div>
            <input value={userFirstName} onChange={(e) => setUserFirstName(e.target.value)} placeholder="e.g. Jane" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Last name</div>
            <input value={userLastName} onChange={(e) => setUserLastName(e.target.value)} placeholder="e.g. Smith" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Email address</div>
            <input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="e.g. jane.smith@example.com" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Role</div>
            <select value={userRole} onChange={(e) => setUserRole(e.target.value)} style={inputStyle}>
              <option value="">Select a role</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Administrator">Administrator</option>
              <option value="Owner">Owner</option>
            </select>
            <button onClick={submitUserForm} style={buttonStyle}>Submit to users</button>
            <StatusBox status={userStatus} />
          </div>
        </FormCard>

        <FormCard icon={CarFront} title="Drivers Page" subtitle="Add a driver profile and link a sample vehicle to it" dark={dark} textMain={textMain} textSub={textSub} border={border} cardBg={cardBg}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Driver first name</div>
            <input value={driverFirstName} onChange={(e) => setDriverFirstName(e.target.value)} placeholder="e.g. Michael" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Driver last name</div>
            <input value={driverLastName} onChange={(e) => setDriverLastName(e.target.value)} placeholder="e.g. Chen" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>License number</div>
            <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="e.g. DL-1001" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Contact info</div>
            <input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="e.g. +1-555-0101" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Plate number</div>
            <input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="e.g. ABC-1234" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Vehicle model</div>
            <input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="e.g. Freightliner Cascadia" style={inputStyle} />
            <button onClick={submitDriverForm} style={buttonStyle}>Submit to driver + vehicle</button>
            <StatusBox status={driverStatus} />
          </div>
        </FormCard>

        <FormCard icon={BellRing} title="Alerts / Analytics" subtitle="Create an alert chain that can be used by the analytics charts" dark={dark} textMain={textMain} textSub={textSub} border={border} cardBg={cardBg}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Driver</div>
            <select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} style={inputStyle}>
              <option value="">Select a driver</option>
              {driverOptions.map((driver) => (
                <option key={driver.driver_id} value={driver.driver_id}>
                  {driver.first_name} {driver.last_name} ({driver.license_number})
                </option>
              ))}
            </select>
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Alert type</div>
            <select value={alertType} onChange={(e) => setAlertType(e.target.value)} style={inputStyle}>
              <option value="">Select an alert type</option>
              {alertTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Alert severity</div>
            <select value={alertLevel} onChange={(e) => setAlertLevel(e.target.value)} style={inputStyle}>
              <option value="">Select severity</option>
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
              <option value="Low">Low</option>
            </select>
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Duration</div>
            <input value={alertDuration} onChange={(e) => setAlertDuration(e.target.value)} placeholder="e.g. 00:00:20" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Driver state</div>
            <input value={driverState} onChange={(e) => setDriverState(e.target.value)} placeholder="e.g. alert" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Fatigue score</div>
            <input value={fatigueScore} onChange={(e) => setFatigueScore(e.target.value)} placeholder="e.g. 82" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Perclos</div>
            <input value={perclosMetric} onChange={(e) => setPerclosMetric(e.target.value)} placeholder="e.g. 0.62" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Blink rate</div>
            <input value={blinkRateMetric} onChange={(e) => setBlinkRateMetric(e.target.value)} placeholder="e.g. 12.5" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Yawn score</div>
            <input value={yawnMetric} onChange={(e) => setYawnMetric(e.target.value)} placeholder="e.g. 0.82" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Body posture</div>
            <input value={bodyPostureMetric} onChange={(e) => setBodyPostureMetric(e.target.value)} placeholder="e.g. 0.33" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Head pose</div>
            <input value={headPoseMetric} onChange={(e) => setHeadPoseMetric(e.target.value)} placeholder="e.g. 0.18" style={inputStyle} />
            <button onClick={submitAlertForm} style={buttonStyle}>Submit to alert chain</button>
            <StatusBox status={alertStatus} />
          </div>
        </FormCard>

        <FormCard icon={ScrollText} title="System Logs" subtitle="Write a sample system event for the logs page" dark={dark} textMain={textMain} textSub={textSub} border={border} cardBg={cardBg}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Log message</div>
            <input value={logMessage} onChange={(e) => setLogMessage(e.target.value)} placeholder="e.g. Manual test event" style={inputStyle} />
            <div style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Log level</div>
            <select value={logType} onChange={(e) => setLogType(e.target.value)} style={inputStyle}>
              <option value="">Select level</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
            <button onClick={submitLogForm} style={buttonStyle}>Submit to system_log</button>
            <StatusBox status={logStatus} />
          </div>
        </FormCard>
      </div>

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, color: textSub, fontSize: 13 }}>
        <DatabaseZap size={16} color="#10B981" />
        <span>Each form writes to its matching table set used by the app pages.</span>
      </div>
    </div>
  );
}

function FormCard({ icon: Icon, title, subtitle, children, dark, textMain, textSub, border, cardBg }: { icon: ElementType; title: string; subtitle: string; children: ReactNode; dark: boolean; textMain: string; textSub: string; border: string; cardBg: string }) {
  return (
    <div style={{ background: cardBg, borderRadius: 16, padding: 20, border: `1px solid ${border}`, boxShadow: dark ? "0 1px 4px rgba(0,0,0,0.25)" : "0 1px 4px rgba(0,0,0,0.07)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "#EBF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color="#1D6AE5" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: textMain }}>{title}</div>
          <div style={{ fontSize: 13, color: textSub }}>{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function StatusBox({ status }: { status: SubmitStatus }) {
  if (!status.message) return null;
  const bg = status.kind === "success" ? "#ECFDF5" : status.kind === "error" ? "#FEF2F2" : "#EFF6FF";
  const color = status.kind === "success" ? "#065F46" : status.kind === "error" ? "#991B1B" : "#1D4ED8";
  return <div style={{ padding: 10, borderRadius: 10, background: bg, color, fontSize: 13 }}>{status.message}</div>;
}

const inputStyle: CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
};

const buttonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#10B981",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
