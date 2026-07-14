import { Wind, EyeOff, Zap, User, Navigation } from "lucide-react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useTheme } from "../context/ThemeContext";

const events = [
  { icon: Wind,       iconColor: "#F59E0B", iconBg: "#FFF7ED", event: "Yawning Detected",    driver: "Juan Dela Cruz",  vehicle: "TRK-101", time: "10:23:14 AM", severity: "High"   },
  { icon: EyeOff,     iconColor: "#EF4444", iconBg: "#FEF2F2", event: "Eyes Closed",          driver: "Mark Santos",     vehicle: "TRK-104", time: "10:18:07 AM", severity: "High"   },
  { icon: Zap,        iconColor: "#F59E0B", iconBg: "#FFF7ED", event: "Distraction Detected", driver: "Pedro Reyes",     vehicle: "TRK-107", time: "10:12:45 AM", severity: "Moderate" },
  { icon: User,       iconColor: "#8B5CF6", iconBg: "#F5F3FF", event: "Poor Posture",          driver: "Luis Fernandez",  vehicle: "TRK-103", time: "09:58:33 AM", severity: "Moderate" },
  { icon: Navigation, iconColor: "#1D6AE5", iconBg: "#EBF2FF", event: "Head Pose Abnormal",   driver: "Ramon Garcia",    vehicle: "TRK-102", time: "09:45:21 AM", severity: "Low"    },
];

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    High:     { bg: "#FEF2F2", color: "#EF4444" },
    Moderate: { bg: "#FFF7ED", color: "#F59E0B" },
    Low:      { bg: "#ECFDF5", color: "#10B981" },
  };
  const s = map[severity];
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {severity}
    </span>
  );
}

interface RecentEventsProps {
  onViewAll?: () => void;
}

export function RecentEvents({ onViewAll }: RecentEventsProps) {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const headerBorder = dark ? "#374151" : "#F3F4F6";
  const rowHover = dark ? "#374151" : "#FAFAFA";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";
  const thColor = dark ? "#6B7280" : "#9CA3AF";

  return (
    <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, fontFamily: "Inter, sans-serif", overflow: "hidden", transition: "background 0.2s", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${headerBorder}`, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: textMain }}>Recent Alerts</span>
        <button
          onClick={onViewAll}
          style={{ fontSize: 13, color: "#1D6AE5", textDecoration: "none", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "Inter, sans-serif" }}
        >
          View All
        </button>
      </div>

      <div style={{ overflowY: "auto", maxHeight: 280, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
          <thead style={{ position: "sticky", top: 0, background: cardBg, zIndex: 1 }}>
            <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
              {["Event", "Driver", "Time", "Severity"].map((h) => (
                <th key={h} style={{ fontSize: 11, fontWeight: 600, color: thColor, textAlign: "left", padding: "9px 18px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => {
              const Icon = e.icon;
              return (
                <tr
                  key={i}
                  style={{ borderBottom: i < events.length - 1 ? `1px solid ${borderColor}` : "none", transition: "background 0.1s", cursor: "pointer" }}
                  onMouseEnter={(el) => ((el.currentTarget as HTMLTableRowElement).style.background = rowHover)}
                  onMouseLeave={(el) => ((el.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                >
                  <td style={{ padding: "10px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: e.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={12} color={e.iconColor} />
                      </div>
                      <span style={{ fontSize: 13, color: textMain, fontWeight: 500 }}>{e.event}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 18px", fontSize: 13, color: textMain }}>{e.driver}</td>
                  <td style={{ padding: "10px 18px", fontSize: 13, color: textSub }}>{e.time}</td>
                  <td style={{ padding: "10px 18px" }}><SeverityBadge severity={e.severity} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
