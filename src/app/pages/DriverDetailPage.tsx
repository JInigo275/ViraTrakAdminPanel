import { ArrowLeft, Wind, Activity } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { LoadingState } from "../components/LoadingState";
import { useState, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { alertsApi, driverMetricsApi, DbAlert, DriverMetricReading } from "../../api/viratrak";
import { EvidencePreviewModal } from "../components/EvidencePreviewModal";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";



type DriverAlert = DbAlert & { icon: typeof Wind };

type DriverChartData = {
  alerts: DriverAlert[];
  perclos: { time: string; value: number }[];
  ear: { time: string; value: number }[];
  mar: { time: string; value: number }[];
  headPose: { axis: string; value: number }[];
  posture: { metric: string; score: number }[];
};

const emptyData: DriverChartData = {
  alerts: [],
  perclos: [],
  ear: [],
  mar: [],
  headPose: [],
  posture: [],
};

type PeriodKey = "Today" | "This Week" | "This Month" | "This Year";

const sevMap: Record<string, { bg: string; color: string }> = {
  High:     { bg: "#FEF2F2", color: "#EF4444" },
  Moderate: { bg: "#FFF7ED", color: "#F59E0B" },
  Low:      { bg: "#ECFDF5", color: "#10B981" },
};


// End of region comment









interface Props { driverId: string; onBack: () => void; }

function getMetricPeriodStart(period: PeriodKey, now = new Date()) {
  const start = new Date(now);
  if (period === "Today") {
    start.setTime(start.getTime() - 24 * 60 * 60 * 1000);
  } else if (period === "This Week") {
    start.setDate(start.getDate() - 7);
  } else if (period === "This Month") {
    start.setDate(start.getDate() - 30);
  } else {
    start.setDate(start.getDate() - 365);
  }
  return start.toISOString();
}

function formatChartLabel(timestamp: string, period: PeriodKey) {
  const date = new Date(timestamp);
  if (period === "Today") {
    return `${String(date.getHours()).padStart(2, "0")}:00`;
  }
  if (period === "This Week") {
    return date.toLocaleDateString([], { weekday: "long" });
  }
  if (period === "This Month") {
    return date.toLocaleDateString([], { month: "long", day: "numeric" });
  }
  return date.toLocaleDateString([], { month: "long" });
}

function getNiceAxisStep(span: number) {
  if (!Number.isFinite(span) || span <= 0) return 10;

  const roughStep = span / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;

  if (normalized <= 1) return 1 * magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function getNiceAxisDomain(values: number[]) {
  if (!values.length) return [0, 100] as [number, number];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const paddedMin = min - span * 0.15;
  const paddedMax = max + span * 0.15;
  const step = getNiceAxisStep(paddedMax - paddedMin);

  const domainMin = Math.floor(paddedMin / step) * step;
  const domainMax = Math.ceil(paddedMax / step) * step;

  return [domainMin, domainMax] as [number, number];
}

function getNiceAxisTicks(domain: [number, number]) {
  const [min, max] = domain;
  const step = getNiceAxisStep(max - min || 1);
  const ticks: number[] = [];

  for (let value = Math.ceil(min / step) * step; value <= max + step / 2; value += step) {
    ticks.push(Number(value.toFixed(2)));
  }

  return ticks;
}

function averageReadings(
  readings: DriverMetricReading[],
  period: PeriodKey,
  getValue: (reading: DriverMetricReading) => number | null,
) {
  const buckets = new Map<string, { total: number; count: number }>();
  readings.forEach((reading) => {
    const value = getValue(reading);
    if (value === null) return;
    const label = formatChartLabel(reading.timestamp, period);
    const bucket = buckets.get(label) ?? { total: 0, count: 0 };
    bucket.total += value;
    bucket.count += 1;
    buckets.set(label, bucket);
  });

  const entries = [...buckets.entries()].map(([label, bucket]) => ({
    label,
    value: Number((bucket.total / bucket.count).toFixed(2)),
  }));

  if (period === "Today") {
    return entries.sort((a, b) => {
      const [hoursA] = a.label.split(":").map(Number);
      const [hoursB] = b.label.split(":").map(Number);
      return hoursA - hoursB;
    });
  }

  return entries;
}



// ============================================================
// Page logic and UI
// ============================================================
// ============================================================
// Selected driver profile, alert history, and performance charts.
// ============================================================
export function DriverDetailPage({ driverId, onBack }: Props) {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const { drivers } = useApp();
  const [period, setPeriod] = useState<PeriodKey>("Today");
  const [liveAlerts, setLiveAlerts] = useState<DriverAlert[] | null>(null);
  const [liveData, setLiveData] = useState<typeof emptyData | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<DriverAlert | null>(null);
  const emp = drivers.find((e) => e.id === driverId);
  const data = liveData ?? emptyData;

  useEffect(() => {
    if (!emp) return;
    setLiveData(null);
    const periodEnd = new Date();
    Promise.all([alertsApi.list(), driverMetricsApi.list(driverId, getMetricPeriodStart(period), periodEnd.toISOString())])
      .then(([alerts, readings]) => {
        setLiveAlerts(alerts
          .filter((alert) => alert.driver === `${emp.firstName} ${emp.lastName}` || alert.vehicle === emp.vehicle)
          .map((alert) => ({
            ...alert,
            icon: Wind,
          })));
        setLiveData({
          alerts: [],
          perclos: averageReadings(readings, period, (reading) => reading.perclos).map(({ label, value }) => ({ time: label, value })),
          ear: [],
          mar: averageReadings(readings, period, (reading) => reading.yawn).map(({ label, value }) => ({ time: label, value })),
          headPose: averageReadings(readings, period, (reading) => reading.headPose).map(({ label, value }) => ({ axis: label, value })),
          posture: averageReadings(readings, period, (reading) => reading.bodyPosture).map(({ label, value }) => ({ metric: label, score: value })),
        });
      })
      .catch(() => { setLiveAlerts([]); setLiveData(emptyData); });
  }, [emp, period]);

  const bg = dark ? "#111827" : "#F4F5F7";
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";
  const gridColor = dark ? "#374151" : "#F3F4F6";
  const tooltipStyle = { fontSize: 13, borderRadius: 8, border: `1px solid ${borderColor}`, background: cardBg, color: textMain };

  if (!emp) return null;
  if (liveData === null) return <LoadingState label="Loading driver analytics..." />;

  const fullName = `${emp.firstName} ${emp.lastName}`;
  const alertHistory = liveAlerts ?? data.alerts;
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const summary = {
    avgPerclos: average(data.perclos.map((point) => point.value)),
  };
  const averageYawn = average(data.mar.map((point) => point.value));
  const averageBodyPosture = average(data.posture.map((point) => point.score));
  const averageHeadPose = average(data.headPose.map((point) => point.value));
  const postureValues = data.posture.map((point) => point.score);
  const postureDomain = getNiceAxisDomain(postureValues);
  const postureTicks = getNiceAxisTicks(postureDomain);
  const formatMetric = (value: number) => value.toFixed(2);

  function Card({ title, subtitle, children, span }: { title: string; subtitle?: string; children: React.ReactNode; span?: string }) {
    return (
      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, overflow: "hidden", gridColumn: span }}>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${borderColor}` }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: textMain }}>{title}</div>
          {subtitle && <div style={{ fontSize: 13, color: textSub, marginTop: 1 }}>{subtitle}</div>}
        </div>
        <div style={{ padding: "16px 18px" }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: dark ? "linear-gradient(180deg, #111827 0%, #0f172a 100%)" : "linear-gradient(180deg, #f8fafc 0%, #eef3f9 100%)", fontFamily: "Inter, sans-serif", transition: "background 0.2s" }}>
      <PageHeader icon={Activity} iconColor="#F59E0B" title="Driver Analytics" subtitle={`Fatigue and behavior metrics for ${fullName}`}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: dark ? "#374151" : "#F3F4F6", border: `1px solid ${dark ? "#4B5563" : "#D1D5DB"}`, borderRadius: 8, fontSize: 14, color: dark ? "#F3F4F6" : "#4B5563", cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: shadow }}>
          <ArrowLeft size={14} /> Back
        </button>
      </PageHeader>

      {selectedAlert && (
        <EvidencePreviewModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}



{/* ============================================================ */}
      {/* Profile card */}
      {/* ============================================================ */}
      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, padding: "18px 22px", marginBottom: 16, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1D6AE5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 19, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
          {emp.avatar ? <img src={emp.avatar} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (emp.firstName[0] ?? "") + (emp.lastName[0] ?? "")}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: textMain }}>{fullName}</div>
          <div style={{ fontSize: 14, color: textSub, marginTop: 3 }}>{emp.id} · {emp.vehicle} · {emp.contact}</div>
        </div>
      </div>



{/* ============================================================ */}
      {/* Metrics receipt card */}
      {/* ============================================================ */}
      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, marginBottom: 20, overflow: "hidden" }}>



{/* ============================================================ */}
        {/* Period selector */}
        {/* ============================================================ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: `1px solid ${borderColor}` }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#000000" }}>Metrics Summary</span>
          <div style={{ display: "flex", gap: 4 }}>
            {(["Today", "This Week", "This Month", "This Year"] as PeriodKey[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${period === p ? "#1D6AE5" : (dark ? "#374151" : "#E5E7EB")}`, background: period === p ? "#1D6AE5" : "transparent", color: "#000000", fontSize: 12, fontWeight: period === p ? 600 : 400, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                {p}
              </button>
            ))}
          </div>
        </div>



