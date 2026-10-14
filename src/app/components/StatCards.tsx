import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useTheme } from "../context/ThemeContext";
import { metricsApi, DbMetric } from "../../api/viratrak";
import { useApp } from "../context/AppContext";

type MetricDefinition = {
  title: string;
  color: string;
  unit: string;
  getValue: (metric: DbMetric) => number | null;
  showChart?: boolean;
};

export type DashboardRange = "Today" | "This Week" | "This Month" | "This Year";

const metricDefinitions: MetricDefinition[] = [
  { title: "Eyes Status", color: "#F59E0B", unit: "%", getValue: (metric) => metric.perclos ?? extractMetricValue(metric.eyes_status ?? null) },
  { title: "Yawn Status", color: "#EF4444", unit: "%", getValue: (metric) => metric.yawn ?? extractMetricValue(metric.yawn_status ?? null) },
  { title: "Head Pose", color: "#8B5CF6", unit: "°", getValue: (metric) => metric.head_pose ?? extractMetricValue(metric.head_pose_status ?? null) },
  { title: "Posture", color: "#10B981", unit: "°", getValue: (metric) => metric.body_posture ?? extractMetricValue(metric.posture_status ?? null) },
];

function extractMetricValue(rawValue: string | null): number | null {
  if (!rawValue) return null;

  const trimmed = rawValue.replace(/\s+/g, " ").trim();
  const percentMatch = trimmed.match(/(-?\d*\.?\d+(?:\.\d+)?)\s*%/i);
  if (percentMatch) {
    const numericValue = Number(percentMatch[1]);
    return Number.isFinite(numericValue) ? Math.min(100, Math.max(0, numericValue)) : null;
  }

  const angleMatch = trimmed.match(/(-?\d*\.?\d+(?:\.\d+)?)\s*(?:°|deg|degrees)/i);
  if (angleMatch) {
    const numericValue = Number(angleMatch[1]);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  const fallback = trimmed.match(/-?\d*\.?\d+(?:\.\d+)?/);
  if (!fallback) return null;

  const numericValue = Number(fallback[0]);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function buildMetricSeries(metrics: DbMetric[], definition: MetricDefinition) {
  return metrics
    .slice()
    .reverse()
    .map((metric) => ({ value: definition.getValue(metric) }))
    .filter((point): point is { value: number } => point.value !== null && Number.isFinite(point.value));
}

function matchesRange(timestamp: string, range: DashboardRange): boolean {
  const eventTime = new Date(timestamp);
  if (Number.isNaN(eventTime.getTime())) return false;

  const now = new Date();
  if (eventTime > now) return false;
  const start = new Date(now);

  if (range === "Today") {
    start.setHours(0, 0, 0, 0);
  } else if (range === "This Week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
  } else if (range === "This Month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  return eventTime >= start;
}

interface StatCardsProps {
  range: DashboardRange;
}

export function StatCards({ range }: StatCardsProps) {
  const { dark } = useTheme();
  const { drivers, vehicles } = useApp();
  const isMobile = useIsMobile();
  const [metrics, setMetrics] = useState<DbMetric[]>([]);
  const cardBg = dark ? "#1F2937" : "#fff";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";

  useEffect(() => {
    metricsApi.list().then(setMetrics).catch(console.error);
  }, []);

  const filteredMetrics = useMemo(
    () => metrics.filter((metric) => matchesRange(metric.timestamp, range)),
    [metrics, range],
  );

  const cards = useMemo(() => [...metricDefinitions.map((definition) => ({
    ...definition,
    series: buildMetricSeries(filteredMetrics, definition),
  })), {
    title: "Active Drivers",
    color: "#1D6AE5",
    unit: "",
    showChart: false,
    getValue: () => drivers.length,
    series: [{ value: drivers.length }],
  }, {
    title: "Vehicles",
    color: "#6B7280",
    unit: "",
    showChart: false,
    getValue: () => vehicles.length,
    series: [{ value: vehicles.length }],
  }], [filteredMetrics, drivers.length, vehicles.length]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: isMobile ? 8 : 12, fontFamily: "Inter, sans-serif" }}>
      {cards.map((c) => {
        const latestValue = c.series.length > 0 ? c.series[c.series.length - 1].value : null;
        const displayValue = latestValue === null ? "--" : `${latestValue}${c.unit}`;
        return (
          <div
            key={c.title}
            style={{
              background: cardBg,
              borderRadius: 12,
              boxShadow: shadow,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 12, color: textSub, fontWeight: 600, letterSpacing: "0.02em" }}>{c.title}</div>
            <div style={{ fontSize: 25, fontWeight: 700, color: c.color, lineHeight: 1 }}>{displayValue}</div>
            <div style={{ fontSize: 12, color: textSub }}>Latest reading</div>
            {c.showChart !== false && (
              <div style={{ width: "100%", height: 52 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={c.series.length ? c.series : [{ value: 0 }]} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <Line type="monotone" dataKey="value" stroke={c.color} strokeWidth={2.2} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
