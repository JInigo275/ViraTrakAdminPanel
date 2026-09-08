import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
// Use URL import for image assets to avoid requiring a PNG module declaration
const viraTrakLogo = new URL("../imports/ViraTrak_Logo.png", import.meta.url).href;
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AppProvider, canManageUsers, useApp } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { LoginPage } from "./pages/LoginPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AlertsPage } from "./pages/AlertsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { UsersPage } from "./pages/UsersPage";
import { DriversPage } from "./pages/DriversPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { DriverDetailPage } from "./pages/DriverDetailPage";
import { SystemLogsPage } from "./pages/SystemLogsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TestPage } from "./pages/TestPage";
import { supabase } from "../api/supabaseClient";

function AppInner() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      return localStorage.getItem("currentPage") || "dashboard";
    } catch (e) {
      return "dashboard";
    }
  });
  const [driverDetailId, setDriverDetailId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("driverDetailId");
    } catch (e) {
      return null;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { dark } = useTheme();
  const { currentUser, setCurrentUser } = useApp();

  // Sync loggedIn state with persisted/current user
  useEffect(() => {
    setLoggedIn(!!currentUser);
  }, [currentUser]);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    function update() {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) setDrawerOpen(false);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    document.title = "ViraTrak";
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = viraTrakLogo;
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("currentPage", currentPage);
    } catch (e) {
      // ignore
    }
  }, [currentPage]);

  useEffect(() => {
    try {
      if (driverDetailId) {
        localStorage.setItem("driverDetailId", driverDetailId);
      } else {
        localStorage.removeItem("driverDetailId");
      }
    } catch (e) {
      // ignore
    }
  }, [driverDetailId]);

  const isMobile = windowWidth < 768;
  const zoom = isMobile ? 1
    : windowWidth < 1400 ? 0.93
    : windowWidth < 1200 ? 0.86
    : windowWidth < 1000 ? 0.77
    : 1;

  if (!loggedIn) return <LoginPage onLogin={() => { setCurrentPage("dashboard"); setDriverDetailId(null); setLoggedIn(true); }} />;
  if (currentUser?.mustChangePassword) return <ChangePasswordPage onDone={() => {}} />;

  function handleLogout() {
    void supabase?.auth.signOut();
    setCurrentUser(null);
    setLoggedIn(false);
    setCurrentPage("dashboard");
    setDrawerOpen(false);
    try {
      localStorage.removeItem("stayLoggedIn");
      localStorage.removeItem("currentUser");
      sessionStorage.removeItem("currentUser");
    } catch (e) { }
  }

  function navigate(page: string) {
    setCurrentPage(page);
    if (page !== "employees") setDriverDetailId(null);
    setDrawerOpen(false);
  }

  const renderPage = () => {
    if (currentPage === "employees" && driverDetailId) {
      return <DriverDetailPage driverId={driverDetailId} onBack={() => setDriverDetailId(null)} />;
    }
    switch (currentPage) {
      case "dashboard":  return <DashboardPage onNavigate={navigate} isMobile={isMobile} />;
      case "alerts":     return <AlertsPage />;
      case "analytics":  return <AnalyticsPage />;
      case "users":      return canManageUsers(currentUser?.role ?? "Supervisor")
        ? <UsersPage />
        : <DashboardPage onNavigate={navigate} isMobile={isMobile} />;
      case "employees":  return <DriversPage onViewDetail={(id) => setDriverDetailId(id)} />;
      case "vehicles":   return <VehiclesPage />;
      case "logs":       return <SystemLogsPage />;
      case "settings":   return <SettingsPage />;
      case "test":       return <TestPage />;
      default:           return <DashboardPage isMobile={isMobile} />;
    }
  };

  const borderColor = dark ? "#1F2937" : "#E8EAED";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: zoom === 1 ? "100vh" : `${100 / zoom}vh`,
      width: zoom === 1 ? "100%" : `${100 / zoom}vw`,
      fontFamily: "Gelasio, sans-serif",
      background: dark ? "#111827" : "#F4F5F7",
      overflow: "hidden",
      transition: "background 0.2s",
      ...(zoom !== 1 ? { zoom } : {}),
    }}>

      {/* Mobile top bar */}
      {isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", height: 52, background: dark ? "#111827" : "#fff", borderBottom: `1px solid ${borderColor}`, flexShrink: 0, zIndex: 10 }}>
          <button onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: dark ? "#9CA3AF" : "#6B7280", display: "flex", padding: 4, borderRadius: 6 }}>
            <Menu size={20} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src={viraTrakLogo} alt="ViraTrak" style={{ width: 28, height: 28, objectFit: "contain" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: dark ? "#F9FAFB" : "#111827" }}>ViraTrak</span>
          </div>
        </div>
      )}

      {/* Body row */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Desktop sidebar — in normal flow */}
        {!isMobile && (
          <Sidebar currentPage={currentPage} onNavigate={navigate} onLogout={handleLogout} />
        )}

        {/* Mobile drawer overlay */}
        {isMobile && drawerOpen && (
          <>
            <div
              onClick={() => setDrawerOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400 }}
            />
            <div style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 500 }}>
              <Sidebar currentPage={currentPage} onNavigate={navigate} onLogout={handleLogout} onClose={() => setDrawerOpen(false)} />
            </div>
          </>
        )}

        {/* Page content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {renderPage()}
        </div>
      </div>

      <style>{`
        html, body { overflow: hidden; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${dark ? "#374151" : "#D1D5DB"}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${dark ? "#4B5563" : "#9CA3AF"}; }
        * { box-sizing: border-box; }
        h1, h2, h3, h4, p { margin: 0; }
        button { font-family: 'Gelasio', sans-serif; -webkit-tap-highlight-color: transparent; }
        button:focus { outline: none; }
        button:focus-visible { outline: 2px solid #1D6AE5; outline-offset: 2px; }
        input { font-family: 'Gelasio', sans-serif; }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </AppProvider>
  );
}
