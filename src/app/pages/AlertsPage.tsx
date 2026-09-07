import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { Wind, EyeOff, Zap, User, Navigation, Download, X, Filter, Check, ChevronDown, ChevronUp, Bell } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFPreviewModal } from "../components/PDFPreviewModal";
import { alertsApi, DbAlert } from "../../api/viratrak";

// ============================================================
// Map alert type → icon component
// ============================================================



// ============================================================
// Helpers and filters
// ============================================================
// ============================================================
// Edit alert-type icons and labels here.
// ============================================================
const typeIconMap: Record<string, React.ElementType> = {
  "Yawning":      Wind,
  "Eyes Closed":  EyeOff,
  "Head Pose":    Zap,
  "Body Posture": User,
  "Micro Sleep":  Navigation,
  "Blink Rate":   Navigation,
};

type AlertRow = DbAlert & { icon: React.ElementType };

function dbToRow(a: DbAlert): AlertRow {
  return { ...a, icon: typeIconMap[a.type] ?? Zap };
}

const sevStyle: Record<string, { bg: string; color: string }> = {
  High:     { bg: "#FEF2F2", color: "#EF4444" },
  Moderate: { bg: "#FFF7ED", color: "#F59E0B" },
  Low:      { bg: "#ECFDF5", color: "#10B981" },
};

const PAGE_OPTIONS = [5, 10, 25, 50, "All"] as const;
type PageOption = typeof PAGE_OPTIONS[number];