{/* ============================================================ */}
        {/* Receipt body */}
        {/* ============================================================ */}
        <div style={{ padding: "16px 18px" }}>



{/* ============================================================ */}
          {/* Dashed header */}
          {/* ============================================================ */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, paddingBottom: 12, borderBottom: `2px dashed ${dark ? "#374151" : "#E5E7EB"}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#000000" }}>{fullName}</div>
              <div style={{ fontSize: 12, color: "#000000", marginTop: 1 }}>{emp.id} · {period}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#000000" }}>Period</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#000000" }}>{period === "Today" ? "Last 24h" : period === "This Week" ? "7 days" : period === "This Month" ? "30 days" : "365 days"}</div>
            </div>
          </div>



{/* ============================================================ */}
          {/* Metric rows */}
          {/* ============================================================ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                label: "Avg Percentage of Eye Closure (PERCLOS)",
                value: `${formatMetric(summary.avgPerclos)}%`,
                note: "Threshold: 10%",
              },
              {
                label: "Avg Mouth Aspect Ratio (Yawn)",
                value: formatMetric(averageYawn),
                note: "Alert above: 0.70",
              },
              {
                label: "Avg Shoulder Elevation",
                value: formatMetric(averageBodyPosture),
                note: "Postural score out of 100",
              },
              {
                label: "Avg Ear Aspect Ratio (Head Pose)",
                value: `${formatMetric(averageHeadPose)}°`,
                note: "Average deviation",
              },
            ].map(({ label, value, note }, i, arr) => {
              const rowBg = dark ? "#374151" : "#F8F9FA";
              return (
                <div key={label} style={{ display: "flex", alignItems: "center", padding: "9px 12px", background: i % 2 === 0 ? rowBg : "transparent", borderRadius: 8, marginBottom: i < arr.length - 1 ? 4 : 0 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: "#000000", fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 12, color: "#000000", marginTop: 1 }}>{note}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#000000", fontFamily: "monospace" }}>{value}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>



        {/* PERCLOS */}
        {/* ============================================================ */}
        <Card title="Percentage of Eye Closure (PERCLOS)" subtitle="% time eyes closed — threshold: 10%">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.perclos}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 25]} tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "PERCLOS"]} />
              <Line type="monotone" dataKey="value" name="PERCLOS" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>



{/* ============================================================ */}
  {/* Yawn */}
        {/* ============================================================ */}
        <Card title="Mouth Aspect Ratio (Yawn)" subtitle="Mouth opening score — alert above 0.7">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.mar}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 1.5]} tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" name="Yawn" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>



{/* ============================================================ */}
  {/* Shoulder Elevation */}
        {/* ============================================================ */}
        <Card title="Shoulder Elevation" subtitle="Postural score by time">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.posture.map((point) => ({ time: point.metric, value: point.score }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis
                domain={postureDomain}
                ticks={postureTicks}
                tickFormatter={(value: number) => Number(value).toFixed(0)}
                tick={{ fontSize: 12, fill: textSub }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" name="Shoulder Elevation" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>



{/* ============================================================ */}
        {/* Head Pose */}
        {/* ============================================================ */}
        <Card title="Ear Aspect Ratio (Head Pose)" subtitle="Pitch, Yaw, Roll deviation (degrees)">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.headPose}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="axis" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" name="Head Pose" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>



{/* ============================================================ */}
        {/* Alerts history */}
        {/* ============================================================ */}
        <Card title="Alert History" subtitle="All recorded events for this driver" span={isMobile ? undefined : "1 / -1"}>
          {alertHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", fontSize: 14, color: textSub }}>No alerts recorded for this driver.</div>
          ) : (
            <div style={{ maxHeight: isMobile ? 280 : 360, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 280 : 380 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                  {["Event Type", "Date", "Time", "Severity"].map((h) => (
                    <th key={h} style={{ fontSize: 12, fontWeight: 600, color: textSub, textAlign: "left", padding: "8px 16px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alertHistory.map((a, i) => {
                  const Icon = a.icon;
                  const sev = sevMap[a.severity];
                  return (
                    <tr
                      key={i}
                      onClick={() => setSelectedAlert(a)}
                      onMouseEnter={(event) => { event.currentTarget.style.background = dark ? "#374151" : "#F9FAFB"; }}
                      onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; }}
                      style={{ borderBottom: i < alertHistory.length - 1 ? `1px solid ${borderColor}` : "none", cursor: "pointer", transition: "background 0.15s" }}
                    >
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: a.icon_bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon size={12} color={a.icon_color} />
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 500, color: textMain }}>{a.type}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 14, color: textSub }}>{a.date}</td>
                      <td style={{ padding: "10px 16px", fontSize: 14, color: textSub, fontFamily: "monospace" }}>{a.time}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: sev.bg, color: sev.color }}>{a.severity}</span>
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan={4} style={{ padding: "10px 18px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                      <span style={{ flex: 1, height: 1, background: dark ? "#374151" : "#E5E7EB" }} />
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: dark ? "#9CA3AF" : "#94A3B8", whiteSpace: "nowrap" }}>
                        End of table
                      </span>
                      <span style={{ flex: 1, height: 1, background: dark ? "#374151" : "#E5E7EB" }} />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// End of region comment
