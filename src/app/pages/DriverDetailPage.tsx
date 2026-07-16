import { ArrowLeft, Wind, EyeOff, Navigation, User, Activity, Zap } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from "recharts";

const driverData: Record<string, {
  alerts: { icon: typeof Wind; iconColor: string; iconBg: string; type: string; date: string; time: string; severity: string }[];
  blink: { time: string; rate: number }[];
  perclos: { time: string; value: number }[];
  ear: { time: string; value: number }[];
  mar: { time: string; value: number }[];
  headPose: { axis: string; value: number }[];
  posture: { metric: string; score: number }[];
}> = {
  "drv-001": {
    alerts: [
      { icon: Wind,       iconColor: "#EF4444", iconBg: "#FEE2E2", type: "Drowsiness",  date: "07/15/2026", time: "14:32", severity: "High"     },
      { icon: Wind,       iconColor: "#F59E0B", iconBg: "#FEF3C7", type: "Yawning",      date: "07/14/2026", time: "13:55", severity: "Moderate" },
    ],
    blink:   [{ time: "08:00", rate: 17 },{ time: "09:00", rate: 14 },{ time: "10:00", rate: 10 },{ time: "11:00", rate: 8  },{ time: "12:00", rate: 13 },{ time: "13:00", rate: 7  }],
    perclos: [{ time: "08:00", value: 3  },{ time: "09:00", value: 5  },{ time: "10:00", value: 9  },{ time: "11:00", value: 16 },{ time: "12:00", value: 8  },{ time: "13:00", value: 20 }],
    ear:     [{ time: "08:00", value: 0.31 },{ time: "09:00", value: 0.28 },{ time: "10:00", value: 0.22 },{ time: "11:00", value: 0.16 },{ time: "12:00", value: 0.25 },{ time: "13:00", value: 0.13 }],
    mar:     [{ time: "08:00", value: 0.2 },{ time: "09:00", value: 0.4 },{ time: "10:00", value: 0.7 },{ time: "11:00", value: 1.0 },{ time: "12:00", value: 0.5 },{ time: "13:00", value: 1.2 }],
    headPose:[{ axis: "Pitch", value: 14 },{ axis: "Yaw", value: 10 },{ axis: "Roll", value: 6 }],
    posture: [{ metric: "Back", score: 72 },{ metric: "Neck", score: 60 },{ metric: "Shoulders", score: 78 },{ metric: "Arms", score: 85 },{ metric: "Lean", score: 55 }],
  },
  "drv-002": {
    alerts: [
      { icon: Wind,       iconColor: "#F59E0B", iconBg: "#FEF3C7", type: "Lane Drift",   date: "07/15/2026", time: "11:18", severity: "Moderate" },
      { icon: Wind,       iconColor: "#10B981", iconBg: "#ECFDF5", type: "Lane Drift",   date: "07/13/2026", time: "15:10", severity: "Low"      },
    ],
    blink:   [{ time: "08:00", rate: 20 },{ time: "09:00", rate: 18 },{ time: "10:00", rate: 15 },{ time: "11:00", rate: 13 },{ time: "12:00", rate: 17 },{ time: "13:00", rate: 12 }],
    perclos: [{ time: "08:00", value: 2  },{ time: "09:00", value: 3  },{ time: "10:00", value: 6  },{ time: "11:00", value: 9  },{ time: "12:00", value: 5  },{ time: "13:00", value: 12 }],
    ear:     [{ time: "08:00", value: 0.35 },{ time: "09:00", value: 0.33 },{ time: "10:00", value: 0.28 },{ time: "11:00", value: 0.24 },{ time: "12:00", value: 0.30 },{ time: "13:00", value: 0.20 }],
    mar:     [{ time: "08:00", value: 0.1 },{ time: "09:00", value: 0.2 },{ time: "10:00", value: 0.4 },{ time: "11:00", value: 0.6 },{ time: "12:00", value: 0.3 },{ time: "13:00", value: 0.5 }],
    headPose:[{ axis: "Pitch", value: 6 },{ axis: "Yaw", value: 4 },{ axis: "Roll", value: 3 }],
    posture: [{ metric: "Back", score: 90 },{ metric: "Neck", score: 88 },{ metric: "Shoulders", score: 92 },{ metric: "Arms", score: 95 },{ metric: "Lean", score: 85 }],
  },
  "drv-003": {
    alerts: [
      { icon: Zap,        iconColor: "#1D6AE5", iconBg: "#DBEAFE", type: "Distraction",  date: "07/15/2026", time: "09:45", severity: "Low"      },
      { icon: User,       iconColor: "#F59E0B", iconBg: "#FEF3C7", type: "Hard Braking", date: "07/13/2026", time: "10:33", severity: "Moderate" },
    ],
    blink:   [{ time: "08:00", rate: 15 },{ time: "09:00", rate: 13 },{ time: "10:00", rate: 12 },{ time: "11:00", rate: 10 },{ time: "12:00", rate: 14 },{ time: "13:00", rate: 11 }],
    perclos: [{ time: "08:00", value: 4  },{ time: "09:00", value: 6  },{ time: "10:00", value: 8  },{ time: "11:00", value: 11 },{ time: "12:00", value: 7  },{ time: "13:00", value: 14 }],
    ear:     [{ time: "08:00", value: 0.30 },{ time: "09:00", value: 0.27 },{ time: "10:00", value: 0.24 },{ time: "11:00", value: 0.19 },{ time: "12:00", value: 0.26 },{ time: "13:00", value: 0.17 }],
    mar:     [{ time: "08:00", value: 0.2 },{ time: "09:00", value: 0.3 },{ time: "10:00", value: 0.6 },{ time: "11:00", value: 0.8 },{ time: "12:00", value: 0.4 },{ time: "13:00", value: 0.9 }],
    headPose:[{ axis: "Pitch", value: 10 },{ axis: "Yaw", value: 8 },{ axis: "Roll", value: 5 }],
    posture: [{ metric: "Back", score: 80 },{ metric: "Neck", score: 72 },{ metric: "Shoulders", score: 84 },{ metric: "Arms", score: 90 },{ metric: "Lean", score: 65 }],
  },
  "drv-004": {
    alerts: [
      { icon: Navigation, iconColor: "#EF4444", iconBg: "#FEE2E2", type: "Speeding",     date: "07/14/2026", time: "16:22", severity: "High"     },
      { icon: Wind,       iconColor: "#EF4444", iconBg: "#FEE2E2", type: "Drowsiness",  date: "07/10/2026", time: "17:42", severity: "High"     },
    ],
    blink:   [{ time: "08:00", rate: 18 },{ time: "09:00", rate: 16 },{ time: "10:00", rate: 14 },{ time: "11:00", rate: 12 },{ time: "12:00", rate: 15 },{ time: "13:00", rate: 13 }],
    perclos: [{ time: "08:00", value: 2  },{ time: "09:00", value: 4  },{ time: "10:00", value: 5  },{ time: "11:00", value: 8  },{ time: "12:00", value: 6  },{ time: "13:00", value: 9  }],
    ear:     [{ time: "08:00", value: 0.33 },{ time: "09:00", value: 0.31 },{ time: "10:00", value: 0.26 },{ time: "11:00", value: 0.22 },{ time: "12:00", value: 0.28 },{ time: "13:00", value: 0.19 }],
    mar:     [{ time: "08:00", value: 0.15 },{ time: "09:00", value: 0.25 },{ time: "10:00", value: 0.35 },{ time: "11:00", value: 0.5 },{ time: "12:00", value: 0.3 },{ time: "13:00", value: 0.7 }],
    headPose:[{ axis: "Pitch", value: 8 },{ axis: "Yaw", value: 6 },{ axis: "Roll", value: 4 }],
    posture: [{ metric: "Back", score: 88 },{ metric: "Neck", score: 85 },{ metric: "Shoulders", score: 90 },{ metric: "Arms", score: 92 },{ metric: "Lean", score: 82 }],
  },
};