function SearchDropdown({ label, value, onChange, options, openKey, activeKey, setActiveKey, dark }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; openKey: string; activeKey: string | null; setActiveKey: (k: string | null) => void; dark: boolean;
}) {
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const open = activeKey === openKey;

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { if (open) setActiveKey(null); } }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  const border = dark ? "#374151" : "#E5E7EB";
  const bg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const hoverBg = dark ? "#374151" : "#F9FAFB";
  const activeBorder = value ? "#1D6AE5" : border;
  const activeBg = value ? "#EBF2FF" : (dark ? "#1F2937" : "#fff");

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 150 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: activeBg, border: `1px solid ${activeBorder}`, borderRadius: 8, cursor: "text" }}>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(""); }}
          onFocus={() => setActiveKey(openKey)}
          placeholder={label}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: value ? "#1D6AE5" : textSub, fontFamily: "Inter, sans-serif", minWidth: 0 }}
        />
        {value
          ? <X size={12} color="#1D6AE5" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => { onChange(""); setQuery(""); }} />
          : open ? <ChevronUp size={12} color={textSub} style={{ flexShrink: 0 }} /> : <ChevronDown size={12} color={textSub} style={{ flexShrink: 0 }} />
        }
      </div>
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: bg, border: `1px solid ${border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 200, maxHeight: 180, overflowY: "auto" }}>
          {filtered.map((opt) => (
            <div key={opt} onClick={() => { onChange(opt); setQuery(opt); setActiveKey(null); }}
              style={{ padding: "8px 12px", fontSize: 14, color: value === opt ? "#1D6AE5" : textMain, fontWeight: value === opt ? 600 : 400, cursor: "pointer" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = hoverBg)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SimpleDropdown({ label, value, onChange, options, openKey, activeKey, setActiveKey, dark }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; openKey: string; activeKey: string | null; setActiveKey: (k: string | null) => void; dark: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const open = activeKey === openKey;

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { if (open) setActiveKey(null); } }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const border = dark ? "#374151" : "#E5E7EB";
  const bg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const hoverBg = dark ? "#374151" : "#F9FAFB";

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 130 }}>
      <div onClick={() => setActiveKey(open ? null : openKey)}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: value ? "#EBF2FF" : (dark ? "#1F2937" : "#fff"), border: `1px solid ${value ? "#1D6AE5" : border}`, borderRadius: 8, cursor: "pointer", userSelect: "none" }}>
        <span style={{ flex: 1, fontSize: 13, color: value ? "#1D6AE5" : textSub }}>{value || label}</span>
        {value ? <X size={12} color="#1D6AE5" onClick={(e) => { e.stopPropagation(); onChange(""); }} /> : open ? <ChevronUp size={12} color={textSub} /> : <ChevronDown size={12} color={textSub} />}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: bg, border: `1px solid ${border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 200, overflow: "hidden" }}>
          {options.map((opt) => (
            <div key={opt} onClick={() => { onChange(opt); setActiveKey(null); }}
              style={{ padding: "8px 12px", fontSize: 14, color: value === opt ? "#1D6AE5" : textMain, fontWeight: value === opt ? 600 : 400, cursor: "pointer" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = hoverBg)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// End of region comment



// ============================================================
// Page logic and UI
// ============================================================
// ============================================================
// Alert filters, pagination, selection, and report exports.
// ============================================================
export function AlertsPage() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const [allAlerts, setAllAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterEvidence, setFilterEvidence] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [perPage, setPerPage] = useState<PageOption>(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showPerPageMenu, setShowPerPageMenu] = useState(false);
  const perPageRef = useRef<HTMLDivElement>(null);

  const bg = dark ? "#111827" : "#F4F5F7";
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";
  const rowHover = dark ? "#374151" : "#FAFAFA";
  const thColor = dark ? "#6B7280" : "#9CA3AF";
  const checkBorder = dark ? "#4B5563" : "#D1D5DB";
  const filterBg = dark ? "#374151" : "#F3F4F6";

  useEffect(() => {
    function h(e: MouseEvent) { if (perPageRef.current && !perPageRef.current.contains(e.target as Node)) setShowPerPageMenu(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    alertsApi.list()
      .then((rows) => setAllAlerts(rows.map(dbToRow)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const types = [...new Set(allAlerts.map((a) => a.type))].sort();
  const drivers = [...new Set(allAlerts.map((a) => a.driver))].sort();
  const vehicles = [...new Set(allAlerts.map((a) => a.vehicle))].sort();

  const activeFilters = [filterType, filterDriver, filterVehicle, filterDate, filterSeverity, filterEvidence].filter(Boolean).length;

  let filtered = allAlerts.filter((a) => {
    if (filterType && a.type !== filterType) return false;
    if (filterDriver && a.driver !== filterDriver) return false;
    if (filterVehicle && a.vehicle !== filterVehicle) return false;
    if (filterDate && a.date !== filterDate) return false;
    if (filterSeverity && a.severity !== filterSeverity) return false;
    if (filterEvidence === "Yes" && !a.evidence) return false;
    if (filterEvidence === "No" && a.evidence) return false;
    return true;
  });

  // ============================================================
  // Alphabetical sort by driver

  // ============================================================
  filtered = [...filtered].sort((a, b) => a.driver.localeCompare(b.driver));

  const totalPages = perPage === "All" ? 1 : Math.ceil(filtered.length / (perPage as number));
  const paginated = perPage === "All" ? filtered : filtered.slice(((page as number) - 1) * (perPage as number), (page as number) * (perPage as number));

  function clearFilters() { setFilterType(""); setFilterDriver(""); setFilterVehicle(""); setFilterDate(""); setFilterSeverity(""); setFilterEvidence(""); setPage(1); }

  function toggleOne(id: number) { setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); }
  function selectAll() { setSelected(new Set(paginated.map((a) => a.id))); }
  function deselectAll() { setSelected(new Set()); }
  const allChecked = paginated.length > 0 && paginated.every((a) => selected.has(a.id));
  const someChecked = paginated.some((a) => selected.has(a.id));

  const printData = selected.size > 0 ? filtered.filter((a) => selected.has(a.id)) : filtered;

  function buildPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("ViraTrak — Alerts & Evidence", 14, 16);
    doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`Exported: ${new Date().toLocaleString()} | Records: ${printData.length}${selected.size > 0 ? " (selected)" : ""}`, 14, 24);
    autoTable(doc, {
      startY: 30,
      head: [["Type", "Driver", "Vehicle", "Date", "Time", "Severity", "Evidence"]],
      body: printData.map((a) => [a.type, a.driver, a.vehicle, a.date, a.time, a.severity, a.evidence ? "Yes" : "No"]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [29, 106, 229] },
      margin: { left: 14, right: 14 },
    });
    return doc;
  }

  function exportExcel() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(printData.map((a) => ({ Type: a.type, Driver: a.driver, Vehicle: a.vehicle, Date: a.date, Time: a.time, Severity: a.severity, Evidence: a.evidence ? "Yes" : "No" }))), "Alerts");
    XLSX.writeFile(wb, `viratrak_alerts_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: bg, fontFamily: "Inter, sans-serif", transition: "background 0.2s" }}>
      {showPDFPreview && (
        <PDFPreviewModal
          title="Alerts & Evidence — PDF Preview"
          onClose={() => setShowPDFPreview(false)}
          onConfirm={() => buildPDF().save(`viratrak_alerts_${new Date().toISOString().slice(0,10)}.pdf`)}
          buildDoc={buildPDF}
        />
      )}

      <PageHeader icon={Bell} iconColor="#EF4444" title="Alerts & Evidence" subtitle="All detected driver behavior events and evidence">
        <button onClick={exportExcel} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#10B981", color: "#fff", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          <Download size={14} /> Excel
        </button>
        <button onClick={() => setShowPDFPreview(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#EF4444", color: "#fff", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          <Download size={14} /> PDF {selected.size > 0 && `(${selected.size})`}
        </button>
      </PageHeader>



{/* ============================================================ */}
      {/* Filter bar */}
      {/* ============================================================ */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setShowFilters((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: showFilters ? "#1D6AE5" : (dark ? "#374151" : "#fff"), color: showFilters ? "#fff" : textSub, border: `1px solid ${showFilters ? "#1D6AE5" : (dark ? "#4B5563" : "#E5E7EB")}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          <Filter size={13} /> Filters {activeFilters > 0 && `(${activeFilters})`}
        </button>
        {activeFilters > 0 && (
          <button onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "transparent", color: "#EF4444", border: "1px solid #FECACA", borderRadius: 8, fontSize: 14, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <X size={12} /> Clear All
          </button>
        )}
        <span style={{ fontSize: 13, color: textSub, marginLeft: 4 }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""} · Sorted A–Z by driver</span>



{/* ============================================================ */}
        {/* Per page */}
        {/* ============================================================ */}
        <div ref={perPageRef} style={{ position: "relative", marginLeft: "auto" }}>
          <div onClick={() => setShowPerPageMenu((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: dark ? "#374151" : "#fff", border: `1px solid ${dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 8, fontSize: 13, color: textSub, cursor: "pointer", userSelect: "none" }}>
            Show: {perPage} <ChevronDown size={11} color={textSub} />
          </div>
          {showPerPageMenu && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: dark ? "#1F2937" : "#fff", border: `1px solid ${dark ? "#374151" : "#E5E7EB"}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 200, overflow: "hidden", minWidth: 90 }}>
              {PAGE_OPTIONS.map((opt) => (
                <div key={String(opt)} onClick={() => { setPerPage(opt); setPage(1); setShowPerPageMenu(false); }}
                  style={{ padding: "8px 14px", fontSize: 14, color: perPage === opt ? "#1D6AE5" : textMain, fontWeight: perPage === opt ? 600 : 400, cursor: "pointer" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = dark ? "#374151" : "#F9FAFB")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}>
                  {String(opt)} rows
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, padding: "14px 18px", marginBottom: 12, border: `1px solid ${dark ? "#374151" : "#E5E7EB"}` }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <SearchDropdown label="Event Type"  value={filterType}      onChange={(v) => { setFilterType(v); setPage(1); }}      options={types}   openKey="type"      activeKey={activeFilter} setActiveKey={setActiveFilter} dark={dark} />
            <SearchDropdown label="Driver"       value={filterDriver}    onChange={(v) => { setFilterDriver(v); setPage(1); }}    options={drivers} openKey="driver"    activeKey={activeFilter} setActiveKey={setActiveFilter} dark={dark} />
            <SearchDropdown label="Vehicle"      value={filterVehicle}   onChange={(v) => { setFilterVehicle(v); setPage(1); }}   options={vehicles} openKey="vehicle"  activeKey={activeFilter} setActiveKey={setActiveFilter} dark={dark} />
            <div style={{ position: "relative" }}>
              <input type="date" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                style={{ padding: "7px 10px", background: filterDate ? "#EBF2FF" : (dark ? "#1F2937" : "#fff"), border: `1px solid ${filterDate ? "#1D6AE5" : (dark ? "#374151" : "#E5E7EB")}`, borderRadius: 8, fontSize: 13, color: filterDate ? "#1D6AE5" : textSub, outline: "none", fontFamily: "Inter, sans-serif", cursor: "pointer", boxSizing: "border-box" }} />
            </div>
            <SimpleDropdown label="Severity"  value={filterSeverity}  onChange={(v) => { setFilterSeverity(v); setPage(1); }}  options={["High", "Moderate", "Low"]}  openKey="severity"  activeKey={activeFilter} setActiveKey={setActiveFilter} dark={dark} />
            <SimpleDropdown label="Evidence" value={filterEvidence} onChange={(v) => { setFilterEvidence(v); setPage(1); }} options={["Yes", "No"]}                   openKey="evidence" activeKey={activeFilter} setActiveKey={setActiveFilter} dark={dark} />
          </div>
        </div>
      )}



{/* ============================================================ */}
      {/* Select all / deselect */}
      {/* ============================================================ */}
      {paginated.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={selectAll} style={{ fontSize: 13, color: "#1D6AE5", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", padding: 0 }}>Select All</button>
          <span style={{ color: dark ? "#4B5563" : "#D1D5DB" }}>·</span>
          <button onClick={deselectAll} style={{ fontSize: 13, color: textSub, background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", padding: 0 }}>Deselect All</button>
          {selected.size > 0 && <span style={{ fontSize: 13, color: textSub }}>{selected.size} selected for PDF</span>}
        </div>
      )}

      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
              <th style={{ padding: "10px 16px", width: 40 }}>
                <div onClick={allChecked ? deselectAll : selectAll}
                  style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${allChecked ? "#1D6AE5" : checkBorder}`, background: allChecked ? "#1D6AE5" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {allChecked && <Check size={10} color="#fff" />}
                  {!allChecked && someChecked && <div style={{ width: 8, height: 2, background: "#1D6AE5", borderRadius: 1 }} />}
                </div>
              </th>
              {["Type", "Driver", "Vehicle", "Date", "Time", "Severity", "Evidence"].map((h) => (
                <th key={h} style={{ fontSize: 12, fontWeight: 600, color: thColor, textAlign: "left", padding: "10px 14px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", fontSize: 15, color: textSub }}>Loading alerts…</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", fontSize: 15, color: textSub }}>No records match the selected filters.</td></tr>
            ) : paginated.map((e, i) => {
              const Icon = e.icon;
              const checked = selected.has(e.id);
              return (
                <tr key={e.id} style={{ borderBottom: i < paginated.length - 1 ? `1px solid ${borderColor}` : "none", transition: "background 0.1s", background: checked ? (dark ? "#1e3a5f" : "#EBF2FF") : "transparent", cursor: "pointer" }}
                  onMouseEnter={(el) => { if (!checked) (el.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                  onMouseLeave={(el) => { if (!checked) (el.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                  <td style={{ padding: "10px 16px" }} onClick={() => toggleOne(e.id)}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${checked ? "#1D6AE5" : checkBorder}`, background: checked ? "#1D6AE5" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {checked && <Check size={10} color="#fff" />}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: e.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={12} color={e.iconColor} /></div>
                      <span style={{ fontSize: 14, color: textMain, fontWeight: 500 }}>{e.type}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 14, color: textMain }}>{e.driver}</td>
                  <td style={{ padding: "10px 14px", fontSize: 14, color: textSub }}>{e.vehicle}</td>
                  <td style={{ padding: "10px 14px", fontSize: 14, color: textSub }}>{e.date}</td>
                  <td style={{ padding: "10px 14px", fontSize: 14, color: textSub, fontFamily: "monospace" }}>{e.time}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: sevStyle[e.severity].bg, color: sevStyle[e.severity].color }}>{e.severity}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {e.evidence
                      ? <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#1D6AE5", fontWeight: 500 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} /> View</span>
                      : <span style={{ fontSize: 13, color: textSub }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>



{/* ============================================================ */}
      {/* Pagination */}
      {/* ============================================================ */}
      {perPage !== "All" && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <span style={{ fontSize: 13, color: textSub }}>
            Page {page} of {totalPages} · {filtered.length} total records
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${dark ? "#374151" : "#E5E7EB"}`, background: "transparent", fontSize: 13, color: page === 1 ? (dark ? "#4B5563" : "#D1D5DB") : textMain, cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif" }}>
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width: 32, padding: "6px", borderRadius: 7, border: `1px solid ${p === page ? "#1D6AE5" : (dark ? "#374151" : "#E5E7EB")}`, background: p === page ? "#1D6AE5" : "transparent", fontSize: 13, color: p === page ? "#fff" : textMain, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${dark ? "#374151" : "#E5E7EB"}`, background: "transparent", fontSize: 13, color: page === totalPages ? (dark ? "#4B5563" : "#D1D5DB") : textMain, cursor: page === totalPages ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif" }}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// End of region comment
