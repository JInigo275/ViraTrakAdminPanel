import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useTheme } from "../context/ThemeContext";

const donutData = [
  { name: "Yawning",     value: 31, color: "#EF4444" },
  { name: "Eyes Closed", value: 22, color: "#F59E0B" },
  { name: "Distraction", value: 19, color: "#EAB308" },
  { name: "Poor Posture",value: 16, color: "#10B981" },
  { name: "Head Pose",   value: 12, color: "#1D6AE5" },
];

const trendDataSets: Record<string, { date: string; alerts: number }[]> = {
  "Today": [
    { date: "08:00", alerts: 1 }, { date: "09:00", alerts: 3 }, { date: "10:00", alerts: 7 },
    { date: "11:00", alerts: 5 }, { date: "12:00", alerts: 2 }, { date: "13:00", alerts: 4 },
    { date: "14:00", alerts: 6 },
  ],
  "Last 7 Days": [
    { date: "14", alerts: 2 }, { date: "15", alerts: 5 }, { date: "16", alerts: 9 },
    { date: "17", alerts: 13 },{ date: "18", alerts: 16 },{ date: "19", alerts: 8 },
    { date: "20", alerts: 3 },
  ],
  "Last 30 Days": [
    { date: "W1", alerts: 18 }, { date: "W2", alerts: 24 }, { date: "W3", alerts: 14 }, { date: "W4", alerts: 32 },
  ],
  "Last Year": [
    { date: "Jan", alerts: 45 }, { date: "Feb", alerts: 38 }, { date: "Mar", alerts: 52 },
    { date: "Apr", alerts: 41 }, { date: "May", alerts: 60 }, { date: "Jun", alerts: 32 },
    { date: "Jul", alerts: 28 }, { date: "Aug", alerts: 35 }, { date: "Sep", alerts: 44 },
    { date: "Oct", alerts: 55 }, { date: "Nov", alerts: 48 }, { date: "Dec", alerts: 39 },
  ],
};

const trendOptions = ["Today", "Last 7 Days", "Last 30 Days", "Last Year"];

export function RightPanel() {
  const { dark } = useTheme();
  const [trendRange, setTrendRange] = useState("Last 7 Days");
  const [showTrendPicker, setShowTrendPicker] = useState(false);
  const trendRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (trendRef.current && !trendRef.current.contains(e.target as Node)) setShowTrendPicker(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const cardBg      = dark ? "#1F2937" : "#fff";
  const textMain    = dark ? "#F9FAFB" : "#111827";
  const textSub     = dark ? "#6B7280" : "#9CA3AF";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const shadow      = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";
  const gridColor   = dark ? "#374151" : "#F3F4F6";
  const hoverBg     = dark ? "#374151" : "#F9FAFB";
  const tooltipStyle = { fontSize: 12, borderRadius: 8, border: `1px solid ${borderColor}`, background: cardBg, color: textMain };
  const trendData   = trendDataSets[trendRange];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%", fontFamily: "Inter, sans-serif" }}>

      {/* Behavior Summary */}
      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, overflow: "hidden", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${borderColor}` }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: textMain }}>Behavior Summary (Today)</span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: "14px 16px 8px", position: "relative" }}>
          <div style={{ position: "relative", width: 220, height: 220 }}>
            <PieChart width={220} height={220}>
              <Pie data={donutData} cx={110} cy={110} innerRadius={66} outerRadius={92} dataKey="value" strokeWidth={0} paddingAngle={3}>
                {donutData.map((entry, idx) => <Cell key={`donut-cell-${idx}`} fill={entry.color} />)}
              </Pie>
            </PieChart>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: textMain, lineHeight: 1 }}>32</div>
              <div style={{ fontSize: 12, color: textSub, marginTop: 4, lineHeight: 1.4 }}>Total<br/>Events</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "4px 20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {donutData.map((d) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: d.color, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: textMain, flex: 1 }}>{d.name}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: textMain }}>{Math.round(32 * d.value / 100)}</span>
              <span style={{ fontSize: 11, color: textSub, width: 32, textAlign: "right" }}>{d.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Trend — fills remaining height */}
      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, overflow: "hidden", transition: "background 0.2s", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: textMain }}>Alerts Trend</span>

          <div style={{ position: "relative" }} ref={trendRef}>
            <div
              onClick={() => setShowTrendPicker((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: textSub, border: `1px solid ${borderColor}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", userSelect: "none", background: showTrendPicker ? (dark ? "#374151" : "#F3F4F6") : "transparent", transition: "background 0.1s" }}
            >
              {trendRange}
              <ChevronDown size={11} color={textSub} style={{ transform: showTrendPicker ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </div>

            {showTrendPicker && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.15)", overflow: "hidden", zIndex: 300, minWidth: 150 }}>
                {trendOptions.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => { setTrendRange(opt); setShowTrendPicker(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", cursor: "pointer", fontSize: 13, color: trendRange === opt ? "#1D6AE5" : textMain, fontWeight: trendRange === opt ? 600 : 400, transition: "background 0.1s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = hoverBg)}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                  >
                    <span style={{ flex: 1 }}>{opt}</span>
                    {trendRange === opt && <Check size={13} color="#1D6AE5" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chart — fixed dimensions to prevent recharts 0×0 duplicate-key bug */}
        <div style={{ flex: 1, padding: "12px 8px 12px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
          <LineChart width={290} height={160} data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: textSub }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: textSub }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="alerts" stroke="#EF4444" strokeWidth={2.5} dot={{ fill: "#EF4444", r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </div>
      </div>
    </div>
  );
}