const defaultData = {
  alerts: [],
  blink:   [{ time: "08:00", rate: 15 },{ time: "09:00", rate: 13 },{ time: "10:00", rate: 12 },{ time: "11:00", rate: 10 },{ time: "12:00", rate: 14 },{ time: "13:00", rate: 11 }],
  perclos: [{ time: "08:00", value: 4  },{ time: "09:00", value: 6  },{ time: "10:00", value: 8  },{ time: "11:00", value: 11 },{ time: "12:00", value: 7  },{ time: "13:00", value: 14 }],
  ear:     [{ time: "08:00", value: 0.30 },{ time: "09:00", value: 0.27 },{ time: "10:00", value: 0.24 },{ time: "11:00", value: 0.19 },{ time: "12:00", value: 0.26 },{ time: "13:00", value: 0.17 }],
  mar:     [{ time: "08:00", value: 0.2 },{ time: "09:00", value: 0.3 },{ time: "10:00", value: 0.6 },{ time: "11:00", value: 0.8 },{ time: "12:00", value: 0.4 },{ time: "13:00", value: 0.9 }],
  headPose:[{ axis: "Pitch", value: 10 },{ axis: "Yaw", value: 8 },{ axis: "Roll", value: 5 }],
  posture: [{ metric: "Back", score: 80 },{ metric: "Neck", score: 72 },{ metric: "Shoulders", score: 84 },{ metric: "Arms", score: 90 },{ metric: "Lean", score: 65 }],
};

type PeriodKey = "Today" | "This Week" | "This Month";

