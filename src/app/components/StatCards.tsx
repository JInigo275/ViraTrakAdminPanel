import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useTheme } from "../context/ThemeContext";
import { metricsApi, DbMetric } from "../../api/viratrak";

type MetricDefinition = {
  title: string;
  key: keyof Pick<DbMetric, "perclos" | "blink_rate" | "yawn" | "body_posture" | "head_pose">;
  color: string;
  unit: string;
};

const metricDefinitions: MetricDefinition[] = [
  { title: "PERCLOS", key: "perclos", color: "#F59E0B", unit: "%" },
  { title: "Blink Rate", key: "blink_rate", color: "#1D6AE5", unit: " bpm" },
  { title: "Yawn", key: "yawn", color: "#EF4444", unit: "" },
  { title: "Body Posture", key: "body_posture", color: "#10B981", unit: "" },
  { title: "Head Pose", key: "head_pose", color: "#8B5CF6", unit: "°" },
];

function buildMetricSeries(metrics: DbMetric[], definition: MetricDefinition) {
  return metrics
    .slice()
    .reverse()
    .map((metric) => ({ value: metric[definition.key] }))
    .filter((point): point is { value: number } => point.value !== null && Number.isFinite(point.value));
}

export function StatCards() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const [metrics, setMetrics] = useState<DbMetric[]>([]);
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";

  useEffect(() => {
    metricsApi.list().then(setMetrics).catch(console.error);
  }, []);

  const cards = useMemo(() => metricDefinitions.map((definition) => ({
    ...definition,
    series: buildMetricSeries(metrics, definition),
  })), [metrics]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: isMobile ? 10 : 14, fontFamily: "Inter, sans-serif" }}>
      {cards.map((c) => {
        const latestValue = c.series.length > 0 ? c.series[c.series.length - 1].value : null;
        return (
          <div
            key={c.title}
            style={{
              background: cardBg,
              borderRadius: 12,
              padding: isMobile ? "12px 14px" : "16px 18px",
              boxShadow: shadow,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              transition: "background 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, color: dark ? "#9CA3AF" : "#6B7280", marginBottom: 5, fontWeight: 700, letterSpacing: "0.02em" }}>{c.title}</div>
                <div style={{ fontSize: isMobile ? 25 : 29, fontWeight: 800, color: textMain, lineHeight: 1 }}>{latestValue === null ? "--" : `${latestValue}${c.unit}`}</div>
              </div>
                <div style={{ fontSize: 12, color: dark ? "#9CA3AF" : "#6B7280", whiteSpace: "nowrap" }}>{c.series.length} readings</div>
            </div>
            <div style={{ width: "100%", height: 72 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={c.series.length ? c.series : [{ value: 0 }]} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
                  <Line type="monotone" dataKey="value" stroke={c.color} strokeWidth={2.5} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
