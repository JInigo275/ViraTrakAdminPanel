import { StatCards } from "../components/StatCards";
import { RecentEvents } from "../components/RecentEvents";
import { RightPanel } from "../components/RightPanel";
import { useTheme } from "../context/ThemeContext";

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
  isMobile?: boolean;
}

export function DashboardPage({ onNavigate, isMobile }: DashboardPageProps) {
  const { dark } = useTheme();
  const bg = dark ? "#111827" : "#F4F5F7";
  const rightBorder = dark ? "#1F2937" : "#E8EAED";
  const rightBg = dark ? "#111827" : "#fff";

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: isMobile ? "column" : "row" }}>

      {/* Main scrollable content */}
      <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 20, display: "flex", flexDirection: "column", gap: 16, background: bg, transition: "background 0.2s" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: dark ? "#F9FAFB" : "#111827", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>DASHBOARD</h1>
          <p style={{ fontSize: 13, color: dark ? "#6B7280" : "#9CA3AF" }}>Overview of driver behavior and system status</p>
        </div>
        <StatCards />
        <RecentEvents onViewAll={onNavigate ? () => onNavigate("alerts") : undefined} />

        {/* Right panel rendered inline below on mobile */}
        {isMobile && (
          <div style={{ background: rightBg, borderRadius: 12, padding: 16, transition: "background 0.2s" }}>
            <RightPanel />
          </div>
        )}
      </main>

      {/* Right panel as sidebar on desktop only */}
      {!isMobile && (
        <aside style={{ width: 340, minWidth: 340, borderLeft: `1px solid ${rightBorder}`, background: rightBg, padding: 16, overflow: "hidden", display: "flex", flexDirection: "column", transition: "background 0.2s" }}>
          <RightPanel />
        </aside>
      )}
    </div>
  );
}
