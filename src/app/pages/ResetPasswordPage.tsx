import { useState } from "react";
import { Check, Eye, EyeOff, LockKeyhole, AlertCircle } from "lucide-react";
import { supabase } from "../../api/supabaseClient";

interface ResetPasswordPageProps {
  onComplete: () => void;
}

export function ResetPasswordPage({ onComplete }: ResetPasswordPageProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!supabase) { setError("Supabase is not configured."); return; }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Password must include uppercase, lowercase, number, and special character.");
      return;
    }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    setSaved(true);
    await supabase.auth.signOut();
    window.history.replaceState({}, document.title, window.location.pathname);
    window.setTimeout(onComplete, 1400);
  }

  const fieldStyle = { width: "100%", padding: "15px 44px 15px 14px", fontSize: 15, color: "#111827", background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 10, outline: "none", boxSizing: "border-box" as const, fontFamily: "Inter, sans-serif" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "linear-gradient(135deg, #F7F9FC 0%, #E8F0FC 100%)", fontFamily: "Inter, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 430, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, padding: 32, boxShadow: "0 18px 50px rgba(15,23,42,0.1)" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "#EBF2FF", color: "#1D6AE5", marginBottom: 20 }}><LockKeyhole size={22} /></div>
        <h1 style={{ margin: 0, color: "#111827", fontSize: 27, letterSpacing: "-0.03em" }}>Create a new password</h1>
        <p style={{ margin: "8px 0 24px", color: "#6B7280", fontSize: 15, lineHeight: 1.5 }}>Choose a new password for your Owner account.</p>
        {saved ? (
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", borderRadius: 10, background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", fontSize: 14 }}><Check size={17} /> Password updated. Returning to login...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" style={fieldStyle} />
              <button type="button" aria-label="Show new password" onClick={() => setShowPassword((value) => !value)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: "#6B7280", cursor: "pointer", display: "flex" }}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
            <div style={{ position: "relative" }}>
              <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" style={fieldStyle} />
              <button type="button" aria-label="Show confirmed password" onClick={() => setShowConfirmPassword((value) => !value)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: "#6B7280", cursor: "pointer", display: "flex" }}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
            {error && <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, color: "#DC2626", fontSize: 13 }}><AlertCircle size={16} style={{ flexShrink: 0 }} />{error}</div>}
            <button type="submit" disabled={loading} style={{ marginTop: 4, padding: "13px 16px", border: "none", borderRadius: 10, background: loading ? "#93C5FD" : "#1D6AE5", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer" }}>{loading ? "Updating password..." : "Update password"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
