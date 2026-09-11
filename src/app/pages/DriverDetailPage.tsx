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
  BarChart, Bar,
} from "recharts";



// ============================================================
// Driver data
// ============================================================
// ============================================================
// Replace this dataset or connect it to the driver detail API here.
// ============================================================
type DriverAlert = { icon: typeof Wind; iconColor: string; iconBg: string; type: string; date: string; time: string; severity: string };

type DriverChartData = {
  alerts: DriverAlert[];
  blink: { time: string; rate: number }[];
  perclos: { time: string; value: number }[];
  ear: { time: string; value: number }[];
  mar: { time: string; value: number }[];
  headPose: { axis: string; value: number }[];
  posture: { metric: string; score: number }[];
};

const emptyData: DriverChartData = {
  alerts: [],
  blink: [],
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
    Promise.all([alertsApi.list(), driverMetricsApi.list(driverId, getMetricPeriodStart(period), periodEnd.toISOString())])
      .then(([alerts, readings]) => {
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
          blink: readings.filter((reading) => reading.blinkRate !== null).map((reading) => ({ time: new Date(reading.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), rate: reading.blinkRate ?? 0 })),
          perclos: readings.filter((reading) => reading.perclos !== null).map((reading) => ({ time: new Date(reading.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), value: reading.perclos ?? 0 })),
          ear: [],
          mar: readings.filter((reading) => reading.yawn !== null).map((reading) => ({ time: new Date(reading.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), value: reading.yawn ?? 0 })),
          headPose: readings.filter((reading) => reading.headPose !== null).map((reading) => ({ axis: new Date(reading.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), value: reading.headPose ?? 0 })),
          posture: readings.filter((reading) => reading.bodyPosture !== null).map((reading) => ({ metric: new Date(reading.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), score: reading.bodyPosture ?? 0 })),
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
    avgBlink: average(data.blink.map((point) => point.rate)),
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
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1D6AE5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 19, fontWeight: 700, flexShrink: 0 }}>
          {(emp.firstName[0] ?? "") + (emp.lastName[0] ?? "")}
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



{/* ============================================================ */}
          {/* Metric rows */}
          {/* ============================================================ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                label: "Avg Blink Rate",
                value: `${Math.round(summary.avgBlink)} bpm`,
                note: "Normal: 15–20",
                status: summary.avgBlink < 12 ? "danger" : summary.avgBlink < 15 ? "warn" : "ok",
              },
              {
                label: "Avg Percentage of Eye Closure (PERCLOS)",
                value: `${formatMetric(summary.avgPerclos)}%`,
                note: "Threshold: 10%",
                status: summary.avgPerclos > 12 ? "danger" : summary.avgPerclos > 8 ? "warn" : "ok",
              },
              {
                label: "Avg Yawn",
                value: formatMetric(averageYawn),
                note: "Alert above: 0.70",
                status: averageYawn > 0.70 ? "danger" : averageYawn > 0.55 ? "warn" : "ok",
              },
              {
                label: "Avg Shoulder Elevation",
                value: formatMetric(averageBodyPosture),
                note: "Postural score out of 100",
                status: averageBodyPosture < 60 ? "danger" : averageBodyPosture < 75 ? "warn" : "ok",
              },
              {
                label: "Avg Head Pose",
                value: `${formatMetric(averageHeadPose)}°`,
                note: "Average deviation",
                status: averageHeadPose > 15 ? "danger" : averageHeadPose > 8 ? "warn" : "ok",
              },
            ].map(({ label, value, note, status }, i, arr) => {
              const color = status === "danger" ? "#EF4444" : status === "warn" ? "#F59E0B" : "#10B981";
              const rowBg = dark ? "#374151" : "#F8F9FA";
              return (
                <div key={label} style={{ display: "flex", alignItems: "center", padding: "9px 12px", background: i % 2 === 0 ? rowBg : "transparent", borderRadius: 8, marginBottom: i < arr.length - 1 ? 4 : 0 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: textMain, fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 12, color: textSub, marginTop: 1 }}>{note}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color, fontFamily: "monospace" }}>{value}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>



{/* ============================================================ */}
        {/* Blink Rate */}
        {/* ============================================================ */}
        <Card title="Blink Rate" subtitle="Blinks/min — normal: 15–20 bpm">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.blink}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 25]} tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="rate" name="Blink Rate" stroke="#1D6AE5" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>



{/* ============================================================ */}
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
        <Card title="Yawn" subtitle="Mouth opening score — alert above 0.7">
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
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" name="Shoulder Elevation" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>



{/* ============================================================ */}
        {/* Head Pose */}
        {/* ============================================================ */}
        <Card title="Head Pose" subtitle="Pitch, Yaw, Roll deviation (degrees)">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data.headPose}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="axis" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="Head Pose" fill="#8B5CF6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>



{/* ============================================================ */}
        {/* Alerts history */}
        {/* ============================================================ */}
        <Card title="Alert History" subtitle="All recorded events for this driver" span={isMobile ? undefined : "1 / -1"}>
          {alertHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", fontSize: 14, color: textSub }}>No alerts recorded for this driver.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
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
