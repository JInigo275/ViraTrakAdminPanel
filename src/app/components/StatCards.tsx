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
  showGraph?: boolean;
  isCount?: boolean;
};

export type DashboardRange = "Today" | "This Week" | "This Month" | "This Year";

const metricDefinitions: MetricDefinition[] = [
  {
    title: "Eyes Status",
    color: "#F59E0B",
    unit: "%",
    getValue: (metric) =>
      metric.perclos ?? extractMetricValue(metric.eyes_status ?? null),
  },
  {
    title: "Yawn Status",
    color: "#EF4444",
    unit: "%",
    getValue: (metric) =>
      metric.yawn ?? extractMetricValue(metric.yawn_status ?? null),
  },
  {
    title: "Head Pose",
    color: "#8B5CF6",
    unit: "°",
    getValue: (metric) =>
      metric.head_pose ?? extractMetricValue(metric.head_pose_status ?? null),
  },
  {
    title: "Posture",
    color: "#10B981",
    unit: "°",
    getValue: (metric) =>
      metric.body_posture ?? extractMetricValue(metric.posture_status ?? null),
  },
];

function extractMetricValue(rawValue: string | null): number | null {
  if (!rawValue) return null;

  const trimmed = rawValue.replace(/\s+/g, " ").trim();
  const percentMatch = trimmed.match(/(-?\d*\.?\d+(?:\.\d+)?)\s*%/i);
  if (percentMatch) {
    const numericValue = Number(percentMatch[1]);
    return Number.isFinite(numericValue)
      ? Math.min(100, Math.max(0, numericValue))
      : null;
  }

  const angleMatch = trimmed.match(
    /(-?\d*\.?\d+(?:\.\d+)?)\s*(?:°|deg|degrees)/i,
  );
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
    .filter(
      (point): point is { value: number } =>
        point.value !== null && Number.isFinite(point.value),
    );
}

function matchesRange(timestamp: string, range: DashboardRange): boolean {
  const eventTime = new Date(timestamp);
  if (Number.isNaN(eventTime.getTime())) return true;

  const now = new Date();
  const start = new Date(now);

  if (range === "Today") {
    start.setHours(0, 0, 0, 0);
    return eventTime >= start && eventTime <= now;
  }

  if (range === "This Week") {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return eventTime >= start && eventTime <= now;
  }

  if (range === "This Month") {
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return eventTime >= start && eventTime <= now;
  }

  start.setFullYear(now.getFullYear(), 0, 1);
  start.setHours(0, 0, 0, 0);
  return eventTime >= start && eventTime <= now;
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
  const shadow = dark
    ? "0 1px 4px rgba(0,0,0,0.3)"
    : "0 1px 4px rgba(0,0,0,0.07)";
  const readingLabel = {
    Today: "Today's reading",
    "This Week": "This week's reading",
    "This Month": "This month's reading",
    "This Year": "This year's reading",
  }[range];

  useEffect(() => {
    metricsApi.list().then(setMetrics).catch(console.error);
  }, []);

  const filteredMetrics = useMemo(
    () => metrics.filter((metric) => matchesRange(metric.timestamp, range)),
    [metrics, range],
  );

  const unassignedDrivers = useMemo(
    () =>
      drivers.filter(
        (driver) =>
          !vehicles.some((vehicle) => vehicle.driverIds.includes(driver.id)),
      ).length,
    [drivers, vehicles],
  );

  const unassignedVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.driverIds.length === 0).length,
    [vehicles],
  );

  const cards = useMemo(
    () => [
      ...metricDefinitions.map((definition) => ({
        ...definition,
        series: buildMetricSeries(filteredMetrics, definition),
      })),
      {
        title: "Assigned Drivers",
        color: "#1D6AE5",
        unit: "",
        getValue: () =>
          drivers.filter((driver) =>
            vehicles.some((vehicle) => vehicle.driverIds.includes(driver.id)),
          ).length,
        series: [
          {
            value: drivers.filter((driver) =>
              vehicles.some((vehicle) => vehicle.driverIds.includes(driver.id)),
            ).length,
          },
        ],
        showGraph: false,
        isCount: true,
      },
      {
        title: "Unassigned Drivers",
        color: "#DC2626",
        unit: "",
        getValue: () => unassignedDrivers,
        series: [{ value: unassignedDrivers }],
        showGraph: false,
        isCount: true,
      },
      {
        title: "Assigned Vehicles",
        color: "#16A34A",
        unit: "",
        getValue: () =>
          vehicles.filter((vehicle) => vehicle.driverIds.length > 0).length,
        series: [
          {
            value: vehicles.filter((vehicle) => vehicle.driverIds.length > 0)
              .length,
          },
        ],
        showGraph: false,
        isCount: true,
      },
      {
        title: "Unassigned Vehicles",
        color: "#7C3AED",
        unit: "",
        getValue: () => unassignedVehicles,
        series: [{ value: unassignedVehicles }],
        showGraph: false,
        isCount: true,
      },
    ],
    [filteredMetrics, unassignedDrivers, unassignedVehicles, drivers, vehicles],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
          ? "repeat(2, minmax(0, 1fr))"
          : "repeat(4, minmax(0, 1fr))",
        gap: isMobile ? 8 : 12,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {cards.map((c) => {
        const averageValue =
          c.series.length > 0
            ? c.series.reduce((sum, point) => sum + point.value, 0) /
              c.series.length
            : null;
        const displayValue =
          averageValue === null
            ? "--"
            : c.isCount
              ? `${Math.round(averageValue)}`
              : `${averageValue.toFixed(2)}${c.unit}`;
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
            <div
              style={{
                fontSize: 12,
                color: textSub,
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              {c.title}
            </div>
            <div
              style={{
                fontSize: 25,
                fontWeight: 700,
                color: c.color,
                lineHeight: 1,
                ...(c.isCount
                  ? {
                      flex: 1,
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }
                  : {}),
              }}
            >
              {displayValue}
            </div>
            {!c.isCount && (
              <div style={{ fontSize: 12, color: textSub }}>{readingLabel}</div>
            )}
            {c.showGraph !== false && (
              <div style={{ width: "100%", height: 52 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={c.series.length ? c.series : [{ value: 0 }]}
                    margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                  >
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={c.color}
                      strokeWidth={2.2}
                      dot={false}
                      connectNulls
                    />
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
