import { useState } from "react";
import { Check, ChevronDown, Edit3, Plus, Search, Trash2, Truck, UserRound, X } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useIsMobile } from "../hooks/useIsMobile";
import { useTheme } from "../context/ThemeContext";
import { useApp, Vehicle } from "../context/AppContext";
import { formatPlate, validatePlate } from "../../utils/validation";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { dark } = useTheme();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 460, background: dark ? "#1F2937" : "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${dark ? "#374151" : "#E5E7EB"}` }}>
          <strong style={{ color: dark ? "#F9FAFB" : "#111827", fontSize: 17 }}>{title}</strong>
          <button onClick={onClose} aria-label="Close" style={{ border: 0, background: "transparent", color: dark ? "#9CA3AF" : "#6B7280", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

export function VehiclesPage() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const { vehicles, drivers, addVehicle, updateVehicle, removeVehicle } = useApp();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [driverIds, setDriverIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const bg = dark ? "#111827" : "#F4F5F7";
  const card = dark ? "#1F2937" : "#fff";
  const text = dark ? "#F9FAFB" : "#111827";
  const muted = dark ? "#9CA3AF" : "#6B7280";
  const border = dark ? "#374151" : "#E5E7EB";
  const rowHover = dark ? "#374151" : "#FAFAFA";
  const inputBg = dark ? "#374151" : "#F8F9FA";
  const thColor = dark ? "#6B7280" : "#9CA3AF";
  const checkBorder = dark ? "#4B5563" : "#D1D5DB";
  const filtered = vehicles.filter((vehicle) => `${vehicle.plateNumber} ${vehicle.model} ${vehicle.driverIds.map((id) => drivers.find((driver) => driver.id === id)?.firstName ?? "").join(" ")} ${vehicle.driverIds.map((id) => drivers.find((driver) => driver.id === id)?.lastName ?? "").join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const allChecked = filtered.length > 0 && filtered.every((vehicle) => selectedIds.has(vehicle.id));
  const someChecked = filtered.some((vehicle) => selectedIds.has(vehicle.id));

  function availableDriversForSlot(index: number) {
    const selectedInOtherSlot = new Set(driverIds.filter((_, selectedIndex) => selectedIndex !== index));
    return drivers.filter((driver) => {
      if (selectedInOtherSlot.has(driver.id)) return false;
      if (driverIds[index] === driver.id) return true;
      return !vehicles.some((vehicle) => vehicle.id !== editing?.id && vehicle.driverIds.includes(driver.id));
    });
  }

  function openAdd() {
    setEditing(null); setPlate(""); setModel(""); setDriverIds([]); setError(""); setModal("add");
  }

  function openEdit(vehicle: Vehicle) {
    setEditing(vehicle); setPlate(vehicle.plateNumber); setModel(vehicle.model); setDriverIds(vehicle.driverIds); setError(""); setModal("edit");
  }

  async function save() {
    const plateError = validatePlate(plate);
    if (plateError) { setError(plateError); return; }
    if (driverIds.length > 2) { setError("A vehicle can have up to two drivers."); return; }
    if (new Set(driverIds).size !== driverIds.length) { setError("Select two different drivers."); return; }
    setSaving(true); setError("");
    try {
      const patch = { plateNumber: formatPlate(plate), model: model.trim(), driverIds };
      if (editing) await updateVehicle(editing.id, patch);
      else await addVehicle(patch);
      setModal(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save vehicle.");
    } finally { setSaving(false); }
  }

  async function unassign(vehicle: Vehicle) {
    try { await updateVehicle(vehicle.id, { driverIds: [] }); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Could not unassign vehicle."); }
  }

  async function massDelete() {
    await Promise.all([...selectedIds].map((id) => removeVehicle(id).catch((deleteError) => setError(deleteError instanceof Error ? deleteError.message : "Could not delete vehicle."))));
    setSelectedIds(new Set());
  }

  function driverName(ids: string[]) {
    if (ids.length === 0) return "Unassigned";
    return ids.map((id) => {
      const driver = drivers.find((item) => item.id === id);
      return driver ? `${driver.firstName} ${driver.lastName}` : "Unknown driver";
    }).join(" / ");
  }

  function toggleSelected(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(allChecked ? new Set() : new Set(filtered.map((vehicle) => vehicle.id)));
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: bg, fontFamily: "Inter, sans-serif" }}>
      {/* ============================================================ */}
      {/* Vehicle page header and management actions */}
      {/* ============================================================ */}
      <PageHeader icon={Truck} iconColor="#1D6AE5" title="Vehicle Information" subtitle="Vehicle profiles and driver assignments" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {/* ============================================================ */}
        {/* Vehicle search, bulk actions, and create action */}
        {/* ============================================================ */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: inputBg, border: `1.5px solid ${dark ? "#6B7280" : "#D1D5DB"}`, borderRadius: 8, padding: "8px 12px", width: isMobile ? "100%" : 320, boxSizing: "border-box", boxShadow: dark ? "0 0 0 1px rgba(156,163,175,.12)" : "0 1px 3px rgba(15,23,42,.06)" }}>
          <Search size={15} color={dark ? "#D1D5DB" : "#6B7280"} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vehicles..." style={{ background: "transparent", border: "none", outline: "none", fontSize: 14, color: text, width: "100%", fontFamily: "Inter, sans-serif" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: isMobile ? 0 : "auto", width: isMobile ? "100%" : "auto" }}>
          {selectedIds.size > 0 && (
            <button onClick={() => void massDelete()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 14px", background: "#FEF2F2", color: "#EF4444", borderRadius: 8, border: "1px solid #FECACA", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif", flex: isMobile ? 1 : undefined }}>
              <Trash2 size={14} /> Delete {selectedIds.size} Selected
            </button>
          )}
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 14px", background: "#1D6AE5", color: "#fff", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif", flex: isMobile ? 1 : undefined }}>
            <Plus size={14} /> Add Vehicle
          </button>
        </div>
      </div>

      {error && !modal && <div style={{ marginBottom: 14, padding: "10px 12px", color: "#B91C1C", background: dark ? "#451A1A" : "#FEF2F2", borderRadius: 8, fontSize: 14 }}>{error}</div>}

      <div style={{ background: card, borderRadius: 12, boxShadow: dark ? "0 1px 4px rgba(0,0,0,.3)" : "0 1px 4px rgba(0,0,0,.07)", overflow: "hidden" }}>
        {/* ============================================================ */}
        {/* Vehicle directory table */}
        {/* ============================================================ */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                <th style={{ padding: "10px 16px", width: 40 }}>
                  <div onClick={toggleSelectAll} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${allChecked ? "#1D6AE5" : checkBorder}`, background: allChecked ? "#1D6AE5" : "transparent", cursor: filtered.length ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {allChecked && <Check size={10} color="#fff" />}
                    {!allChecked && someChecked && <div style={{ width: 8, height: 2, background: "#1D6AE5", borderRadius: 1 }} />}
                  </div>
                </th>
                {["Vehicle", "Model", "Assigned Drivers", "Actions"].map((heading) => <th key={heading} style={{ fontSize: 12, fontWeight: 600, color: thColor, textAlign: "left", padding: "10px 14px", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={5} style={{ padding: 36, textAlign: "center", color: muted }}>No vehicles match your search.</td></tr> : filtered.map((vehicle, index) => {
                const isSelected = selectedIds.has(vehicle.id);
                return <tr key={vehicle.id} style={{ borderBottom: index < filtered.length - 1 ? `1px solid ${border}` : "none", transition: "background .1s", background: isSelected ? (dark ? "#1e3a5f" : "#EBF2FF") : "transparent", cursor: "pointer" }} onClick={() => toggleSelected(vehicle.id)} onMouseEnter={(event) => { if (!isSelected) event.currentTarget.style.background = rowHover; }} onMouseLeave={(event) => { if (!isSelected) event.currentTarget.style.background = "transparent"; }}>
                  <td style={{ padding: "11px 16px" }}><div onClick={(event) => { event.stopPropagation(); toggleSelected(vehicle.id); }} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${isSelected ? "#1D6AE5" : checkBorder}`, background: isSelected ? "#1D6AE5" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{isSelected && <Check size={10} color="#fff" />}</div></td>
                  <td style={{ padding: "11px 14px" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 30, height: 30, borderRadius: 8, background: dark ? "#243B63" : "#EBF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#1D6AE5", flexShrink: 0 }}><Truck size={15} /></div><span style={{ fontSize: 14, color: text, fontWeight: 500 }}>{vehicle.plateNumber}</span></div></td>
                  <td style={{ padding: "11px 14px", fontSize: 14, color: muted }}>{vehicle.model || "Model not specified"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 14, color: vehicle.driverIds.length ? text : muted, fontWeight: 500 }}><div style={{ display: "flex", alignItems: "center", gap: 7 }}><UserRound size={14} color={vehicle.driverIds.length ? "#10B981" : muted} />{driverName(vehicle.driverIds)}</div></td>
                  <td style={{ width: 190, padding: "11px 14px" }}><div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 162 }}><button onClick={(event) => { event.stopPropagation(); openEdit(vehicle); }} aria-label={`Edit ${vehicle.plateNumber}`} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#EBF2FF", color: "#1D6AE5", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}><Edit3 size={12} /> Edit</button>{vehicle.driverIds.length > 0 ? <button onClick={(event) => { event.stopPropagation(); void unassign(vehicle); }} style={{ padding: "5px 10px", background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>Remove driver</button> : <button onClick={(event) => { event.stopPropagation(); openEdit(vehicle); }} style={{ padding: "5px 10px", background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>Select driver</button>}</div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <Modal title={modal === "add" ? "Add truck vehicle" : "Edit truck vehicle"} onClose={() => setModal(null)}>
        <div style={{ display: "grid", gap: 14 }}>
          <label style={{ color: text, fontSize: 13, fontWeight: 600 }}>Plate number<input value={plate} maxLength={8} onChange={(event) => setPlate(formatPlate(event.target.value))} placeholder="e.g. TRK1024" style={{ display: "block", width: "100%", marginTop: 6, padding: "11px 12px", border: `1px solid ${border}`, borderRadius: 8, background: dark ? "#374151" : "#fff", color: text, textTransform: "uppercase" }} /></label>
          <label style={{ color: text, fontSize: 13, fontWeight: 600 }}>Truck model<input value={model} onChange={(event) => setModel(event.target.value)} placeholder="e.g. Volvo FH" style={{ display: "block", width: "100%", marginTop: 6, padding: "11px 12px", border: `1px solid ${border}`, borderRadius: 8, background: dark ? "#374151" : "#fff", color: text }} /></label>
          <div>
            <label style={{ color: text, fontSize: 13, fontWeight: 600 }}>Designated drivers <span style={{ color: muted, fontWeight: 400 }}>(up to 2)</span></label>
            <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
              {[0, 1].map((index) => {
                const availableDrivers = availableDriversForSlot(index);
                const hasCurrentDriver = Boolean(driverIds[index]);
                const noDriversAvailable = availableDrivers.length === 0 && !hasCurrentDriver;
                return (
                  <div key={index} style={{ position: "relative" }}>
                    <select
                      value={driverIds[index] ?? ""}
                      disabled={noDriversAvailable}
                      onChange={(event) => setDriverIds((current) => { const next = [...current]; if (event.target.value) next[index] = event.target.value; else next.splice(index, 1); return next.filter(Boolean); })}
                      style={{ width: "100%", padding: "11px 38px 11px 12px", border: `1px solid ${noDriversAvailable ? (dark ? "#4B5563" : "#D1D5DB") : border}`, borderRadius: 8, background: noDriversAvailable ? (dark ? "#374151" : "#F3F4F6") : (dark ? "#374151" : "#fff"), color: noDriversAvailable ? (dark ? "#6B7280" : "#9CA3AF") : text, appearance: "none", cursor: noDriversAvailable ? "not-allowed" : "pointer" }}
                    >
                      <option value="">{noDriversAvailable ? "No Drivers Available" : index === 0 ? "Select a driver" : "Second driver (optional)"}</option>
                      {availableDrivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.firstName} {driver.lastName}</option>)}
                    </select>
                    <ChevronDown size={16} color={noDriversAvailable ? (dark ? "#6B7280" : "#9CA3AF") : muted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>
                );
              })}
            </div>
          </div>
          {error && <div style={{ color: "#EF4444", fontSize: 13 }}>{error}</div>}
          <button onClick={() => void save()} disabled={saving} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 7, border: 0, borderRadius: 8, padding: "11px 14px", background: saving ? "#93C5FD" : "#1D6AE5", color: "#fff", fontWeight: 600, cursor: saving ? "wait" : "pointer" }}>{saving ? "Saving..." : <><Check size={16} /> Save vehicle</>}</button>
        </div>
      </Modal>}
    </div>
  );
}
