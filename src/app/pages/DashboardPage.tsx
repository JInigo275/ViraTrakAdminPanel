import { LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { StatCards, type DashboardRange } from "../components/StatCards";
import { RecentEvents } from "../components/RecentEvents";
import { RightPanel } from "../components/RightPanel";
import { PageHeader } from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
  isMobile?: boolean;
}

const PERIODS: DashboardRange[] = ["Today", "This Week", "This Month", "This Year"];

export function DashboardPage({ onNavigate, isMobile }: DashboardPageProps) {
  const { dark } = useTheme();
  const bg = dark ? "#111827" : "#F4F5F7";
  const rightBorder = dark ? "#1F2937" : "#E8EAED";
  const rightBg = dark ? "#111827" : "#fff";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const headerAccent = "#1D6AE5";
  const [period, setPeriod] = useState<DashboardRange>("Today");

  const renderPeriodSelector = () => (
    <div style={{ position: "relative", display: "flex", background: dark ? "#374151" : "#F3F4F6", borderRadius: 8, padding: 3, width: isMobile ? "100%" : 340 }}>
      <div
        style={{
          position: "absolute",
          top: 3,
          left: isMobile ? `calc(${PERIODS.indexOf(period)} * 25%)` : 3 + PERIODS.indexOf(period) * 83.5,
          width: isMobile ? "25%" : 83.5,
          bottom: 3,
          background: headerAccent,
          borderRadius: 6,
          transition: "left 0.22s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 1px 4px ${headerAccent}55`,
        }}
      />
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setPeriod(p)}
          style={{
            position: "relative",
            zIndex: 1,
            flex: isMobile ? 1 : undefined,
            width: isMobile ? undefined : 83.5,
            flexShrink: 0,
            padding: isMobile ? "8px 0" : "7px 0",
            borderRadius: 6,
            border: "none",
            background: "transparent",
            color: period === p ? "#fff" : textSub,
            fontSize: 13,
            fontWeight: period === p ? 600 : 400,
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            whiteSpace: "nowrap",
            transition: "color 0.18s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            outline: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {p}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, height: "100%", overflow: "hidden", flexDirection: isMobile ? "column" : "row" }}>
      <main style={{ flex: 1, minHeight: 0, height: "100%", overflowY: "auto", overflowX: "hidden", padding: isMobile ? 16 : 20, display: "flex", flexDirection: "column", gap: 16, background: bg, transition: "background 0.2s" }}>
        <PageHeader icon={LayoutDashboard} iconColor="#1D6AE5" title="Dashboard" subtitle="Overview of driver behavior and system status">
          {!isMobile && renderPeriodSelector()}
        </PageHeader>

        {isMobile && (
          <div style={{ marginBottom: 4 }}>
            {renderPeriodSelector()}
          </div>
        )}

        <StatCards range={period} />
        <div style={{ minHeight: 0, flex: 1, display: "flex", height: isMobile ? "100%" : "clamp(300px, 48vh, 520px)", maxHeight: isMobile ? undefined : "520px" }}>
          <RecentEvents onViewAll={onNavigate ? () => onNavigate("alerts") : undefined} />
        </div>

        {isMobile && (
          <div style={{ background: rightBg, borderRadius: 12, padding: 16, transition: "background 0.2s" }}>
            <RightPanel />
          </div>
        )}
      </main>

      {!isMobile && (
        <aside style={{ width: 340, minWidth: 340, minHeight: 0, height: "100%", borderLeft: `1px solid ${rightBorder}`, background: rightBg, padding: 16, overflow: "hidden", display: "flex", flexDirection: "column", transition: "background 0.2s" }}>
          <RightPanel />
        </aside>
      )}
    </div>
  );
}
