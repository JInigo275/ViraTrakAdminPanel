import { DbAlert } from "../../api/viratrak";

export type Period = "Today" | "Last 7 Days" | "Last 30 Days" | "Last Year";

export type AlertSummaryItem = {
  name: string;
  value: number;
  color: string;
};

export type TrendPoint = {
  date: string;
  alerts: number;
};

export type DashboardStatCard = {
  title: string;
  value: string;
  label: string;
  labelColor: string;
  iconBg: string;
  iconColor: string;
  spark: { v: number }[];
  sparkColor: string;
};

const EVENT_COLORS: Record<string, string> = {
  Yawning: "#EF4444",
  Yawn: "#EF4444",
  "Eyes Closed": "#F59E0B",
  "Eyes": "#F59E0B",
  Posture: "#10B981",
  "Head Pose": "#8B5CF6",
  "Shoulder Elevation": "#10B981",
  "Body Posture": "#10B981",
};

const FALLBACK_EVENT_COLORS = ["#1D6AE5", "#06B6D4", "#F97316", "#EC4899", "#84CC16"];

const severityWeight: Record<DbAlert["severity"], number> = {
  High: 3,
  Moderate: 2,
  Low: 1,
};

function parseAlertTimestamp(alert: DbAlert): Date | null {
  // Parse "MM/DD/YYYY" and "HH:MM" format
  const dateParts = alert.date.split('/').map(Number);
  const timeParts = alert.time.split(':').map(Number);
  
  if (dateParts.length !== 3 || timeParts.length < 2) return null;
  
  const [month, day, year] = dateParts;
  const [hours, minutes] = timeParts;
  
  if (isNaN(month) || isNaN(day) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
    return null;
  }
  
  const timestamp = new Date(year, month - 1, day, hours, minutes, 0);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

function getPeriodStart(period: Period, now = new Date()) {
  const start = new Date(now);
  if (period === "Today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "Last 7 Days") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "Last 30 Days") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  start.setFullYear(start.getFullYear() - 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getPeriodAlerts(alerts: DbAlert[], period: Period, now = new Date()) {
  return alerts.filter((alert) => {
    const timestamp = parseAlertTimestamp(alert);
    return Boolean(timestamp && timestamp >= getPeriodStart(period, now));
  });
}

function formatTrendLabel(timestamp: Date, period: Period) {
  if (period === "Today") return `${String(timestamp.getHours()).padStart(2, "0")}:00`;
  if (period === "Last 7 Days") {
    return timestamp.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (period === "Last 30 Days") {
    return `W${Math.floor((timestamp.getDate() - 1) / 7) + 1}`;
  }
  return timestamp.toLocaleDateString("en-US", { month: "short" });
}

function buildTrendMap(alerts: DbAlert[], period: Period) {
  const map = new Map<string, number>();
  alerts.forEach((alert) => {
    const timestamp = parseAlertTimestamp(alert);
    if (!timestamp) return;
    const label = formatTrendLabel(timestamp, period);
    map.set(label, (map.get(label) ?? 0) + 1);
  });
  return map;
}

export function buildTrendData(alerts: DbAlert[], period: Period): TrendPoint[] {
  const map = buildTrendMap(alerts, period);
  return [...map.entries()]
    .map(([date, alertsCount]) => ({ date, alerts: alertsCount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildBehaviorSummary(alerts: DbAlert[]): AlertSummaryItem[] {
  const counts = new Map<string, number>();
  alerts.forEach((alert) => counts.set(alert.type, (counts.get(alert.type) ?? 0) + 1));
  return [...counts.entries()]
    .map(([name, value], index) => ({ name, value, color: EVENT_COLORS[name] ?? FALLBACK_EVENT_COLORS[index % FALLBACK_EVENT_COLORS.length] }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

export function buildDashboardCards(alerts: DbAlert[], driverCount: number): DashboardStatCard[] {
  const high = alerts.filter((alert) => alert.severity === "High").length;
  const safe = alerts.filter((alert) => alert.severity === "Low").length;
  const sparkSource = [0, 1, 2, 3, 4, 5, 6].map((index) => alerts.slice(Math.max(0, alerts.length - (7 - index))).length);
  const total = alerts.length;

  return [
    {
      title: "Total Drivers",
      value: String(driverCount),
      label: `${driverCount} tracked`,
      labelColor: "#1D6AE5",
      iconBg: "#EBF2FF",
      iconColor: "#1D6AE5",
      spark: sparkSource.map((v) => ({ v })),
      sparkColor: "#1D6AE5",
    },
    {
      title: "Safe Drives",
      value: String(safe),
      label: `${total > 0 ? Math.round((safe / total) * 100) : 0}% low severity`,
      labelColor: "#10B981",
      iconBg: "#ECFDF5",
      iconColor: "#10B981",
      spark: sparkSource.map((v) => ({ v: Math.max(0, v - high) })),
      sparkColor: "#10B981",
    },
    {
      title: "Alerts Today",
      value: String(total),
      label: "Derived from current alerts",
      labelColor: "#F59E0B",
      iconBg: "#FFF7ED",
      iconColor: "#F59E0B",
      spark: sparkSource.map((v) => ({ v })),
      sparkColor: "#F59E0B",
    },
    {
      title: "Events Recorded",
      value: String(total),
      label: `${high} high severity`,
      labelColor: "#6B7280",
      iconBg: "#FEF2F2",
      iconColor: "#EF4444",
      spark: sparkSource.map((v) => ({ v: v + high })),
      sparkColor: "#EF4444",
    },
  ];
}

export function buildRightPanelTrend(alerts: DbAlert[], period: Period): TrendPoint[] {
  return buildTrendData(alerts, period);
}
