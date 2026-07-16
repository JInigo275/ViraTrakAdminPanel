import { useState, useRef, ReactNode, useEffect } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import viraTrakLogo from "../../imports/ViraTrak_Logo.png";
import { useApp } from "../context/AppContext";

interface FloatingInputProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
  suffix?: ReactNode;
}

function FloatingInput({ label, type, value, onChange, hasError, suffix }: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lifted = focused || value.length > 0;

  return (
    <div style={{ position: "relative", cursor: "text" }} onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: lifted ? "22px 44px 8px 16px" : "15px 44px 15px 16px", fontSize: 14, color: "#111827", background: "#fff", border: `1.5px solid ${hasError ? "#EF4444" : focused ? "#1D6AE5" : "#E5E7EB"}`, borderRadius: 10, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, padding 0.2s", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}
      />
      <label style={{ position: "absolute", left: 16, top: lifted ? 8 : "50%", transform: lifted ? "none" : "translateY(-50%)", fontSize: lifted ? 11 : 14, fontWeight: lifted ? 500 : 400, color: focused ? "#1D6AE5" : hasError ? "#EF4444" : "#9CA3AF", pointerEvents: "none", transition: "top 0.18s ease, font-size 0.18s ease, color 0.18s ease, transform 0.18s ease", lineHeight: 1, whiteSpace: "nowrap", fontFamily: "Inter, sans-serif" }}>
        {label}
      </label>
      {suffix && <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>{suffix}</div>}
    </div>
  );
}

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { users, setCurrentUser } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [showForgotPasswordInfo, setShowForgotPasswordInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }

    setLoading(true);
    setTimeout(() => {
      const user = users.find((u) => u.email === email && u.password === password && u.status === "Active");
      if (user) {
        const updated = { ...user, lastLogin: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) };
        try {
          if (stayLoggedIn) localStorage.setItem("stayLoggedIn", "true"); else localStorage.removeItem("stayLoggedIn");
        } catch (e) { }
        setCurrentUser(updated);
        onLogin();
      } else {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
      }
    }, 900);
  }

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", flexDirection: isMobile ? "column" : "row", fontFamily: "Inter, sans-serif", background: "#F4F5F7", overflowY: isMobile ? "auto" : "hidden" }}>
      {/* Branding panel */}
      <div style={{ flex: isMobile ? "none" : "0 0 480px", height: isMobile ? "100vh" : undefined, minHeight: isMobile ? "100vh" : undefined, background: "linear-gradient(145deg, #0f4bbf 0%, #1D6AE5 50%, #2e7cf6 100%)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: isMobile ? "48px 32px" : "48px 52px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
          <img src={viraTrakLogo} alt="ViraTrak" style={{ width: 48, height: 48, objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>ViraTrak</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>Behavior Detection System</div>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 16 }}>Smarter Driver<br />Safety Monitoring</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.72)", lineHeight: 1.6, maxWidth: 340 }}>Real-time driver behavior detection powered by AI. Keep your fleet safe, compliant, and efficient.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 36 }}>
            {[["👁️", "Drowsiness & distraction detection"], ["📊", "Live analytics and behavior reports"], ["🔔", "Instant alert notifications"]].map(([emoji, text]) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{emoji}</div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", position: "relative", zIndex: 1 }}>© 2026 ViraTrak System. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div style={{ flex: isMobile ? "none" : 1, height: isMobile ? "100vh" : undefined, minHeight: isMobile ? "100vh" : undefined, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "40px 28px" : 40, background: "#F4F5F7" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", marginBottom: 6 }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: "#9CA3AF" }}>Sign in to your ViraTrak account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <FloatingInput label="Email address" type="email" value={email} onChange={setEmail} hasError={!!(error && !email)} />
            <div>
              <FloatingInput label="Password" type={showPassword ? "text" : "password"} value={password} onChange={setPassword} hasError={!!(error && !password)}
                suffix={<button type="button" onClick={() => setShowPassword((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#9CA3AF", display: "flex", lineHeight: 1 }}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
              />
              <div style={{ textAlign: "right", marginTop: 6 }}>
                <button type="button" onClick={() => { setShowForgotPasswordInfo(true); setError(""); }}
                  style={{ fontSize: 12, color: "#1D6AE5", textDecoration: "none", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Forgot password?
                </button>
              </div>
            </div>

            {showForgotPasswordInfo && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 12px", background: "#EFF6FF", borderRadius: 10, border: "1px solid #BFDBFE" }}>
                <AlertCircle size={16} color="#0369A1" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#0369A1" }}>
                  Forgot your password? Contact your supervisor so they can reset it for you.
                </span>
              </div>
            )}

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
                <AlertCircle size={15} color="#EF4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#EF4444" }}>{error}</span>
              </div>
            )}

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={stayLoggedIn} onChange={(e) => setStayLoggedIn(e.target.checked)} style={{ width: 16, height: 16 }} />
              <span>Stay logged in</span>
            </label>

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "13px", background: loading ? "#93C5FD" : "#1D6AE5", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4, transition: "background 0.15s" }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#1558c7"; }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#1D6AE5"; }}
            >
              {loading ? (<><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Signing in...</>) : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: "12px 14px", background: "#F0F9FF", borderRadius: 10, border: "1px solid #BAE6FD" }}>
            <p style={{ fontSize: 12, color: "#0369A1", margin: 0, lineHeight: 1.5 }}>
              <strong>Demo credentials:</strong><br />Email: admin@viratrak.com<br />Password: admin123
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
