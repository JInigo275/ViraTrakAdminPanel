import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { Search, Plus, MoreVertical, Trash2, X, Check, BarChart2, Contact } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";
import { useApp, Driver, genDriverId } from "../context/AppContext";
import { formatName, formatPhone, formatPlate, validateName, validatePhone, validatePlate } from "../../utils/validation";

interface DriversPageProps {
  onViewDetail?: (driverId: string) => void;
}

function Modal({ title, onClose, children, width }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  const { dark } = useTheme();
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: dark ? "#1F2937" : "#fff", borderRadius: 14, width: "100%", maxWidth: width ?? 460, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${dark ? "#374151" : "#F3F4F6"}` }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: dark ? "#F9FAFB" : "#111827" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: dark ? "#6B7280" : "#9CA3AF", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function FloatField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  const [focused, setFocused] = useState(false);
  const { dark } = useTheme();
  const lifted = focused || value.length > 0;
  return (
    <div style={{ position: "relative" }}>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: lifted ? "22px 14px 8px" : "15px 14px", fontSize: 15, color: dark ? "#F9FAFB" : "#111827", background: dark ? "#374151" : "#fff", border: `1.5px solid ${focused ? "#1D6AE5" : dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 10, outline: "none", boxSizing: "border-box", transition: "all 0.18s", fontFamily: "Inter, sans-serif" }} />
      <label style={{ position: "absolute", left: 14, top: lifted ? 8 : "50%", transform: lifted ? "none" : "translateY(-50%)", fontSize: lifted ? 12 : 15, fontWeight: lifted ? 500 : 400, color: focused ? "#1D6AE5" : dark ? "#6B7280" : "#9CA3AF", pointerEvents: "none", transition: "all 0.18s ease", fontFamily: "Inter, sans-serif" }}>{label}</label>
    </div>
  );
}

function KebabMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { dark } = useTheme();
  const menuBg = dark ? "#1F2937" : "#fff";
  const border = dark ? "#374151" : "#E5E7EB";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const hoverBg = dark ? "#374151" : "#F9FAFB";

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: dark ? "#6B7280" : "#9CA3AF", display: "flex", padding: 4, borderRadius: 6 }}>
        <MoreVertical size={15} />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: menuBg, border: `1px solid ${border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 50, minWidth: 140, overflow: "hidden" }}>
          <div style={{ padding: "4px 0" }}>
            <div onClick={() => { onEdit(); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", cursor: "pointer", fontSize: 14, color: textMain }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = hoverBg)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}>Edit Driver</div>
            <div style={{ height: 1, background: border }} />
            <div onClick={() => { onDelete(); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", cursor: "pointer", fontSize: 14, color: "#EF4444" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = dark ? "#374151" : "#FEF2F2")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}>Delete</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReceiptModal({ driver, onClose }: { driver: Driver; onClose: () => void }) {
  const { dark } = useTheme();
  const now = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const rowBg = dark ? "#374151" : "#F8F9FA";
  const fullName = `${driver.firstName} ${driver.lastName}`;

  return (
    <Modal title="Driver Added" onClose={onClose} width={380}>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: `2px dashed ${dark ? "#374151" : "#E5E7EB"}`, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <Check size={22} color="#10B981" />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: textMain }}>Driver Registered</div>
          <div style={{ fontSize: 13, color: textSub, marginTop: 2 }}>{now}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                 {[["Full Name", fullName], ["Driver ID", driver.id], ["Vehicle", driver.vehicle], ["Contact", driver.contact]].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: rowBg, borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: textSub }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: label === "Driver ID" ? "#1D6AE5" : textMain, fontFamily: label === "Driver ID" ? "monospace" : "inherit" }}>{val}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `2px dashed ${dark ? "#374151" : "#E5E7EB"}`, paddingTop: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#10B981", background: "#ECFDF5", padding: "8px 12px", borderRadius: 8 }}>
            ✓ Driver ID auto-generated.
          </div>
        </div>

        <button onClick={onClose} style={{ width: "100%", padding: "11px", background: "#10B981", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Done</button>
      </div>
    </Modal>
  );
}

const emptyForm = { firstName: "", lastName: "", vehicle: "", contact: "" };

export function DriversPage({ onViewDetail }: DriversPageProps) {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const { drivers, addDriver, updateDriver, removeDriver } = useApp();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [editTarget, setEditTarget] = useState<Driver | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Driver | null>(null);

  const bg = dark ? "#111827" : "#F4F5F7";
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";
  const rowHover = dark ? "#374151" : "#FAFAFA";
  const inputBg = dark ? "#374151" : "#F8F9FA";
  const thColor = dark ? "#6B7280" : "#9CA3AF";
  const checkBorder = dark ? "#4B5563" : "#D1D5DB";

  const filtered = drivers.filter((e) =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    e.id.toLowerCase().includes(search.toLowerCase()) ||
    e.vehicle.toLowerCase().includes(search.toLowerCase())
  );

  const allChecked = filtered.length > 0 && filtered.every((e) => selected.has(e.id));
  const someChecked = filtered.some((e) => selected.has(e.id));

  function toggleAll() { if (allChecked) setSelected(new Set()); else setSelected(new Set(filtered.map((e) => e.id))); }
  function toggleOne(id: string) { setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); }

  function openAdd() { setForm(emptyForm); setFormError(""); setModal("add"); }
  function openEdit(e: Driver) {
    setEditTarget(e);
    setForm({ firstName: e.firstName, lastName: e.lastName, vehicle: e.vehicle, contact: e.contact });
    setFormError(""); setModal("edit");
  }

  async function handleSave() {
    const validationError = validateName(form.firstName, "First name") || validateName(form.lastName, "Last name") || validatePlate(form.vehicle) || validatePhone(form.contact);
    if (validationError) { setFormError(validationError); return; }
    const normalized = { firstName: formatName(form.firstName), lastName: formatName(form.lastName), vehicle: formatPlate(form.vehicle), contact: formatPhone(form.contact) };

    if (modal === "add") {
      const newDriver: Driver = { id: genDriverId(drivers), ...normalized };
      try {
        await addDriver(newDriver);
        setModal(null);
        setReceipt(newDriver);
      } catch (e) {
        setFormError("Failed to save. Please try again.");
      }
    } else if (modal === "edit" && editTarget) {
      try {
        await updateDriver(editTarget.id, normalized);
        setModal(null);
      } catch (e) {
        setFormError("Failed to save. Please try again.");
      }
    }
  }

  async function deleteOne(id: string) {
    try { await removeDriver(id); } catch (e) { console.error(e); }
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setConfirmDelete(null);
  }
  async function massDelete() {
    await Promise.all([...selected].map((id) => removeDriver(id).catch(console.error)));
    setSelected(new Set());
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: bg, fontFamily: "Inter, sans-serif", transition: "background 0.2s" }}>
      <PageHeader icon={Contact} iconColor="#10B981" title="Driver Information" subtitle="Driver profiles and vehicle assignments">
        {selected.size > 0 && (
          <button onClick={massDelete} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#FEF2F2", color: "#EF4444", borderRadius: 8, border: "1px solid #FECACA", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <Trash2 size={14} /> Delete {selected.size} Selected
          </button>
        )}
        <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#10B981", color: "#fff", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          <Plus size={14} /> Add Driver
        </button>
      </PageHeader>

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: inputBg, border: `1px solid ${borderColor}`, borderRadius: 8, padding: "8px 12px", marginBottom: 16, width: isMobile ? "100%" : 280, boxSizing: "border-box" }}>
        <Search size={14} color={textSub} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search drivers..." style={{ background: "transparent", border: "none", outline: "none", fontSize: 14, color: textMain, width: "100%", fontFamily: "Inter, sans-serif" }} />
      </div>

      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
              <th style={{ padding: "10px 16px", width: 40 }}>
                <div onClick={toggleAll} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${allChecked ? "#1D6AE5" : checkBorder}`, background: allChecked ? "#1D6AE5" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {allChecked && <Check size={10} color="#fff" />}
                  {!allChecked && someChecked && <div style={{ width: 8, height: 2, background: "#1D6AE5", borderRadius: 1 }} />}
                </div>
              </th>
              {["Driver Name", "Driver ID", "Vehicle", "Contact", "Actions"].map((h, i) => (
                <th key={i} style={{ fontSize: 12, fontWeight: 600, color: thColor, textAlign: "left", padding: "10px 14px", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr key={e.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${borderColor}` : "none", transition: "background 0.1s", background: selected.has(e.id) ? (dark ? "#1e3a5f" : "#EBF2FF") : "transparent" }}
                onMouseEnter={(el) => { if (!selected.has(e.id)) (el.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                onMouseLeave={(el) => { if (!selected.has(e.id)) (el.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                <td style={{ padding: "11px 16px" }}>
                  <div onClick={() => toggleOne(e.id)} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${selected.has(e.id) ? "#1D6AE5" : checkBorder}`, background: selected.has(e.id) ? "#1D6AE5" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {selected.has(e.id) && <Check size={10} color="#fff" />}
                  </div>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1D6AE5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {(e.firstName[0] ?? "") + (e.lastName[0] ?? "")}
                    </div>
                    <span style={{ fontSize: 14, color: textMain, fontWeight: 500 }}>{e.firstName} {e.lastName}</span>
                  </div>
                </td>
                <td style={{ padding: "11px 14px", fontSize: 13, color: "#1D6AE5", fontFamily: "monospace", fontWeight: 600 }}>{e.id}</td>
                <td style={{ padding: "11px 14px", fontSize: 14, color: textMain, fontWeight: 500 }}>{e.vehicle}</td>
                <td style={{ padding: "11px 14px", fontSize: 13, color: textSub }}>{e.contact}</td>
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {onViewDetail && (
                      <button onClick={() => onViewDetail(e.id)}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#EBF2FF", color: "#1D6AE5", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
                        <BarChart2 size={12} /> View
                      </button>
                    )}
                    <KebabMenu onEdit={() => openEdit(e)} onDelete={() => setConfirmDelete(e.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal === "add" ? "Add Driver" : "Edit Driver"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {modal === "add" && (
              <div style={{ padding: "8px 12px", background: dark ? "#374151" : "#F0F9FF", borderRadius: 8, fontSize: 13, color: dark ? "#93C5FD" : "#0369A1" }}>
                Driver ID is auto-generated.
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <FloatField label="Driver First Name" value={form.firstName} onChange={(v) => setForm((p) => ({ ...p, firstName: v }))} />
              <FloatField label="Driver Last Name" value={form.lastName} onChange={(v) => setForm((p) => ({ ...p, lastName: v }))} />
            </div>
            <FloatField label="Vehicle (e.g. TRK110)" value={form.vehicle} onChange={(v) => setForm((p) => ({ ...p, vehicle: formatPlate(v) }))} />
            <FloatField label="Contact Number" value={form.contact} onChange={(v) => setForm((p) => ({ ...p, contact: formatPhone(v) }))} />
            {formError && <div style={{ fontSize: 14, color: "#EF4444", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>{formError}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: `1px solid ${dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 8, fontSize: 14, color: dark ? "#9CA3AF" : "#6B7280", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
              <button onClick={handleSave} style={{ flex: 1, padding: "11px", background: "#1D6AE5", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>{modal === "add" ? "Add Driver" : "Save Changes"}</button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete Driver" onClose={() => setConfirmDelete(null)}>
          <p style={{ fontSize: 15, color: dark ? "#D1D5DB" : "#374151", lineHeight: 1.6, marginBottom: 20 }}>
            Are you sure you want to delete <strong>{drivers.find((e) => e.id === confirmDelete)?.firstName} {drivers.find((e) => e.id === confirmDelete)?.lastName}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: `1px solid ${dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 8, fontSize: 14, color: dark ? "#9CA3AF" : "#6B7280", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
            <button onClick={() => deleteOne(confirmDelete)} style={{ flex: 1, padding: "11px", background: "#EF4444", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Delete</button>
          </div>
        </Modal>
      )}

      {receipt && <ReceiptModal driver={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
