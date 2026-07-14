import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useIsMobile";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

const fleetBlinkTrend = [
  { day: "Mon", avg: 14 }, { day: "Tue", avg: 11 }, { day: "Wed", avg: 16 },
  { day: "Thu", avg: 9  }, { day: "Fri", avg: 12 }, { day: "Sat", avg: 17 },
  { day: "Sun", avg: 13 },
];

const fleetPerclosTrend = [
  { day: "Mon", avg: 6  }, { day: "Tue", avg: 11 }, { day: "Wed", avg: 8  },
  { day: "Thu", avg: 15 }, { day: "Fri", avg: 13 }, { day: "Sat", avg: 5  },
  { day: "Sun", avg: 9  },
];

const driverComparison = [
  { driver: "J. Dela Cruz", blink: 72, perclos: 78, ear: 68, mar: 65, headPose: 80, posture: 72 },
  { driver: "M. Santos",    blink: 88, perclos: 92, ear: 85, mar: 90, headPose: 87, posture: 91 },
  { driver: "P. Reyes",     blink: 65, perclos: 70, ear: 72, mar: 68, headPose: 60, posture: 75 },
  { driver: "L. Fernandez", blink: 94, perclos: 95, ear: 92, mar: 91, headPose: 96, posture: 93 },
  { driver: "R. Garcia",    blink: 85, perclos: 88, ear: 83, mar: 86, headPose: 90, posture: 88 },
  { driver: "C. Santos",    blink: 60, perclos: 65, ear: 62, mar: 58, headPose: 70, posture: 64 },
];

const eventSummary = [
  { event: "Yawning",      count: 14, color: "#EF4444" },
  { event: "Eyes Closed",  count: 9,  color: "#F59E0B" },
  { event: "Micro Sleep",  count: 5,  color: "#8B5CF6" },
  { event: "Head Pose",    count: 11, color: "#1D6AE5" },
  { event: "Body Posture", count: 7,  color: "#10B981" },
  { event: "Blink Rate",   count: 6,  color: "#EAB308" },
];

const totalEvents = eventSummary.reduce((s, e) => s + e.count, 0);

const recentEvents = [
  { event: "Yawning",       driver: "Juan Dela Cruz",  time: "10:23:14 AM", severity: "High"     },
  { event: "Eyes Closed",   driver: "Mark Santos",     time: "10:18:07 AM", severity: "High"     },
  { event: "Head Pose",     driver: "Pedro Reyes",     time: "10:12:45 AM", severity: "Moderate" },
  { event: "Body Posture",  driver: "Luis Fernandez",  time: "09:58:33 AM", severity: "Moderate" },
  { event: "Micro Sleep",   driver: "Ramon Garcia",    time: "09:45:21 AM", severity: "Low"      },
  { event: "Blink Rate",    driver: "Carlos Santos",   time: "09:30:10 AM", severity: "High"     },
  { event: "Yawning",       driver: "Mario Cruz",      time: "09:12:55 AM", severity: "High"     },
  { event: "Head Pose",     driver: "Jose Reyes",      time: "08:50:22 AM", severity: "Moderate" },
];

const sevMap: Record<string, { bg: string; color: string }> = {
  High:     { bg: "#FEF2F2", color: "#EF4444" },
  Moderate: { bg: "#FFF7ED", color: "#F59E0B" },
  Low:      { bg: "#ECFDF5", color: "#10B981" },
};

