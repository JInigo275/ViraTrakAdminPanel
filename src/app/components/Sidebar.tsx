import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard, Bell, TrendingUp, Users, Contact, ScrollText, FlaskConical, Truck,
  ChevronDown, Moon, Sun, Monitor, LogOut, Check, Settings, X,
} from "lucide-react";
const viraTrakLogo = new URL("../../imports/ViraTrak_Logo.png", import.meta.url).href;
import { useTheme, ThemeMode } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { alertsApi } from "../../api/viratrak";
import { supabase } from "../../api/supabaseClient";

const navSections = [
  {
    label: "MAIN",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", id: "dashboard", roles: ["Owner", "Administrator", "Supervisor"] },
      { icon: TrendingUp, label: "Analytics", id: "analytics", roles: ["Owner", "Administrator", "Supervisor"] },
      { icon: Bell, label: "Alerts & Evidence", id: "alerts", roles: ["Owner", "Administrator", "Supervisor"] },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { icon: Contact, label: "Drivers", id: "employees", roles: ["Owner", "Administrator", "Supervisor"] },
      { icon: Truck, label: "Vehicles", id: "vehicles", roles: ["Owner", "Administrator", "Supervisor"] },
      { icon: Users, label: "Users", id: "users", roles: ["Owner", "Administrator"] },
      { icon: ScrollText, label: "System Logs", id: "logs", roles: ["Owner", "Administrator", "Supervisor"] },
    ],
  },
];

const themeOptions: { value: ThemeMode; label: string; icon: typeof Monitor }[] = [
  { value: "system", label: "System Settings", icon: Monitor },
  { value: "light",  label: "Light Mode",      icon: Sun     },
  { value: "dark",   label: "Dark Mode",       icon: Moon    },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onClose?: () => void;
}