type PeriodSummary = {
  avgBlink: number;
  avgPerclos: number;
  avgEAR: number;
  avgMAR: number;
  totalAlerts: number;
  safetyTrend: "up" | "down" | "stable";
};

// Per-period summaries derived from time-stamped data
const periodSummaries: Record<string, Record<PeriodKey, PeriodSummary>> = {
  "drv-001": {
    "Today":      { avgBlink: 11, avgPerclos: 10.2, avgEAR: 0.23, avgMAR: 0.67, totalAlerts: 1,  safetyTrend: "down"   },
    "This Week":  { avgBlink: 13, avgPerclos: 8.4,  avgEAR: 0.26, avgMAR: 0.52, totalAlerts: 2,  safetyTrend: "down"   },
    "This Month": { avgBlink: 15, avgPerclos: 6.1,  avgEAR: 0.28, avgMAR: 0.38, totalAlerts: 2,  safetyTrend: "stable" },
  },
  "drv-002": {
    "Today":      { avgBlink: 16, avgPerclos: 6.2,  avgEAR: 0.28, avgMAR: 0.35, totalAlerts: 1,  safetyTrend: "stable" },
    "This Week":  { avgBlink: 17, avgPerclos: 5.0,  avgEAR: 0.30, avgMAR: 0.28, totalAlerts: 2,  safetyTrend: "up"     },
    "This Month": { avgBlink: 18, avgPerclos: 4.2,  avgEAR: 0.32, avgMAR: 0.22, totalAlerts: 2,  safetyTrend: "up"     },
  },
  "drv-003": {
    "Today":      { avgBlink: 14, avgPerclos: 7.5,  avgEAR: 0.26, avgMAR: 0.45, totalAlerts: 1,  safetyTrend: "stable" },
    "This Week":  { avgBlink: 15, avgPerclos: 6.8,  avgEAR: 0.27, avgMAR: 0.40, totalAlerts: 2,  safetyTrend: "down"   },
    "This Month": { avgBlink: 16, avgPerclos: 5.5,  avgEAR: 0.29, avgMAR: 0.32, totalAlerts: 2,  safetyTrend: "stable" },
  },
  "drv-004": {
    "Today":      { avgBlink: 15, avgPerclos: 5.8,  avgEAR: 0.27, avgMAR: 0.32, totalAlerts: 0,  safetyTrend: "stable" },
    "This Week":  { avgBlink: 16, avgPerclos: 5.0,  avgEAR: 0.29, avgMAR: 0.28, totalAlerts: 2,  safetyTrend: "up"     },
    "This Month": { avgBlink: 17, avgPerclos: 4.2,  avgEAR: 0.30, avgMAR: 0.25, totalAlerts: 2,  safetyTrend: "up"     },
  },
};

const defaultPeriodSummaries: Record<PeriodKey, PeriodSummary> = {
  "Today":      { avgBlink: 12, avgPerclos: 9.0,  avgEAR: 0.24, avgMAR: 0.55, totalAlerts: 2,  safetyTrend: "stable" },
  "This Week":  { avgBlink: 14, avgPerclos: 7.5,  avgEAR: 0.26, avgMAR: 0.45, totalAlerts: 5,  safetyTrend: "stable" },
  "This Month": { avgBlink: 15, avgPerclos: 6.0,  avgEAR: 0.28, avgMAR: 0.35, totalAlerts: 10, safetyTrend: "up"     },
};

const sevMap: Record<string, { bg: string; color: string }> = {
  High:     { bg: "#FEF2F2", color: "#EF4444" },
  Moderate: { bg: "#FFF7ED", color: "#F59E0B" },
  Low:      { bg: "#ECFDF5", color: "#10B981" },
};

interface Props { driverId: string; onBack: () => void; }