export function AnalyticsPage() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const bg = dark ? "#111827" : "#F4F5F7";
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";
  const gridColor = dark ? "#374151" : "#F3F4F6";
  const tooltipStyle = { fontSize: 12, borderRadius: 8, border: `1px solid ${borderColor}`, background: cardBg, color: textMain };

  function Card({ title, subtitle, children, span }: { title: string; subtitle?: string; children: React.ReactNode; span?: string }) {
    return (
      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, padding: "18px 20px", gridColumn: span }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: textMain }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: textSub, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: bg, fontFamily: "Inter, sans-serif", transition: "background 0.2s" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: textMain, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>ANALYTICS</h1>
        <p style={{ fontSize: 13, color: textSub }}>Fleet-wide fatigue and behavior summary — all drivers</p>
      </div>

      {/* Fleet KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Events",   value: String(totalEvents), color: "#1D6AE5", note: "Today" },
          { label: "High Severity",  value: String(recentEvents.filter(e => e.severity === "High").length),     color: "#EF4444", note: "Requires attention" },
          { label: "Moderate",       value: String(recentEvents.filter(e => e.severity === "Moderate").length), color: "#F59E0B", note: "Monitor closely" },
          { label: "Low",            value: String(recentEvents.filter(e => e.severity === "Low").length),      color: "#10B981", note: "Within range" },
          { label: "Active Drivers", value: "7",  color: "#8B5CF6", note: "On duty today" },
          { label: "Vehicles",       value: "7",  color: "#6B7280", note: "In fleet" },
        ].map(({ label, value, color, note }) => (
          <div key={label} style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: textSub, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10, color: textSub, marginTop: 5 }}>{note}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        {/* Event type breakdown */}
        <Card title="Events by Type" subtitle="Total frequency per behavior category — today">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {eventSummary.map((e) => (
              <div key={e.event} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: textMain, width: 100, flexShrink: 0 }}>{e.event}</span>
                <div style={{ flex: 1, height: 8, background: dark ? "#374151" : "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${(e.count / totalEvents) * 100}%`, height: "100%", background: e.color, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: e.color, width: 24, textAlign: "right" }}>{e.count}</span>
                <span style={{ fontSize: 11, color: textSub, width: 36, textAlign: "right" }}>{Math.round((e.count / totalEvents) * 100)}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Severity distribution */}
        <Card title="Severity Distribution" subtitle="Breakdown of events by severity level">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "High",     count: 4,  color: "#EF4444", bg: "#FEF2F2" },
              { label: "Moderate", count: 3,  color: "#F59E0B", bg: "#FFF7ED" },
              { label: "Low",      count: 1,  color: "#10B981", bg: "#ECFDF5" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, width: 72, textAlign: "center" }}>{s.label}</span>
                <div style={{ flex: 1, height: 10, background: dark ? "#374151" : "#E5E7EB", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ width: `${(s.count / 8) * 100}%`, height: "100%", background: s.color, borderRadius: 5 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.color, width: 20 }}>{s.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Fleet blink rate trend */}
        <Card title="Fleet Avg Blink Rate — This Week" subtitle="Average blinks per minute across all drivers">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={fleetBlinkTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 25]} tick={{ fontSize: 10, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="avg" name="Avg Blink Rate" stroke="#1D6AE5" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Fleet PERCLOS trend */}
        <Card title="Fleet Avg PERCLOS — This Week" subtitle="Average eye closure percentage across all drivers">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={fleetPerclosTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 20]} tick={{ fontSize: 10, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "PERCLOS"]} />
              <Line type="monotone" dataKey="avg" name="PERCLOS" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Driver comparison bar */}
        <Card title="Driver Safety Scores" subtitle="Composite score per driver across all metrics" span={isMobile ? undefined : "1 / -1"}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={driverComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="driver" tick={{ fontSize: 10, fill: textSub }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: textSub }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="blink"    name="Blink Rate"   fill="#1D6AE5" radius={[3,3,0,0]} />
              <Bar dataKey="perclos"  name="PERCLOS"      fill="#F59E0B" radius={[3,3,0,0]} />
              <Bar dataKey="ear"      name="EAR"          fill="#EF4444" radius={[3,3,0,0]} />
              <Bar dataKey="posture"  name="Posture"      fill="#10B981" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent events table */}
        <Card title="Recent Events" subtitle="Latest detected behavior events across all drivers" span={isMobile ? undefined : "1 / -1"}>
          <div style={{ overflowY: "auto", maxHeight: 280, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
              <thead style={{ position: "sticky", top: 0, background: cardBg, zIndex: 1 }}>
                <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                  {["Event", "Driver", "Time", "Severity"].map((h) => (
                    <th key={h} style={{ fontSize: 11, fontWeight: 600, color: textSub, textAlign: "left", padding: "8px 16px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((e, i) => {
                  const sev = sevMap[e.severity];
                  return (
                    <tr key={i} style={{ borderBottom: i < recentEvents.length - 1 ? `1px solid ${borderColor}` : "none" }}>
                      <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 500, color: textMain }}>{e.event}</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: textMain }}>{e.driver}</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: textSub, fontFamily: "monospace" }}>{e.time}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: sev.bg, color: sev.color }}>{e.severity}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
