import { useState } from "react";
import { Shield, Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { useApp } from "../context/AppContext";

interface Props {
  onDone: () => void;
}

export function ChangePasswordPage({ onDone }: Props) {
  const { currentUser, setUsers, setCurrentUser } = useApp();
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [focusNew, setFocusNew] = useState(false);
  const [focusConfirm, setFocusConfirm] = useState(false);

  const rules = [
    { label: "At least 8 characters", ok: newPass.length >= 8 },
    { label: "Contains uppercase letter", ok: /[A-Z]/.test(newPass) },
    { label: "Contains a number", ok: /[0-9]/.test(newPass) },
    { label: "Contains a special character", ok: /[^A-Za-z0-9]/.test(newPass) },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPass.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPass !== confirmPass) { setError("Passwords do not match."); return; }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser?.id
          ? { ...u, password: newPass, mustChangePassword: false }
          : u
      )
    );
    setCurrentUser((prev) => prev ? { ...prev, password: newPass, mustChangePassword: false } : prev);
    onDone();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F5F7", fontFamily: "Inter, sans-serif", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", padding: "40px 44px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: "#EBF2FF", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Shield size={26} color="#1D6AE5" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 6, textAlign: "center" }}>Set Your Password</h1>
          <p style={{ fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 1.5 }}>
            Welcome, <strong>{currentUser?.name}</strong>! You're using a temporary password.<br />Please set a new one before continuing.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* New password */}
          <div style={{ position: "relative" }} onClick={() => (document.getElementById("np") as HTMLInputElement)?.focus()}>
            <input
              id="np"
              type={showNew ? "text" : "password"}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              onFocus={() => setFocusNew(true)}
              onBlur={() => setFocusNew(false)}
              style={{ width: "100%", padding: (focusNew || newPass) ? "22px 44px 8px 16px" : "15px 44px 15px 16px", fontSize: 14, color: "#111827", background: "#fff", border: `1.5px solid ${focusNew ? "#1D6AE5" : "#E5E7EB"}`, borderRadius: 10, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, padding 0.2s", fontFamily: "Inter, sans-serif" }}
            />
            <label style={{ position: "absolute", left: 16, top: (focusNew || newPass) ? 8 : "50%", transform: (focusNew || newPass) ? "none" : "translateY(-50%)", fontSize: (focusNew || newPass) ? 11 : 14, fontWeight: (focusNew || newPass) ? 500 : 400, color: focusNew ? "#1D6AE5" : "#9CA3AF", pointerEvents: "none", transition: "all 0.18s ease", fontFamily: "Inter, sans-serif" }}>
              New Password
            </label>
            <button type="button" onClick={() => setShowNew((v) => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Password rules */}
          {newPass.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "10px 12px", background: "#F8F9FA", borderRadius: 8 }}>
              {rules.map((r) => (
                <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: r.ok ? "#10B981" : "#9CA3AF" }}>
                  <CheckCircle size={13} color={r.ok ? "#10B981" : "#D1D5DB"} />
                  {r.label}
                </div>
              ))}
            </div>
          )}

          {/* Confirm password */}
          <div style={{ position: "relative" }} onClick={() => (document.getElementById("cp") as HTMLInputElement)?.focus()}>
            <input
              id="cp"
              type={showConfirm ? "text" : "password"}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              onFocus={() => setFocusConfirm(true)}
              onBlur={() => setFocusConfirm(false)}
              style={{ width: "100%", padding: (focusConfirm || confirmPass) ? "22px 44px 8px 16px" : "15px 44px 15px 16px", fontSize: 14, color: "#111827", background: "#fff", border: `1.5px solid ${focusConfirm ? "#1D6AE5" : "#E5E7EB"}`, borderRadius: 10, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, padding 0.2s", fontFamily: "Inter, sans-serif" }}
            />
            <label style={{ position: "absolute", left: 16, top: (focusConfirm || confirmPass) ? 8 : "50%", transform: (focusConfirm || confirmPass) ? "none" : "translateY(-50%)", fontSize: (focusConfirm || confirmPass) ? 11 : 14, fontWeight: (focusConfirm || confirmPass) ? 500 : 400, color: focusConfirm ? "#1D6AE5" : "#9CA3AF", pointerEvents: "none", transition: "all 0.18s ease", fontFamily: "Inter, sans-serif" }}>
              Confirm Password
            </label>
            <button type="button" onClick={() => setShowConfirm((v) => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div style={{ padding: "10px 12px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA", fontSize: 13, color: "#EF4444" }}>{error}</div>
          )}

          <button type="submit" style={{ padding: "13px", background: "#1D6AE5", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", marginTop: 4 }}>
            Set Password & Continue
          </button>
        </form>
      </div>
    </div>
  );
}
