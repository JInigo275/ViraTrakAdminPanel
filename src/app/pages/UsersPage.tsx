import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { Plus, Search, MoreVertical, X, Eye, EyeOff, Copy, Check, Mail, Shield, Crown, UserCog, RefreshCw } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useApp, AppUser, Role, genTempPassword, getAddableRoles, canManageUsers, getFullName } from "../context/AppContext";
import { usersApi } from "../../api/viratrak";

const roleColors: Record<Role, { bg: string; color: string }> = {
  Owner:         { bg: "#FEF3C7", color: "#D97706" },
  Administrator: { bg: "#EBF2FF", color: "#1D6AE5" },
  Supervisor:    { bg: "#F5F3FF", color: "#8B5CF6" },
};

const roleInfo = [
  { role: "Owner" as Role, icon: Crown, color: "#D97706", bg: "#FEF3C7", desc: "Full system access. Can add and manage Administrators and Supervisors. Only one per system." },
  { role: "Administrator" as Role, icon: Shield, color: "#1D6AE5", bg: "#EBF2FF", desc: "Full operational access. Can only add and manage Supervisors. Cannot manage other Administrators or Owners." },
  { role: "Supervisor" as Role, icon: UserCog, color: "#8B5CF6", bg: "#F5F3FF", desc: "Restricted access — Dashboard, Alerts & Recordings, Analytics, and Employee Info only. Cannot add users." },
];

function Modal({ title, onClose, children, width }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  const { dark } = useTheme();
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: dark ? "#1F2937" : "#fff", borderRadius: 14, width: "100%", maxWidth: width ?? 480, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${dark ? "#374151" : "#F3F4F6"}` }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: dark ? "#F9FAFB" : "#111827" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: dark ? "#6B7280" : "#9CA3AF", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function FloatField({ label, type = "text", value, onChange, disabled, suffix }: { label: string; type?: string; value: string; onChange?: (v: string) => void; disabled?: boolean; suffix?: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  const { dark } = useTheme();
  const lifted = focused || value.length > 0;
  return (
    <div style={{ position: "relative" }}>
      <input type={type} value={value} onChange={(e) => onChange?.(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} disabled={disabled}
        style={{ width: "100%", padding: lifted ? "22px 44px 8px 14px" : "15px 44px 15px 14px", fontSize: 14, color: dark ? "#F9FAFB" : "#111827", background: dark ? "#374151" : disabled ? "#F9FAFB" : "#fff", border: `1.5px solid ${focused ? "#1D6AE5" : dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 10, outline: "none", boxSizing: "border-box", transition: "all 0.18s", fontFamily: "Inter, sans-serif" }} />
      <label style={{ position: "absolute", left: 14, top: lifted ? 8 : "50%", transform: lifted ? "none" : "translateY(-50%)", fontSize: lifted ? 11 : 14, fontWeight: lifted ? 500 : 400, color: focused ? "#1D6AE5" : dark ? "#6B7280" : "#9CA3AF", pointerEvents: "none", transition: "all 0.18s ease", fontFamily: "Inter, sans-serif" }}>{label}</label>
      {suffix && <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>{suffix}</div>}
    </div>
  );
}

