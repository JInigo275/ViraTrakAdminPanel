import { Users, ShieldCheck, AlertTriangle, Video } from "lucide-react";
import { useIsMobile } from "../hooks/useIsMobile";
import { LineChart, Line } from "recharts";
import { useTheme } from "../context/ThemeContext";

const sparkBlue =   [{ v: 3 }, { v: 5 }, { v: 4 }, { v: 6 }, { v: 8 }, { v: 7 }, { v: 9 }];
const sparkGreen =  [{ v: 8 }, { v: 10 }, { v: 9 }, { v: 12 }, { v: 11 }, { v: 13 }, { v: 18 }];
const sparkOrange = [{ v: 8 }, { v: 7 }, { v: 9 }, { v: 6 }, { v: 8 }, { v: 7 }, { v: 6 }];
const sparkRed =    [{ v: 5 }, { v: 9 }, { v: 12 }, { v: 14 }, { v: 18 }, { v: 24 }, { v: 32 }];

const cards = [
  { icon: Users,         iconBg: "#EBF2FF", iconColor: "#1D6AE5", title: "Total Drivers",    value: "24", label: "Active today",        labelColor: "#1D6AE5", spark: sparkBlue,   sparkColor: "#1D6AE5" },
  { icon: ShieldCheck,   iconBg: "#ECFDF5", iconColor: "#10B981", title: "Safe Drives",      value: "18", label: "75% of total",        labelColor: "#10B981", spark: sparkGreen,  sparkColor: "#10B981" },
  { icon: AlertTriangle, iconBg: "#FFF7ED", iconColor: "#F59E0B", title: "Alerts Today",     value: "6",  label: "25% from yesterday",  labelColor: "#F59E0B", spark: sparkOrange, sparkColor: "#F59E0B" },
  { icon: Video,         iconBg: "#FEF2F2", iconColor: "#EF4444", title: "Events Recorded",  value: "32", label: "Today",               labelColor: "#6B7280", spark: sparkRed,    sparkColor: "#EF4444" },
];

export function StatCards() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: isMobile ? 10 : 14, fontFamily: "Inter, sans-serif" }}>
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            style={{
              background: cardBg,
              borderRadius: 12,
              padding: isMobile ? "12px 14px" : "16px 18px",
              boxShadow: shadow,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              transition: "background 0.2s",
            }}
          >
            <div>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Icon size={18} color={c.iconColor} />
              </div>
              <div style={{ fontSize: 13, color: dark ? "#9CA3AF" : "#9CA3AF", marginBottom: 3 }}>{c.title}</div>
              <div style={{ fontSize: isMobile ? 25 : 33, fontWeight: 800, color: textMain, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 13, color: c.labelColor, marginTop: 4 }}>{c.label}</div>
            </div>
            <div style={{ width: 100, height: 64, marginTop: 2, flexShrink: 0 }}>
              <LineChart width={100} height={64} data={c.spark}>
                <Line type="monotone" dataKey="v" stroke={c.sparkColor} strokeWidth={2} dot={false} />
              </LineChart>
            </div>
          </div>
        );
      })}
    </div>
  );
}
