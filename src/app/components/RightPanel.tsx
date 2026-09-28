import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { alertsApi, DbAlert } from "../../api/viratrak";
import {
  buildBehaviorSummary,
  buildRightPanelTrend,
  Period,
} from "../utils/analytics";

const trendOptions: Period[] = [
  "Today",
  "Last 7 Days",
  "Last 30 Days",
  "Last Year",
];

export function RightPanel() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const [trendRange, setTrendRange] = useState<Period>("Last 7 Days");
  const [showTrendPicker, setShowTrendPicker] = useState(false);
  const trendRef = useRef<HTMLDivElement>(null);
  const [alerts, setAlerts] = useState<DbAlert[]>([]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (trendRef.current && !trendRef.current.contains(e.target as Node))
        setShowTrendPicker(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    alertsApi.list().then(setAlerts).catch(console.error);
  }, []);

  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#6B7280" : "#9CA3AF";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const shadow = dark
    ? "0 1px 4px rgba(0,0,0,0.3)"
    : "0 1px 4px rgba(0,0,0,0.07)";
  const gridColor = dark ? "#374151" : "#F3F4F6";
  const hoverBg = dark ? "#374151" : "#F9FAFB";
  const tooltipStyle = {
    fontSize: 13,
    borderRadius: 8,
    border: `1px solid ${borderColor}`,
    background: cardBg,
    color: textMain,
  };
  const donutData = useMemo(
    () =>
      buildBehaviorSummary(alerts).map((item) => ({
        name: item.name,
        value: item.value,
        color: item.color,
      })),
    [alerts],
  );
  const totalEvents = donutData.reduce((sum, item) => sum + item.value, 0);
  const trendData = useMemo(
    () => buildRightPanelTrend(alerts, trendRange),
    [alerts, trendRange],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        height: "100%",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Behavior Summary */}
      <div
        style={{
          background: cardBg,
          borderRadius: 12,
          boxShadow: shadow,
          overflow: "hidden",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: textMain }}>
            Behavior Summary (Today)
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "14px 16px 8px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "relative",
              width: isMobile ? 160 : 220,
              height: isMobile ? 160 : 220,
              margin: "0 auto",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 48 : 66}
                  outerRadius={isMobile ? 70 : 92}
                  dataKey="value"
                  strokeWidth={0}
                  paddingAngle={3}
                >
                  {donutData.map((entry, idx) => (
                    <Cell key={`donut-cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? 24 : 33,
                  fontWeight: 700,
                  color: textMain,
                  lineHeight: 1,
                }}
              >
                {totalEvents}
              </div>
              <div
                style={{
                  fontSize: isMobile ? 11 : 13,
                  color: textSub,
                  marginTop: 4,
                  lineHeight: 1.4,
                  textAlign: "center",
                }}
              >
                Total
                <br />
                Events
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "4px 20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {donutData.map((d) => (
            <div
              key={d.name}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: d.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, color: textMain, flex: 1 }}>
                {d.name}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: textMain }}>
                {d.value}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: textSub,
                  width: 32,
                  textAlign: "right",
                }}
              >
                {totalEvents > 0
                  ? `${Math.round((d.value / totalEvents) * 100)}%`
                  : "0%"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Trend — fills remaining height */}
      <div
        style={{
          background: cardBg,
          borderRadius: 12,
          boxShadow: shadow,
          overflow: "hidden",
          transition: "background 0.2s",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: `1px solid ${borderColor}`,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: textMain }}>
            Alerts Trend
          </span>

          <div style={{ position: "relative" }} ref={trendRef}>
            <div
              onClick={() => setShowTrendPicker((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: textSub,
                border: `1px solid ${borderColor}`,
                borderRadius: 6,
                padding: "4px 8px",
                cursor: "pointer",
                userSelect: "none",
                background: showTrendPicker
                  ? dark
                    ? "#374151"
                    : "#F3F4F6"
                  : "transparent",
                transition: "background 0.1s",
              }}
            >
              {trendRange}
              <ChevronDown
                size={11}
                color={textSub}
                style={{
                  transform: showTrendPicker
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </div>

            {showTrendPicker && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                  zIndex: 300,
                  minWidth: 150,
                }}
              >
                {trendOptions.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => {
                      setTrendRange(opt);
                      setShowTrendPicker(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 14px",
                      cursor: "pointer",
                      fontSize: 14,
                      color: trendRange === opt ? "#1D6AE5" : textMain,
                      fontWeight: trendRange === opt ? 600 : 400,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background =
                        hoverBg)
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background =
                        "transparent")
                    }
                  >
                    <span style={{ flex: 1 }}>{opt}</span>
                    {trendRange === opt && <Check size={13} color="#1D6AE5" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chart — responsive container */}
        <div
          style={{
            flex: 1,
            padding: "12px 8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
            width: "100%",
          }}
        >
          <ResponsiveContainer
            width="100%"
            height={isMobile ? 140 : 160}
            key={trendRange}
          >
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: isMobile ? 10 : 12, fill: textSub }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: isMobile ? 10 : 12, fill: textSub }}
                axisLine={false}
                tickLine={false}
                width={isMobile ? 24 : 28}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="alerts"
                stroke="#EF4444"
                strokeWidth={2.5}
                dot={{ fill: "#EF4444", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
