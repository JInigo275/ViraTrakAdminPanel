import { useState, useEffect } from "react";
import { Menu, Shield } from "lucide-react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AppProvider, useApp } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { LoginPage } from "./pages/LoginPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AlertsPage } from "./pages/AlertsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { UsersPage } from "./pages/UsersPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { EmployeeDetailPage } from "./pages/EmployeeDetailPage";
import { SystemLogsPage } from "./pages/SystemLogsPage";
import { SettingsPage } from "./pages/SettingsPage";

function AppInner() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [empDetailId, setEmpDetailId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { dark } = useTheme();
  const { currentUser, setCurrentUser } = useApp();

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

  const isMobile = windowWidth < 768;
  const zoom = isMobile ? 1
    : windowWidth < 1400 ? 0.93
    : windowWidth < 1200 ? 0.86
    : windowWidth < 1000 ? 0.77
    : 1;

  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;
  if (currentUser?.mustChangePassword) return <ChangePasswordPage onDone={() => {}} />;

  function handleLogout() {
    setCurrentUser(null);
    setLoggedIn(false);
    setCurrentPage("dashboard");
    setDrawerOpen(false);
  }

  function navigate(page: string) {
    setCurrentPage(page);
    if (page !== "employees") setEmpDetailId(null);
    setDrawerOpen(false);
  }

  const renderPage = () => {
    if (currentPage === "employees" && empDetailId) {
      return <EmployeeDetailPage empId={empDetailId} onBack={() => setEmpDetailId(null)} />;
    }
    switch (currentPage) {
      case "dashboard":  return <DashboardPage onNavigate={navigate} isMobile={isMobile} />;
      case "alerts":     return <AlertsPage />;
      case "analytics":  return <AnalyticsPage />;
      case "users":      return <UsersPage />;
      case "employees":  return <EmployeesPage onViewDetail={(id) => setEmpDetailId(id)} />;
      case "logs":       return <SystemLogsPage />;
      case "settings":   return <SettingsPage />;
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
      fontFamily: "Inter, sans-serif",
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
            <div style={{ width: 26, height: 26, background: "#1D6AE5", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={14} color="#fff" />
            </div>
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
        button { font-family: Inter, sans-serif; }
        input { font-family: Inter, sans-serif; }
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
