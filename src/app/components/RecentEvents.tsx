import { useEffect, useMemo, useState } from "react";
import { Wind, EyeOff, Zap, User, Navigation } from "lucide-react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useTheme } from "../context/ThemeContext";
import { alertsApi, DbAlert } from "../../api/viratrak";
import { EvidencePreviewModal } from "./EvidencePreviewModal";

const typeIconMap: Record<string, typeof Wind> = {
  Yawning: Wind,
  "Eyes Closed": EyeOff,
  Distraction: Zap,
  "Poor Posture": User,
  "Head Pose": Navigation,
  "Micro Sleep": Navigation,
  "Blink Rate": Navigation,
  "Body Posture": User,
};

type EventRow = {
  icon: typeof Wind;
  iconColor: string;
  iconBg: string;
  event: string;
  driver: string;
  vehicle: string;
  time: string;
  severity: DbAlert["severity"];
  alert: DbAlert;
};

function toRow(alert: DbAlert): EventRow {
  const iconMap: Record<DbAlert["severity"], { iconColor: string; iconBg: string }> = {
    High: { iconColor: "#EF4444", iconBg: "#FEF2F2" },
    Moderate: { iconColor: "#F59E0B", iconBg: "#FFF7ED" },
    Low: { iconColor: "#10B981", iconBg: "#ECFDF5" },
  };
  return {
    icon: typeIconMap[alert.type] ?? Zap,
    iconColor: iconMap[alert.severity].iconColor,
    iconBg: iconMap[alert.severity].iconBg,
    event: alert.type,
    driver: alert.driver,
    vehicle: alert.vehicle,
    time: alert.time,
    severity: alert.severity,
    alert,
  };
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    High:     { bg: "#FEF2F2", color: "#EF4444" },
    Moderate: { bg: "#FFF7ED", color: "#F59E0B" },
    Low:      { bg: "#ECFDF5", color: "#10B981" },
  };
  const s = map[severity];
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
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
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<DbAlert | null>(null);
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const headerBorder = dark ? "#374151" : "#F3F4F6";
  const rowHover = dark ? "#374151" : "#FAFAFA";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";
  const thColor = dark ? "#6B7280" : "#9CA3AF";

  useEffect(() => {
    alertsApi.list().then((rows) => setEvents(rows.slice().sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)).slice(0, 5).map(toRow))).catch(console.error);
  }, []);

  const total = useMemo(() => events.length, [events]);

  return (
    <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, fontFamily: "Inter, sans-serif", overflow: "hidden", transition: "background 0.2s", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${headerBorder}`, flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: textMain }}>Recent Alerts</span>
        <button
          onClick={onViewAll}
          style={{ fontSize: 14, color: "#1D6AE5", textDecoration: "none", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "Inter, sans-serif" }}
        >
          View All
        </button>
      </div>

      <div style={{ overflowY: "auto", maxHeight: 280, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 320 : 420 }}>
          <thead style={{ position: "sticky", top: 0, background: cardBg, zIndex: 1 }}>
            <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
              {["Event", "Driver", "Time", "Severity"].map((h) => (
                <th key={h} style={{ fontSize: 12, fontWeight: 600, color: thColor, textAlign: "left", padding: "9px 18px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "28px 18px", textAlign: "center", color: textSub, fontSize: 14 }}>
                  No recent alerts available.
                </td>
              </tr>
            ) : events.map((e, i) => {
              const Icon = e.icon;
              return (
                <tr
                  key={i}
                  style={{ borderBottom: i < events.length - 1 ? `1px solid ${borderColor}` : "none", transition: "background 0.1s", cursor: "pointer" }}
                  onClick={() => e.alert.evidence && setSelectedAlert(e.alert)}
                  onMouseEnter={(el) => ((el.currentTarget as HTMLTableRowElement).style.background = rowHover)}
                  onMouseLeave={(el) => ((el.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                >
                  <td style={{ padding: "10px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: e.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={12} color={e.iconColor} />
                      </div>
                      <span style={{ fontSize: 14, color: textMain, fontWeight: 500 }}>{e.event}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 18px", fontSize: 14, color: textMain }}>{e.driver}</td>
                  <td style={{ padding: "10px 18px", fontSize: 14, color: textSub }}>{e.time}</td>
                  <td style={{ padding: "10px 18px" }}><SeverityBadge severity={e.severity} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedAlert && <EvidencePreviewModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />}
    </div>
  );
}
