import { useState, useRef } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { Camera, Eye, EyeOff, Check, Save, Settings, ShieldCheck, LockKeyhole } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";
import { useApp, Role } from "../context/AppContext";
import { supabase } from "../../api/supabaseClient";
import { formatName, validateName, validatePassword } from "../../utils/validation";

const roleColors: Record<Role, { bg: string; color: string }> = {
  Owner: { bg: "#FEF3C7", color: "#D97706" },
  Administrator: { bg: "#EBF2FF", color: "#1D6AE5" },
  Supervisor: { bg: "#F5F3FF", color: "#8B5CF6" },
};

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  const { dark } = useTheme();
  return (
    <section style={{ background: dark ? "#1F2937" : "#fff", borderRadius: 16, boxShadow: dark ? "0 8px 28px rgba(0,0,0,0.18)" : "0 8px 28px rgba(15,23,42,0.07)", border: `1px solid ${dark ? "#374151" : "#E8EAED"}`, overflow: "hidden", marginBottom: 18 }}>
      <div style={{ padding: "18px 22px 16px", borderBottom: `1px solid ${dark ? "#374151" : "#EEF0F3"}`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: dark ? "#243B64" : "#EBF2FF", color: "#1D6AE5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {title === "Profile" ? <Settings size={18} /> : <ShieldCheck size={18} />}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1D6AE5", letterSpacing: "0.08em", textTransform: "uppercase" }}>{eyebrow}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: dark ? "#F9FAFB" : "#111827", marginTop: 2 }}>{title}</div>
        </div>
      </div>
      <div style={{ padding: 22 }}>{children}</div>
    </section>
  );
}

