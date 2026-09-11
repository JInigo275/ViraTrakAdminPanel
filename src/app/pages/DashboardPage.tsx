import { LayoutDashboard } from "lucide-react";
import { StatCards } from "../components/StatCards";
import { RecentEvents } from "../components/RecentEvents";
import { RightPanel } from "../components/RightPanel";
import { PageHeader } from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
  isMobile?: boolean;
}



// ============================================================
// Page UI
// ============================================================
// ============================================================
// Main dashboard layout and responsive panel placement.
// ============================================================
export function DashboardPage({ onNavigate, isMobile }: DashboardPageProps) {
  const { dark } = useTheme();
  const bg = dark ? "#111827" : "#F4F5F7";
  const rightBorder = dark ? "#1F2937" : "#E8EAED";
  const rightBg = dark ? "#111827" : "#fff";

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden", flexDirection: isMobile ? "column" : "row" }}>



{/* ============================================================ */}
      {/* Main scrollable content */}
      {/* ============================================================ */}
      <main style={{ flex: 1, minHeight: 0, height: "100%", overflowY: "auto", overflowX: "hidden", padding: isMobile ? 16 : 20, display: "flex", flexDirection: "column", gap: 16, background: bg, transition: "background 0.2s" }}>
        <PageHeader icon={LayoutDashboard} iconColor="#1D6AE5" title="Dashboard" subtitle="Overview of driver behavior and system status" />
        <StatCards />
        <div style={{ minHeight: 0, flex: 1, display: "flex" }}>
          <RecentEvents onViewAll={onNavigate ? () => onNavigate("alerts") : undefined} />
        </div>



{/* ============================================================ */}
        {/* Right panel rendered inline below on mobile */}
        {/* ============================================================ */}
        {isMobile && (
          <div style={{ background: rightBg, borderRadius: 12, padding: 16, transition: "background 0.2s" }}>
            <RightPanel />
          </div>
        )}
      </main>



{/* ============================================================ */}
      {/* Right panel as sidebar on desktop only */}
      {/* ============================================================ */}
      {!isMobile && (
        <aside style={{ width: 340, minWidth: 340, minHeight: 0, borderLeft: `1px solid ${rightBorder}`, background: rightBg, padding: 16, overflow: "hidden", display: "flex", flexDirection: "column", transition: "background 0.2s" }}>
          <RightPanel />
        </aside>
      )}
    </div>
  );
}

// End of region comment
