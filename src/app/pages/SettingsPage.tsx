import { useState, useRef } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { Camera, Eye, EyeOff, Check, Save, Settings } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { dark } = useTheme();
  return (
    <div style={{ background: dark ? "#1F2937" : "#fff", borderRadius: 12, boxShadow: dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${dark ? "#374151" : "#F3F4F6"}` }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: dark ? "#F9FAFB" : "#111827" }}>{title}</span>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
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

  const fileRef = useRef<HTMLInputElement>(null);

  const bg = dark ? "#111827" : "#F4F5F7";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    setSettings((p) => ({ ...p, firstName, lastName, avatar: avatar || undefined }));
    setCurrentUser((prev) => prev ? { ...prev, firstName, lastName } : prev);
    if (currentUser) {
      updateUser(currentUser.id, { firstName, lastName }).catch(console.error);
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function changePassword() {
    setPassError("");
    if (!oldPass) { setPassError("Enter your current password."); return; }
    if (oldPass !== currentUser?.password) { setPassError("Current password is incorrect."); return; }
    if (newPass.length < 8) { setPassError("New password must be at least 8 characters."); return; }
    if (newPass !== confirmPass) { setPassError("Passwords do not match."); return; }
    if (currentUser) {
      updateUser(currentUser.id, { password: newPass }).catch(console.error);
    }
    setCurrentUser((prev) => prev ? { ...prev, password: newPass } : prev);
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
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: bg, fontFamily: "Inter, sans-serif", transition: "background 0.2s" }}>
      <PageHeader icon={Settings} iconColor="#1D6AE5" title="Settings" subtitle="Manage your profile and security" />

      {/* Profile */}
      <Section title="Profile">
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#1D6AE5", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "3px solid #EBF2FF" }}>
              {avatar ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 25, fontWeight: 700, color: "#fff" }}>{(firstName[0] ?? "") + (lastName[0] ?? "")}</span>}
            </div>
            <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: "#1D6AE5", border: "2px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera size={12} color="#fff" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: textMain }}>{firstName} {lastName}</div>
            <div style={{ fontSize: 14, color: textSub, marginTop: 2 }}>{currentUser?.email}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "#EBF2FF", color: "#1D6AE5" }}>{currentUser?.role}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: isMobile ? "100%" : 420 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            <FloatField label="First Name" value={firstName} onChange={setFirstName} />
            <FloatField label="Last Name" value={lastName} onChange={setLastName} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveProfile} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "#1D6AE5", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              {profileSaved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save Profile</>}
            </button>
            {avatar && <button onClick={() => setAvatar("")} style={{ padding: "10px 14px", background: "transparent", border: `1px solid ${borderColor}`, borderRadius: 8, fontSize: 14, color: textSub, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Remove Photo</button>}
          </div>
        </div>
      </Section>

      {/* Password */}
      <Section title="Change Password">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: isMobile ? "100%" : 420 }}>
          <FloatField label="Current Password" type={showOld ? "text" : "password"} value={oldPass} onChange={setOldPass} suffix={eyeBtn(showOld, () => setShowOld((v) => !v))} />
          <FloatField label="New Password" type={showNew ? "text" : "password"} value={newPass} onChange={setNewPass} suffix={eyeBtn(showNew, () => setShowNew((v) => !v))} />
          <FloatField label="Confirm New Password" type={showConfirm ? "text" : "password"} value={confirmPass} onChange={setConfirmPass} suffix={eyeBtn(showConfirm, () => setShowConfirm((v) => !v))} />
          {passError && <div style={{ fontSize: 14, color: "#EF4444", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>{passError}</div>}
          <button onClick={changePassword} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "#1D6AE5", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", width: "fit-content" }}>
            {passSaved ? <><Check size={14} /> Password Updated</> : "Update Password"}
          </button>
        </div>
      </Section>

    </div>
  );
}