function FloatField({ label, value, onChange, type = "text", suffix }: { label: string; value: string; onChange: (v: string) => void; type?: string; suffix?: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  const { dark } = useTheme();
  const lifted = focused || value.length > 0;
  return (
    <div style={{ position: "relative" }}>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: lifted ? "22px 44px 8px 14px" : "15px 44px 15px 14px", fontSize: 15, color: dark ? "#F9FAFB" : "#111827", background: dark ? "#374151" : "#fff", border: `1.5px solid ${focused ? "#1D6AE5" : dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 10, outline: "none", boxSizing: "border-box", transition: "all 0.18s", fontFamily: "Inter, sans-serif" }} />
      <label style={{ position: "absolute", left: 14, top: lifted ? 8 : "50%", transform: lifted ? "none" : "translateY(-50%)", fontSize: lifted ? 12 : 15, fontWeight: lifted ? 500 : 400, color: focused ? "#1D6AE5" : dark ? "#6B7280" : "#9CA3AF", pointerEvents: "none", transition: "all 0.18s ease", fontFamily: "Inter, sans-serif" }}>{label}</label>
      {suffix && <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>{suffix}</div>}
    </div>
  );
}

export function SettingsPage() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const { currentUser, setCurrentUser, settings, setSettings, updateUser } = useApp();

  const [firstName, setFirstName] = useState(settings.firstName);
  const [lastName, setLastName] = useState(settings.lastName);
  const [avatar, setAvatar] = useState(settings.avatar ?? "");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSaved, setPassSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const roleStyle = currentUser ? roleColors[currentUser.role] : roleColors.Supervisor;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    const validationError = validateName(firstName, "First name") || validateName(lastName, "Last name");
    if (validationError) { setProfileError(validationError); return; }
    setProfileError("");
    setProfileSaving(true);
    const normalizedFirstName = formatName(firstName);
    const normalizedLastName = formatName(lastName);
    setFirstName(normalizedFirstName); setLastName(normalizedLastName);
    setSettings((p) => ({ ...p, firstName: normalizedFirstName, lastName: normalizedLastName, avatar: avatar || null }));
    setCurrentUser((prev) => prev ? { ...prev, firstName: normalizedFirstName, lastName: normalizedLastName, avatar: avatar || null } : prev);
    if (currentUser) {
      try {
        await updateUser(currentUser.id, { firstName: normalizedFirstName, lastName: normalizedLastName, avatar: avatar || null });
      } catch (error) {
        setProfileError(error instanceof Error ? error.message : "Could not save your profile.");
        setProfileSaving(false);
        return;
      }
    }
    setProfileSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function changePassword() {
    setPassError("");
    if (!oldPass) { setPassError("Enter your current password."); return; }
    if (!currentUser?.email || !supabase) { setPassError("Your session is unavailable. Please sign in again."); return; }
    const passwordError = validatePassword(newPass);
    if (passwordError) { setPassError(passwordError); return; }
    if (newPass !== confirmPass) { setPassError("Passwords do not match."); return; }
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: oldPass });
    if (verifyError) { setPassError("Current password is incorrect."); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPass });
    if (updateError) { setPassError("Could not save the new password. Please try again."); return; }
    setCurrentUser((prev) => prev ? { ...prev, password: "" } : prev);
    setOldPass(""); setNewPass(""); setConfirmPass("");
    setPassSaved(true);
    setTimeout(() => setPassSaved(false), 2500);
  }

  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle} style={{ background: "none", border: "none", cursor: "pointer", color: dark ? "#9CA3AF" : "#6B7280", display: "flex", padding: 2 }}>
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 14 : 26, background: dark ? "#0F172A" : "linear-gradient(135deg, #F7F9FC 0%, #F1F5F9 100%)", fontFamily: "Inter, sans-serif", transition: "background 0.2s" }}>
      <PageHeader icon={Settings} iconColor="#1D6AE5" title="Settings" subtitle="Manage your profile and security" />

      {/* Profile */}
      <Section title="Profile" eyebrow="Personal workspace">
        <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 20, marginBottom: 24, padding: isMobile ? 16 : "20px 22px", borderRadius: 14, background: dark ? "linear-gradient(120deg, #243B64, #1F2937)" : "linear-gradient(120deg, #EEF5FF, #F8FAFC)", border: `1px solid ${dark ? "#36517F" : "#DCE9FB"}` }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 88, height: 88, borderRadius: "50%", background: "#1D6AE5", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `4px solid ${dark ? "#93C5FD" : "#fff"}`, boxShadow: "0 4px 14px rgba(29,106,229,0.25)" }}>
              {avatar ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 25, fontWeight: 700, color: "#fff" }}>{(firstName[0] ?? "") + (lastName[0] ?? "")}</span>}
            </div>
            <button aria-label="Change profile photo" title="Change profile photo" onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 0, right: -2, width: 30, height: 30, borderRadius: "50%", background: "#1D6AE5", border: `3px solid ${dark ? "#243B64" : "#EEF5FF"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera size={14} color="#fff" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 750, color: textMain, letterSpacing: "-0.02em" }}>{firstName} {lastName}</div>
            <div style={{ fontSize: 14, color: textSub, marginTop: 5 }}>{currentUser?.email}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: roleStyle.bg, color: roleStyle.color }}><ShieldCheck size={13} />{currentUser?.role}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: isMobile ? "100%" : 520 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            <FloatField label="First Name" value={firstName} onChange={setFirstName} />
            <FloatField label="Last Name" value={lastName} onChange={setLastName} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveProfile} disabled={profileSaving} style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 18px", background: profileSaving ? "#7BA7EE" : "#1D6AE5", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: profileSaving ? "wait" : "pointer", fontFamily: "Inter, sans-serif" }}>
              {profileSaved ? <><Check size={14} /> Saved</> : profileSaving ? "Saving..." : <><Save size={14} /> Save Profile</>}
            </button>
            {avatar && <button onClick={() => setAvatar("")} style={{ padding: "10px 14px", background: "transparent", border: `1px solid ${borderColor}`, borderRadius: 8, fontSize: 14, color: textSub, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Remove Photo</button>}
          </div>
          {profileError && <div style={{ fontSize: 14, color: "#EF4444", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>{profileError}</div>}
        </div>
      </Section>

      {/* Password */}
      <Section title="Change Password" eyebrow="Account security">
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "flex-start", gap: 24 }}>
          <div style={{ flex: 1, maxWidth: 360 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: textMain, fontSize: 15, fontWeight: 700 }}><LockKeyhole size={17} color="#1D6AE5" /> Keep your account secure</div>
            <div style={{ fontSize: 13, color: textSub, lineHeight: 1.6, marginTop: 8 }}>Use a strong password that you do not reuse on another service.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 420 }}>
          <FloatField label="Current Password" type={showOld ? "text" : "password"} value={oldPass} onChange={setOldPass} suffix={eyeBtn(showOld, () => setShowOld((v) => !v))} />
          <FloatField label="New Password" type={showNew ? "text" : "password"} value={newPass} onChange={setNewPass} suffix={eyeBtn(showNew, () => setShowNew((v) => !v))} />
          <FloatField label="Confirm New Password" type={showConfirm ? "text" : "password"} value={confirmPass} onChange={setConfirmPass} suffix={eyeBtn(showConfirm, () => setShowConfirm((v) => !v))} />
          {passError && <div style={{ fontSize: 14, color: "#EF4444", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>{passError}</div>}
          <button onClick={changePassword} style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 18px", background: "#1D6AE5", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", width: "fit-content" }}>
            {passSaved ? <><Check size={14} /> Password Updated</> : "Update Password"}
          </button>
          </div>
        </div>
      </Section>

    </div>
  );
}
