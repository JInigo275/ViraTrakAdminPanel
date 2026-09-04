import { useEffect, useMemo, useState } from "react";
import { Users, ShieldCheck, AlertTriangle, Video } from "lucide-react";
import { useIsMobile } from "../hooks/useIsMobile";
import { LineChart, Line } from "recharts";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { alertsApi, DbAlert } from "../../api/viratrak";
import { buildDashboardCards } from "../utils/analytics";

export function StatCards() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const { drivers } = useApp();
  const [alerts, setAlerts] = useState<DbAlert[]>([]);
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";

  useEffect(() => {
    alertsApi.list().then(setAlerts).catch(console.error);
  }, []);

  const cards = useMemo(() => buildDashboardCards(alerts, drivers.length), [alerts, drivers.length]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: isMobile ? 10 : 14, fontFamily: "Inter, sans-serif" }}>
      {cards.map((c) => {
        const iconMap: Record<string, typeof Users> = {
          "Total Drivers": Users,
          "Safe Drives": ShieldCheck,
          "Alerts Today": AlertTriangle,
          "Events Recorded": Video,
        };
        const Icon = iconMap[c.title] ?? Users;
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