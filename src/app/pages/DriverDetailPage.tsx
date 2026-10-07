import { ArrowLeft, Wind, Activity } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { LoadingState } from "../components/LoadingState";
import { useState, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { alertsApi, driverMetricsApi } from "../../api/viratrak";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";



type DriverAlert = { icon: typeof Wind; iconColor: string; iconBg: string; type: string; date: string; time: string; severity: string };

type DriverChartData = {
  alerts: DriverAlert[];
  perclos: { time: string; value: number | null }[];
  ear: { time: string; value: number | null }[];
  mar: { time: string; value: number | null }[];
  headPose: { axis: string; value: number | null }[];
  posture: { metric: string; score: number | null }[];
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
    start.setHours(0, 0, 0, 0);
  } else if (period === "This Week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
  } else if (period === "This Month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }
  return start.toISOString();
}

function getMetricBucketLabels(period: PeriodKey, now = new Date()) {
  if (period === "Today") return Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
  if (period === "This Week") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (period === "This Month") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, day) => String(day + 1));
  }
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
}

function getMetricBucketIndex(timestamp: Date, period: PeriodKey) {
  if (period === "Today") return timestamp.getHours();
  if (period === "This Week") return (timestamp.getDay() + 6) % 7;
  if (period === "This Month") return timestamp.getDate() - 1;
  return timestamp.getMonth();
}