function KebabMenu({ user, adderRole, onChangeRole, onResetPassword, onToggleStatus, onDelete }: {
  user: AppUser; adderRole: Role;
  onChangeRole: (r: Role) => void; onResetPassword: () => void; onToggleStatus: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const { dark } = useTheme();
  const menuBg = dark ? "#1F2937" : "#fff";
  const border = dark ? "#374151" : "#E5E7EB";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const hoverBg = dark ? "#374151" : "#F9FAFB";

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) {
      const t = e.target as Element;
      if (!t.closest("[data-kebab-menu]") && !btnRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  }

  const changeableRoles = getAddableRoles(adderRole);

  return (
    <div style={{ position: "relative" }}>
      <button ref={btnRef} onClick={handleToggle} style={{ background: "none", border: "none", cursor: "pointer", color: dark ? "#6B7280" : "#9CA3AF", display: "flex", padding: 4, borderRadius: 6 }}>
        <MoreVertical size={15} />
      </button>
      {open && (
        <div data-kebab-menu style={{ position: "fixed", top: menuPos.top, right: menuPos.right, background: menuBg, border: `1px solid ${border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 9999, minWidth: 180, overflow: "hidden" }}>
          <div style={{ padding: "6px 0" }}>
            {changeableRoles.length > 0 && (
              <>
                <div style={{ padding: "4px 12px", fontSize: 10, fontWeight: 700, color: dark ? "#4B5563" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>Change Role</div>
                {changeableRoles.map((r) => (
                  <div key={r} onClick={() => { onChangeRole(r); setOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, color: user.role === r ? "#1D6AE5" : textMain, fontWeight: user.role === r ? 600 : 400 }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = hoverBg)}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}>
                    {user.role === r ? <Check size={13} color="#1D6AE5" /> : <span style={{ width: 13 }} />} {r}
                  </div>
                ))}
                <div style={{ height: 1, background: border, margin: "4px 0" }} />
              </>
            )}
            <div onClick={() => { onResetPassword(); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, color: textMain }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = hoverBg)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}>
              <Mail size={13} /> Reset Password
            </div>
            <div onClick={() => { onToggleStatus(); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, color: textMain }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = hoverBg)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}>
              <Shield size={13} /> {user.status === "Active" ? "Deactivate" : "Activate"}
            </div>
            <div style={{ height: 1, background: border, margin: "4px 0" }} />
            <div onClick={() => { onDelete(); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "#EF4444" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = dark ? "#374151" : "#FEF2F2")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}>
              <X size={13} /> Delete User
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReceiptModal({ user, password, onClose }: { user: AppUser; password: string; onClose: () => void }) {
  const { dark } = useTheme();
  const [copied, setCopied] = useState(false);
  const now = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const rowBg = dark ? "#374151" : "#F8F9FA";

  function copyAll() {
    const text = `ViraTrak New User\n---\nName: ${getFullName(user)}\nEmail: ${user.email}\nRole: ${user.role}\nTemp Password: ${password}\nCreated: ${now}\n---\nUser must change password on first login.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal title="User Created" onClose={onClose} width={400}>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Receipt header */}
        <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: `2px dashed ${dark ? "#374151" : "#E5E7EB"}`, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EBF2FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <Check size={22} color="#1D6AE5" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: textMain }}>Account Created</div>
          <div style={{ fontSize: 12, color: textSub, marginTop: 2 }}>{now}</div>
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {[
            ["Full Name", getFullName(user)],
            ["Email", user.email],
            ["Role", user.role],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: rowBg, borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: textSub }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: textMain }}>{val}</span>
            </div>
          ))}
          <div style={{ padding: "10px 12px", background: dark ? "#1a3a5c" : "#EBF2FF", borderRadius: 8, border: `1px solid ${dark ? "#2563EB" : "#BFDBFE"}` }}>
            <div style={{ fontSize: 11, color: dark ? "#93C5FD" : "#1D6AE5", marginBottom: 4 }}>Temporary Password</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: dark ? "#F9FAFB" : "#111827", fontFamily: "monospace", letterSpacing: "0.06em" }}>{password}</div>
          </div>
        </div>

        <div style={{ borderTop: `2px dashed ${dark ? "#374151" : "#E5E7EB"}`, paddingTop: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#F59E0B", background: "#FFF7ED", padding: "8px 12px", borderRadius: 8, lineHeight: 1.5 }}>
            ⚠ User will be prompted to change this password on first login. Share securely.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={copyAll} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px", background: "transparent", border: `1px solid ${dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 8, fontSize: 13, color: dark ? "#9CA3AF" : "#6B7280", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Details</>}
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "#1D6AE5", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Done</button>
        </div>
      </div>
    </Modal>
  );
}