export function DriverDetailPage({ driverId, onBack }: Props) {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const { drivers } = useApp();
  const [period, setPeriod] = useState<PeriodKey>("Today");
  const emp = drivers.find((e) => e.id === driverId);
  const data = driverData[driverId] ?? defaultData;

  const bg = dark ? "#111827" : "#F4F5F7";
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";
  const gridColor = dark ? "#374151" : "#F3F4F6";
  const tooltipStyle = { fontSize: 13, borderRadius: 8, border: `1px solid ${borderColor}`, background: cardBg, color: textMain };

  if (!emp) return null;

  const fullName = `${emp.firstName} ${emp.lastName}`;
  const scoreColor = emp.safetyScore >= 85 ? "#10B981" : emp.safetyScore >= 70 ? "#F59E0B" : "#EF4444";

  const summaries = periodSummaries[driverId] ?? defaultPeriodSummaries;
  const summary = summaries[period];

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
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 8, fontSize: 14, color: textSub, cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: shadow }}>
          <ArrowLeft size={14} /> Back
        </button>
      </PageHeader>

      {/* Profile card */}
      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, padding: "18px 22px", marginBottom: 16, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1D6AE5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 19, fontWeight: 700, flexShrink: 0 }}>
          {(emp.firstName[0] ?? "") + (emp.lastName[0] ?? "")}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: textMain }}>{fullName}</div>
          <div style={{ fontSize: 14, color: textSub, marginTop: 3 }}>{emp.id} · {emp.vehicle} · {emp.contact}</div>
        </div>
      </div>

      {/* Metrics receipt card */}
      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, marginBottom: 20, overflow: "hidden" }}>
        {/* Period selector */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: `1px solid ${borderColor}` }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: textMain }}>Metrics Summary</span>
          <div style={{ display: "flex", gap: 4 }}>
            {(["Today", "This Week", "This Month"] as PeriodKey[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${period === p ? "#1D6AE5" : (dark ? "#374151" : "#E5E7EB")}`, background: period === p ? "#1D6AE5" : "transparent", color: period === p ? "#fff" : textSub, fontSize: 12, fontWeight: period === p ? 600 : 400, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Receipt body */}
        <div style={{ padding: "16px 18px" }}>
          {/* Dashed header */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, paddingBottom: 12, borderBottom: `2px dashed ${dark ? "#374151" : "#E5E7EB"}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: textMain }}>{fullName}</div>
              <div style={{ fontSize: 12, color: textSub, marginTop: 1 }}>{emp.id} · {period}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: textSub }}>Period</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{period === "Today" ? "Last 6h" : period === "This Week" ? "7 days" : "30 days"}</div>
            </div>
          </div>

          {/* Metric rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                label: "Avg Blink Rate",
                value: `${summary.avgBlink} bpm`,
                note: "Normal: 15–20",
                status: summary.avgBlink < 12 ? "danger" : summary.avgBlink < 15 ? "warn" : "ok",
              },
              {
                label: "Avg PERCLOS",
                value: `${summary.avgPerclos}%`,
                note: "Threshold: 10%",
                status: summary.avgPerclos > 12 ? "danger" : summary.avgPerclos > 8 ? "warn" : "ok",
              },
              {
                label: "Avg EAR",
                value: summary.avgEAR.toFixed(2),
                note: "Alert below: 0.20",
                status: summary.avgEAR < 0.20 ? "danger" : summary.avgEAR < 0.24 ? "warn" : "ok",
              },
              {
                label: "Avg MAR",
                value: summary.avgMAR.toFixed(2),
                note: "Alert above: 0.70",
                status: summary.avgMAR > 0.70 ? "danger" : summary.avgMAR > 0.55 ? "warn" : "ok",
              },
              {
                label: "Total Alerts",
                value: String(summary.totalAlerts),
                note: period,
                status: summary.totalAlerts > 5 ? "danger" : summary.totalAlerts > 2 ? "warn" : "ok",
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

          {/* Dashed footer — Safety Score */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `2px dashed ${dark ? "#374151" : "#E5E7EB"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: textSub }}>Safety Score</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: scoreColor, display: "inline-block" }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor, fontFamily: "monospace" }}>{emp.safetyScore}</span>
              <span style={{ fontSize: 13, color: scoreColor, fontWeight: 600 }}>
                {emp.safetyScore >= 85 ? "Excellent" : emp.safetyScore >= 70 ? "Fair" : "At Risk"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        {/* Blink Rate */}
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

        {/* PERCLOS */}
        <Card title="Eye Closure — PERCLOS" subtitle="% time eyes closed — threshold: 10%">
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

        {/* EAR */}
        <Card title="Micro Sleep — EAR" subtitle="Eye Aspect Ratio — alert below 0.2">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.ear}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 0.4]} tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" name="EAR" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* MAR */}
        <Card title="Yawn Detection — MAR" subtitle="Mouth Aspect Ratio — alert above 0.7">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.mar}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 1.5]} tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" name="MAR" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Head Pose */}
        <Card title="Head Pose" subtitle="Pitch, Yaw, Roll deviation (degrees)">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data.headPose}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="axis" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="Degrees" fill="#1D6AE5" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Body Posture */}
        <Card title="Body Posture" subtitle="Postural scoring by body zone">
          <ResponsiveContainer width="100%" height={150}>
            <RadarChart data={data.posture} cx="50%" cy="50%" outerRadius={55}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: textSub }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar name="Score" dataKey="score" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Alerts history */}
        <Card title="Alert History" subtitle="All recorded events for this driver" span={isMobile ? undefined : "1 / -1"}>
          {data.alerts.length === 0 ? (
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
                {data.alerts.map((a, i) => {
                  const Icon = a.icon;
                  const sev = sevMap[a.severity];
                  return (
                    <tr key={i} style={{ borderBottom: i < data.alerts.length - 1 ? `1px solid ${borderColor}` : "none" }}>
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