export function Sidebar({ currentPage, onNavigate, onLogout, onClose }: SidebarProps) {
  const { dark, mode, setMode } = useTheme();
  const { currentUser, settings } = useApp();
  const [showLogout, setShowLogout] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const themeRef = useRef<HTMLDivElement>(null);
  const logoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowTheme(false);
      if (logoutRef.current && !logoutRef.current.contains(e.target as Node)) setShowLogout(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function refreshAlertCount() {
      try {
        const alerts = await alertsApi.list();
        if (mounted) setAlertCount(alerts.length);
      } catch {
        if (mounted) setAlertCount(0);
      }
    }

    void refreshAlertCount();
    const interval = window.setInterval(refreshAlertCount, 30000);
    const channel = supabase?.channel("sidebar-alert-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "alert" }, () => { void refreshAlertCount(); })
      .subscribe();
    return () => {
      mounted = false;
      window.clearInterval(interval);
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, []);

  const bg        = dark ? "#111827" : "#fff";
  const border    = dark ? "#1F2937" : "#E8EAED";
  const textMain  = dark ? "#F9FAFB" : "#111827";
  const textMuted = dark ? "#6B7280" : "#9CA3AF";
  const hoverBg   = dark ? "#1F2937" : "#F3F4F6";
  const hoverText = dark ? "#F9FAFB" : "#111827";
  const popupBg   = dark ? "#1F2937" : "#fff";

  const userRole = currentUser?.role ?? "Supervisor";
  const CurrentThemeIcon = themeOptions.find((o) => o.value === mode)?.icon ?? Monitor;

  const displayName = [settings.firstName || currentUser?.firstName, settings.lastName || currentUser?.lastName].filter(Boolean).join(" ") || "Admin User";
  const displayInitials = ((settings.firstName || currentUser?.firstName || "A")[0] + (settings.lastName || currentUser?.lastName || "U")[0]).toUpperCase();

  return (
    <aside style={{ width: 238, minWidth: 238, display: "flex", flexDirection: "column", height: "100%", background: bg, borderRight: `1px solid ${border}`, fontFamily: "Inter, sans-serif", transition: "background 0.2s, border-color 0.2s", position: "relative" }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 16px 16px", borderBottom: `1px solid ${border}` }}>
        <img src={viraTrakLogo} alt="ViraTrak" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: textMain, lineHeight: 1.2 }}>ViraTrak</div>
          <div style={{ fontSize: 12, color: textMuted, lineHeight: 1.3 }}>Behavior Detection</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, display: "flex", padding: 4, borderRadius: 6, flexShrink: 0 }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {navSections.map((section) => {
          const items = section.items.filter((item) => item.roles.includes(userRole));
          if (items.length === 0) return null;
          return (
            <div key={section.label} style={{ marginBottom: 18 }}>
              <div style={{ padding: "8px 12px 7px", color: textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>{section.label}</div>
              {items.map(({ icon: Icon, label, id }) => {
                const active = currentPage === id;
                return (
                  <div
                    key={id}
                    onClick={() => onNavigate(id)}
                    style={{ display: "flex", alignItems: "center", gap: 11, height: 40, padding: "0 12px", borderRadius: 8, marginBottom: 2, cursor: "pointer", background: active ? "#1D6AE5" : "transparent", color: active ? "#fff" : textMuted, transition: "background 0.15s, color 0.15s", userSelect: "none" }}
                    onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = hoverBg; (e.currentTarget as HTMLDivElement).style.color = hoverText; } }}
                    onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "transparent"; (e.currentTarget as HTMLDivElement).style.color = textMuted; } }}
                  >
                    <Icon size={17} strokeWidth={active ? 2.5 : 1.7} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: active ? 600 : 400 }}>{label}</span>
                    {id === "alerts" && alertCount > 0 && <span style={{ minWidth: 20, height: 20, padding: "0 5px", borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: active ? "rgba(255,255,255,.2)" : dark ? "#374151" : "#F3F4F6", color: active ? "#fff" : textMain, fontSize: 11, fontWeight: 700 }}>{alertCount > 99 ? "99+" : alertCount}</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div style={{ padding: "8px 8px 0", borderTop: `1px solid ${border}`, position: "relative" }} ref={themeRef}>
        <div
          onClick={() => setShowTheme((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: 10, height: 40, padding: "0 10px", borderRadius: 8, cursor: "pointer", color: textMuted, transition: "background 0.15s, color 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = hoverBg; (e.currentTarget as HTMLDivElement).style.color = hoverText; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; (e.currentTarget as HTMLDivElement).style.color = textMuted; }}
        >
          <CurrentThemeIcon size={16} strokeWidth={1.5} />
          <span style={{ fontSize: 14, flex: 1 }}>{themeOptions.find((o) => o.value === mode)?.label}</span>
          <ChevronDown size={12} color={textMuted} style={{ transform: showTheme ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </div>

        {showTheme && (
          <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 8, right: 8, background: popupBg, border: `1px solid ${border}`, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", overflow: "hidden", zIndex: 200 }}>
            <div style={{ padding: "8px 12px 6px", fontSize: 12, fontWeight: 600, color: textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Appearance</div>
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <div key={value} onClick={() => { setMode(value); setShowTheme(false); }}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", cursor: "pointer", color: mode === value ? "#1D6AE5" : textMain, fontWeight: mode === value ? 600 : 400, fontSize: 14, transition: "background 0.1s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = hoverBg)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
              >
                <Icon size={15} strokeWidth={1.5} />
                <span style={{ flex: 1 }}>{label}</span>
                {mode === value && <Check size={13} color="#1D6AE5" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User / logout */}
      <div style={{ padding: "8px 8px 10px", position: "relative" }} ref={logoutRef}>
        <div
          onClick={() => setShowLogout((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: dark ? "#1F2937" : "#F8F9FA", borderRadius: 8, padding: "8px 10px", cursor: "pointer", border: `1px solid ${border}` }}
        >
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1D6AE5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
            {settings.avatar ? <img src={settings.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : displayInitials}
          </div>
          <span style={{ fontSize: 13, color: textMain, fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
          <ChevronDown size={12} color={textMuted} style={{ transform: showLogout ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} />
        </div>

        {showLogout && (
          <div style={{ position: "absolute", bottom: "calc(100% - 4px)", left: 8, right: 8, background: popupBg, border: `1px solid ${border}`, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", overflow: "hidden", zIndex: 100 }}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${border}` }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: textMain }}>{displayName}</div>
              <div style={{ fontSize: 12, color: textMuted }}>{currentUser?.email}</div>
              <span style={{ display: "inline-block", marginTop: 4, padding: "1px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "#EBF2FF", color: "#1D6AE5" }}>{currentUser?.role}</span>
            </div>
            <div onClick={() => { onNavigate("settings"); setShowLogout(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", cursor: "pointer", fontSize: 14, color: textMain, transition: "background 0.1s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = hoverBg)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
            >
              <Settings size={14} /> Settings
            </div>
            <div style={{ height: 1, background: border }} />
            <div onClick={() => { setShowLogout(false); onLogout(); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", cursor: "pointer", color: "#EF4444", fontSize: 14, fontWeight: 500, transition: "background 0.1s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = dark ? "#374151" : "#FEF2F2")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
            >
              <LogOut size={14} /> Log Out
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "0 12px 12px", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: textMuted }}>© 2026 ViraTrak System</span>
      </div>
    </aside>
  );
}