function buildMetricSeries(
  readings: { timestamp: string; value: number | null }[],
  period: PeriodKey,
  labels: string[],
  periodStart: Date,
  periodEnd: Date,
) {
  const buckets = labels.map(() => ({ total: 0, count: 0 }));
  readings.forEach((reading) => {
    if (reading.value === null) return;
    const timestamp = new Date(reading.timestamp);
    if (Number.isNaN(timestamp.getTime()) || timestamp < periodStart || timestamp > periodEnd) return;
    const bucket = buckets[getMetricBucketIndex(timestamp, period)];
    if (!bucket) return;
    bucket.total += reading.value;
    bucket.count += 1;
  });
  return buckets.map((bucket, index) => ({
    label: labels[index],
    value: bucket.count > 0 ? Number((bucket.total / bucket.count).toFixed(2)) : null,
  }));
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
  const emp = drivers.find((e) => e.id === driverId);
  const data = liveData ?? emptyData;

  useEffect(() => {
    if (!emp) return;
    setLiveData(null);
    const periodEnd = new Date();
    const periodStart = new Date(getMetricPeriodStart(period, periodEnd));
    const bucketLabels = getMetricBucketLabels(period, periodEnd);
    Promise.all([alertsApi.list(), driverMetricsApi.list(driverId, periodStart.toISOString(), periodEnd.toISOString())])
      .then(([alerts, readings]) => {
        const metricSeries = (selector: (reading: (typeof readings)[number]) => number | null) =>
          buildMetricSeries(readings.map((reading) => ({ timestamp: reading.timestamp, value: selector(reading) })), period, bucketLabels, periodStart, periodEnd);
        setLiveAlerts(alerts
          .filter((alert) => alert.driver === `${emp.firstName} ${emp.lastName}` || alert.vehicle === emp.vehicle)
          .map((alert) => ({
            icon: Wind,
            iconColor: alert.icon_color,
            iconBg: alert.icon_bg,
            type: alert.type,
            date: alert.date,
            time: alert.time,
            severity: alert.severity,
          })));
        setLiveData({
          alerts: [],
          perclos: metricSeries((reading) => reading.perclos).map((point) => ({ time: point.label, value: point.value })),
          ear: [],
          mar: metricSeries((reading) => reading.yawn).map((point) => ({ time: point.label, value: point.value })),
          headPose: metricSeries((reading) => reading.headPose).map((point) => ({ axis: point.label, value: point.value })),
          posture: metricSeries((reading) => reading.bodyPosture).map((point) => ({ metric: point.label, score: point.value })),
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
  const getAlertSortValue = (alert: { date: string; time: string }) => {
    const timestamp = new Date(`${alert.date} ${alert.time}`).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  };
  const alertHistory = [...(liveAlerts ?? data.alerts)].sort((a, b) => getAlertSortValue(b) - getAlertSortValue(a));
  const average = (values: (number | null)[]) => {
    const availableValues = values.filter((value): value is number => value !== null);
    return availableValues.length ? availableValues.reduce((sum, value) => sum + value, 0) / availableValues.length : 0;
  };
  const summary = {
    avgPerclos: average(data.perclos.map((point) => point.value)),
  };
  const averageYawn = average(data.mar.map((point) => point.value));
  const averageBodyPosture = average(data.posture.map((point) => point.score));
  const averageHeadPose = average(data.headPose.map((point) => point.value));
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
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: bg, fontFamily: "Inter, sans-serif", transition: "background 0.2s" }}>
      <PageHeader icon={Activity} iconColor="#F59E0B" title="Driver Analytics" subtitle={`Fatigue and behavior metrics for ${fullName}`}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: dark ? "#374151" : "#F3F4F6", border: `1px solid ${dark ? "#4B5563" : "#D1D5DB"}`, borderRadius: 8, fontSize: 14, color: dark ? "#F3F4F6" : "#4B5563", cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: shadow }}>
          <ArrowLeft size={14} /> Back
        </button>
      </PageHeader>



{/* ============================================================ */}
      {/* Profile card */}
      {/* ============================================================ */}
      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, padding: "18px 22px", marginBottom: 16, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: emp.avatar ? "transparent" : "#1D6AE5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 19, fontWeight: 700, flexShrink: 0, overflow: "hidden", border: emp.avatar ? "1px solid rgba(29,106,229,0.15)" : "none" }}>
          {emp.avatar ? <img src={emp.avatar} alt={`${fullName}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <>{(emp.firstName[0] ?? "") + (emp.lastName[0] ?? "")}</>}
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
          <span style={{ fontSize: 15, fontWeight: 600, color: textMain }}>Metrics Summary</span>
          <div style={{ display: "flex", gap: 4 }}>
            {(["Today", "This Week", "This Month", "This Year"] as PeriodKey[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${period === p ? "#1D6AE5" : (dark ? "#374151" : "#E5E7EB")}`, background: period === p ? "#1D6AE5" : "transparent", color: period === p ? "#fff" : textSub, fontSize: 12, fontWeight: period === p ? 600 : 400, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s", whiteSpace: "nowrap" }}>
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
              <div style={{ fontSize: 14, fontWeight: 700, color: textMain }}>{fullName}</div>
              <div style={{ fontSize: 12, color: textSub, marginTop: 1 }}>{emp.id} · {period}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: textSub }}>Period</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{period === "Today" ? "Last 24h" : period === "This Week" ? "7 days" : period === "This Month" ? "30 days" : "365 days"}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
                { label: "Avg Percentage of Eye Closure (PERCLOS)", value: `${formatMetric(summary.avgPerclos)}%`, note: "Alert above: 60% closed" },
                { label: "Avg Yawn", value: formatMetric(averageYawn), note: "Alert above: 60% open" },
                { label: "Avg Shoulder Elevation", value: formatMetric(averageBodyPosture), note: "Alert below: 167° or above: 192° tilted" },
                { label: "Avg Head Pose", value: `${formatMetric(averageHeadPose)}°`, note: "Alert above: 70% tilted" },
            ].map(({ label, value, note }, i, arr) => {
              const rowBg = dark ? "#374151" : "#F8F9FA";
              return (
                <div key={label} style={{ display: "flex", alignItems: "center", padding: "9px 12px", background: i % 2 === 0 ? rowBg : "transparent", borderRadius: 8, marginBottom: i < arr.length - 1 ? 4 : 0 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: textMain, fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 12, color: textSub, marginTop: 1 }}>{note}</div>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>{value}</span>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>



        {/* PERCLOS */}
        {/* ============================================================ */}
        <Card title="Percentage of Eye Closure (PERCLOS)" subtitle="% time eyes closed — alert above 60%">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.perclos}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 25]} tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}%`, "PERCLOS"]} />
              <Line type="monotone" dataKey="value" name="PERCLOS" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>



{/* ============================================================ */}
  {/* Yawn */}
        {/* ============================================================ */}
        <Card title="Yawn" subtitle="Mouth opening score — alert above 60% open">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.mar}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 1.5]} tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toFixed(2), "Yawn"]} />
              <Line type="monotone" dataKey="value" name="Yawn" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>



{/* ============================================================ */}
  {/* Shoulder Elevation */}
        {/* ============================================================ */}
        <Card title="Shoulder Elevation" subtitle="Postural score by time — alert below 167° or above 192°">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.posture.map((point) => ({ time: point.metric, value: point.score }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toFixed(2), "Shoulder Elevation"]} />
              <Line type="monotone" dataKey="value" name="Shoulder Elevation" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>



{/* ============================================================ */}
        {/* Head Pose */}
        {/* ============================================================ */}
        <Card title="Head Pose" subtitle="Pitch, Yaw, Roll deviation (degrees) — alert above 70% tilted">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.headPose}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="axis" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}°`, "Head Pose"]} />
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
            <div style={{ height: 320, overflowX: "auto", overflowY: "auto", overscrollBehavior: "contain" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 280 : 380 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                  {["Event Type", "Date", "Time", "Severity"].map((h) => (
                    <th key={h} style={{ position: "sticky", top: 0, zIndex: 1, background: cardBg, fontSize: 12, fontWeight: 600, color: textSub, textAlign: "left", padding: "8px 16px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alertHistory.map((a, i) => {
                  const Icon = a.icon;
                  const sev = sevMap[a.severity];
                  return (
                    <tr key={i} style={{ borderBottom: i < alertHistory.length - 1 ? `1px solid ${borderColor}` : "none" }}>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: a.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon size={12} color={a.iconColor} />
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