export function UsersPage() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const { users, setUsers, currentUser, addUser, updateUser, removeUser } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [receipt, setReceipt] = useState<{ user: AppUser; password: string } | null>(null);
  const [resetReceipt, setResetReceipt] = useState<{ user: AppUser; password: string } | null>(null);
  const [newUser, setNewUser] = useState({ firstName: "", lastName: "", email: "", role: "Supervisor" as Role });
  const [showPass, setShowPass] = useState(false);
  const [generatedPass, setGeneratedPass] = useState("");
  const [addError, setAddError] = useState("");

  const bg = dark ? "#111827" : "#F4F5F7";
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";
  const rowHover = dark ? "#374151" : "#FAFAFA";
  const inputBg = dark ? "#374151" : "#F8F9FA";
  const thColor = dark ? "#6B7280" : "#9CA3AF";

  const myRole = currentUser?.role ?? "Supervisor";
  const canAdd = canManageUsers(myRole);
  const addableRoles = getAddableRoles(myRole);
  const filtered = users.filter((u) =>
    getFullName(u).toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    const pass = genTempPassword();
    setGeneratedPass(pass);
    setNewUser({ firstName: "", lastName: "", email: "", role: addableRoles[addableRoles.length - 1] ?? "Supervisor" });
    setAddError("");
    setShowAdd(true);
  }

  function regeneratePass() { setGeneratedPass(genTempPassword()); }

  async function handleAdd() {
    if (!newUser.firstName.trim() || !newUser.lastName.trim()) { setAddError("First and last name are required."); return; }
    if (!newUser.email.trim()) { setAddError("Email is required."); return; }
    if (users.some((u) => u.email === newUser.email)) { setAddError("Email already exists."); return; }
    const user: AppUser = {
      id: Math.random().toString(36).slice(2, 10).toUpperCase(),
      firstName: newUser.firstName.trim(),
      lastName: newUser.lastName.trim(),
      email: newUser.email.trim(),
      role: newUser.role,
      status: "Active",
      lastLogin: "Never",
      password: generatedPass,
      mustChangePassword: true,
    };
    try {
      await addUser(user, generatedPass);
      setShowAdd(false);
      setReceipt({ user, password: generatedPass });
    } catch (e) {
      setAddError("Failed to save user. Please try again.");
    }
  }

  async function handleReset(u: AppUser) {
    const pass = genTempPassword();
    try {
      await updateUser(u.id, { password: pass, mustChangePassword: true });
      setResetReceipt({ user: { ...u, password: pass }, password: pass });
    } catch (e) {
      console.error("Reset failed", e);
    }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: bg, fontFamily: "Inter, sans-serif", transition: "background 0.2s" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "flex-end", justifyContent: "space-between", gap: isMobile ? 12 : 0, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: textMain, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>USERS</h1>
          <p style={{ fontSize: 13, color: textSub }}>Manage system user accounts and access roles</p>
        </div>
        {canAdd && (
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#1D6AE5", color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <Plus size={14} /> Add User
          </button>
        )}
      </div>

      {/* Role info cards at top */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {roleInfo.map(({ role, icon: Icon, color, bg: ibg, desc }) => (
          <div key={role} style={{ background: cardBg, borderRadius: 12, padding: "14px 16px", boxShadow: shadow, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: ibg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: color, marginBottom: 4 }}>{role}</div>
              <div style={{ fontSize: 12, color: textSub, lineHeight: 1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: inputBg, border: `1px solid ${borderColor}`, borderRadius: 8, padding: "8px 12px", marginBottom: 16, width: isMobile ? "100%" : 280, boxSizing: "border-box" }}>
        <Search size={14} color={textSub} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: textMain, width: "100%", fontFamily: "Inter, sans-serif" }} />
      </div>

      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
              {["Name", "Email", "Role", "Status", "Last Login", ""].map((h, i) => (
                <th key={i} style={{ fontSize: 11, fontWeight: 600, color: thColor, textAlign: "left", padding: "10px 18px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${borderColor}` : "none", transition: "background 0.1s" }}
                onMouseEnter={(el) => ((el.currentTarget as HTMLTableRowElement).style.background = rowHover)}
                onMouseLeave={(el) => ((el.currentTarget as HTMLTableRowElement).style.background = "transparent")}>
                <td style={{ padding: "12px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1D6AE5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {(u.firstName[0] ?? "") + (u.lastName[0] ?? "")}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: textMain, fontWeight: 500 }}>{getFullName(u)}</div>
                      {u.mustChangePassword && <div style={{ fontSize: 10, color: "#F59E0B", fontWeight: 500 }}>Temp password active</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 18px", fontSize: 13, color: textSub }}>{u.email}</td>
                <td style={{ padding: "12px 18px" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: roleColors[u.role].bg, color: roleColors[u.role].color }}>{u.role}</span>
                </td>
                <td style={{ padding: "12px 18px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: u.status === "Active" ? "#10B981" : textSub }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: u.status === "Active" ? "#10B981" : "#9CA3AF", display: "inline-block" }} />
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: "12px 18px", fontSize: 13, color: textSub }}>{u.lastLogin}</td>
                <td style={{ padding: "12px 18px" }}>
                  {canAdd && u.role !== "Owner" && (
                    <KebabMenu
                      user={u}
                      adderRole={myRole}
                      onChangeRole={(role) => updateUser(u.id, { role }).catch(console.error)}
                      onResetPassword={() => handleReset(u)}
                      onToggleStatus={() => updateUser(u.id, { status: u.status === "Active" ? "Inactive" : "Active" }).catch(console.error)}
                      onDelete={() => removeUser(u.id).catch(console.error)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Add user modal */}
      {showAdd && (
        <Modal title="Add New User" onClose={() => setShowAdd(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <FloatField label="First Name" value={newUser.firstName} onChange={(v) => setNewUser((p) => ({ ...p, firstName: v }))} />
              <FloatField label="Last Name" value={newUser.lastName} onChange={(v) => setNewUser((p) => ({ ...p, lastName: v }))} />
            </div>
            <FloatField label="Email Address" type="email" value={newUser.email} onChange={(v) => setNewUser((p) => ({ ...p, email: v }))} />
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: dark ? "#9CA3AF" : "#6B7280", display: "block", marginBottom: 6 }}>Role</label>
              <div style={{ display: "flex", gap: 8 }}>
                {addableRoles.map((r) => (
                  <button key={r} onClick={() => setNewUser((p) => ({ ...p, role: r }))}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${newUser.role === r ? "#1D6AE5" : dark ? "#4B5563" : "#E5E7EB"}`, background: newUser.role === r ? "#EBF2FF" : "transparent", color: newUser.role === r ? "#1D6AE5" : dark ? "#9CA3AF" : "#6B7280", fontSize: 13, fontWeight: newUser.role === r ? 600 : 400, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: dark ? "#374151" : "#F8F9FA", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: dark ? "#9CA3AF" : "#6B7280" }}>Auto-Generated Password</span>
                <button onClick={regeneratePass} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#1D6AE5", fontFamily: "Inter, sans-serif" }}>
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <code style={{ flex: 1, fontSize: 15, fontWeight: 700, color: dark ? "#F9FAFB" : "#111827", fontFamily: "monospace", letterSpacing: "0.04em" }}>
                  {showPass ? generatedPass : "•".repeat(generatedPass.length)}
                </code>
                <button onClick={() => setShowPass((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: dark ? "#9CA3AF" : "#6B7280", display: "flex", padding: 4 }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "#F59E0B", marginTop: 5 }}>User must change this on first login.</div>
            </div>

            {addError && <div style={{ fontSize: 13, color: "#EF4444", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>{addError}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: `1px solid ${dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 8, fontSize: 13, color: dark ? "#9CA3AF" : "#6B7280", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
              <button onClick={handleAdd} style={{ flex: 1, padding: "11px", background: "#1D6AE5", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Add User</button>
            </div>
          </div>
        </Modal>
      )}

      {receipt && <ReceiptModal user={receipt.user} password={receipt.password} onClose={() => setReceipt(null)} />}
      {resetReceipt && <ReceiptModal user={resetReceipt.user} password={resetReceipt.password} onClose={() => setResetReceipt(null)} />}
    </div>
  );
}
