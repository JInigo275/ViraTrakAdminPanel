import { DbAlert } from "../../api/viratrak";

export type Period = "Today" | "Last 7 Days" | "Last 30 Days" | "Last Year";

type AlertSummaryItem = {
  name: string;
  value: number;
  color: string;
};

type TrendPoint = {
  date: string;
  alerts: number;
};

const EVENT_COLORS: Record<string, string> = {
  Yawning: "#EF4444",
  Yawn: "#EF4444",
  "Eyes Closed": "#F59E0B",
  Eyes: "#F59E0B",
  Posture: "#10B981",
  "Head Pose": "#8B5CF6",
  "Shoulder Elevation": "#10B981",
  "Body Posture": "#10B981",
};

const FALLBACK_EVENT_COLORS = [
  "#1D6AE5",
  "#06B6D4",
  "#F97316",
  "#EC4899",
  "#84CC16",
];

function parseAlertTimestamp(alert: DbAlert): Date | null {
  // Parse "MM/DD/YYYY" and "HH:MM" format
  const dateParts = alert.date.split("/").map(Number);
  const timeParts = alert.time.split(":").map(Number);

  if (dateParts.length !== 3 || timeParts.length < 2) return null;

  const [month, day, year] = dateParts;
  const [hours, minutes] = timeParts;

  if (
    isNaN(month) ||
    isNaN(day) ||
    isNaN(year) ||
    isNaN(hours) ||
    isNaN(minutes)
  ) {
    return null;
  }

  const timestamp = new Date(year, month - 1, day, hours, minutes, 0);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

function formatTrendLabel(timestamp: Date, period: Period) {
  if (period === "Today")
    return `${String(timestamp.getHours()).padStart(2, "0")}:00`;
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

function buildTrendData(alerts: DbAlert[], period: Period): TrendPoint[] {
  const map = buildTrendMap(alerts, period);
  return [...map.entries()]
    .map(([date, alertsCount]) => ({ date, alerts: alertsCount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildBehaviorSummary(alerts: DbAlert[]): AlertSummaryItem[] {
  const counts = new Map<string, number>();
  alerts.forEach((alert) =>
    counts.set(alert.type, (counts.get(alert.type) ?? 0) + 1),
  );
  return [...counts.entries()]
    .map(([name, value], index) => ({
      name,
      value,
      color:
        EVENT_COLORS[name] ??
        FALLBACK_EVENT_COLORS[index % FALLBACK_EVENT_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

export function buildRightPanelTrend(
  alerts: DbAlert[],
  period: Period,
): TrendPoint[] {
  return buildTrendData(alerts, period);
}
