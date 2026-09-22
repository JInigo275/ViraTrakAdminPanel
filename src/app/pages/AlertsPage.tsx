import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import { Wind, EyeOff, Zap, User, Navigation, Download, X, Filter, Check, ChevronDown, ChevronUp, Bell, Search } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFPreviewModal } from "../components/PDFPreviewModal";
import { EvidencePreviewModal } from "../components/EvidencePreviewModal";
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
  "Yawning": Wind,
  "Yawn": Wind,
  "Eyes Closed": EyeOff,
  "Head Gaze": Zap,
  "Head Pose": Navigation,
  "Body Tilt": User,
  "Posture": User,
};

type AlertRow = DbAlert & { icon: React.ElementType };

function dbToRow(a: DbAlert): AlertRow {
  return { ...a, icon: typeIconMap[a.type] ?? Zap };
}

const sevStyle: Record<string, { bg: string; color: string }> = {
  High: { bg: "#FEF2F2", color: "#EF4444" },
  Moderate: { bg: "#FFF7ED", color: "#F59E0B" },
  Low: { bg: "#ECFDF5", color: "#10B981" },
};

function SearchDropdown({ label, value, onChange, options, openKey, activeKey, setActiveKey, dark }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; openKey: string; activeKey: string | null; setActiveKey: (k: string | null) => void; dark: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const open = activeKey === openKey;
  const menuId = `search-dropdown-${openKey}`;
  const isMobile = useIsMobile();

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    if (!open || !ref.current) return;

    const updatePosition = () => {
      const rect = ref.current!.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const preferredWidth = isMobile ? Math.min(rect.width, Math.max(110, viewportWidth - 16)) : rect.width;
      const left = isMobile ? Math.min(Math.max(8, rect.left), Math.max(8, viewportWidth - preferredWidth - 8)) : rect.left;
      setMenuPos({ top: rect.bottom + 3, left, width: preferredWidth });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, isMobile]);

  useEffect(() => {
    function h(e: MouseEvent) {
      const target = e.target as Node;
      const menuEl = document.getElementById(menuId);
      const clickedInsideMenu = !!(menuEl && target && menuEl.contains(target));
      if (ref.current && !ref.current.contains(target) && !clickedInsideMenu && open) {
        setActiveKey(null);
      }
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, menuId, setActiveKey]);

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  const border = dark ? "#374151" : "#E5E7EB";
  const bg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const hoverBg = dark ? "#374151" : "#F9FAFB";
  const activeBorder = value ? "#1D6AE5" : border;
  const activeBg = value ? "#EBF2FF" : (dark ? "#1F2937" : "#fff");

  return (
    <div ref={ref} style={{ position: "relative", minWidth: isMobile ? 100 : 150, flex: 1, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: activeBg, border: `1.5px solid ${activeBorder}`, borderRadius: 8, cursor: "text", boxShadow: value ? "0 0 0 1px rgba(29,106,229,.12)" : "0 1px 3px rgba(15,23,42,.06)" }}>
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
      {open && filtered.length > 0 && createPortal(
        <div id={menuId} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, width: menuPos.width, background: bg, border: `1px solid ${border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 9999, maxHeight: 180, overflowY: "auto" }}>
          {filtered.map((opt) => (
            <div key={opt} onClick={() => { onChange(opt); setQuery(opt); setActiveKey(null); }}
              style={{ padding: "8px 12px", fontSize: 14, color: value === opt ? "#1D6AE5" : textMain, fontWeight: value === opt ? 600 : 400, cursor: "pointer" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = hoverBg)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}>
              {opt}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function SimpleDropdown({ label, value, onChange, options, openKey, activeKey, setActiveKey, dark }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; openKey: string; activeKey: string | null; setActiveKey: (k: string | null) => void; dark: boolean;
}) {
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const open = activeKey === openKey;
  const menuId = `simple-dropdown-${openKey}`;
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open || !ref.current) return;

    const updatePosition = () => {
      const rect = ref.current!.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const preferredWidth = isMobile ? Math.min(rect.width, Math.max(110, viewportWidth - 16)) : rect.width;
      const left = isMobile ? Math.min(Math.max(8, rect.left), Math.max(8, viewportWidth - preferredWidth - 8)) : rect.left;
      setMenuPos({ top: rect.bottom + 3, left, width: preferredWidth });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, isMobile]);

  useEffect(() => {
    function h(e: MouseEvent) {
      const target = e.target as Node;
      const menuEl = document.getElementById(menuId);
      const clickedInsideMenu = !!(menuEl && target && menuEl.contains(target));
      if (ref.current && !ref.current.contains(target) && !clickedInsideMenu && open) {
        setActiveKey(null);
      }
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, menuId, setActiveKey]);

  const border = dark ? "#374151" : "#E5E7EB";
  const bg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const hoverBg = dark ? "#374151" : "#F9FAFB";

  return (
    <div ref={ref} style={{ position: "relative", minWidth: isMobile ? 90 : 130, flex: 1, width: "100%" }}>
      <div onClick={() => setActiveKey(open ? null : openKey)}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: value ? "#EBF2FF" : (dark ? "#1F2937" : "#fff"), border: `1px solid ${value ? "#1D6AE5" : border}`, borderRadius: 8, cursor: "pointer", userSelect: "none" }}>
        <span style={{ flex: 1, fontSize: 13, color: value ? "#1D6AE5" : textSub }}>{value || label}</span>
        {value ? <X size={12} color="#1D6AE5" onClick={(e) => { e.stopPropagation(); onChange(""); }} /> : open ? <ChevronUp size={12} color={textSub} /> : <ChevronDown size={12} color={textSub} />}
      </div>
      {open && createPortal(
        <div id={menuId} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, width: menuPos.width, background: bg, border: `1px solid ${border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 9999, overflow: "hidden" }}>
          {options.map((opt) => (
            <div key={opt} onClick={() => { onChange(opt); setActiveKey(null); }}
              style={{ padding: "8px 12px", fontSize: 14, color: value === opt ? "#1D6AE5" : textMain, fontWeight: value === opt ? 600 : 400, cursor: "pointer" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = hoverBg)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}>
              {opt}
            </div>
          ))}
        </div>,
        document.body
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
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1280);
  const isCompactDesktop = !isMobile && viewportWidth < 1200;
  const [allAlerts, setAllAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showDeselectAll, setShowDeselectAll] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<AlertRow | null>(null);

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
    const updatePerPage = () => {
      const availableHeight = window.innerHeight - (isMobile ? 310 : 420);
      const rowHeight = isMobile ? 46 : 52;
      const nextPerPage = Math.max(5, Math.min(50, Math.floor(Math.max(availableHeight, 180) / rowHeight)));
      setPerPage((current) => (current === nextPerPage ? current : nextPerPage));
    };

    const updateViewport = () => setViewportWidth(window.innerWidth);

    updatePerPage();
    updateViewport();
    window.addEventListener("resize", updatePerPage);
    window.addEventListener("resize", updateViewport);
    return () => {
      window.removeEventListener("resize", updatePerPage);
      window.removeEventListener("resize", updateViewport);
    };
  }, [isMobile]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    alertsApi.list()
      .then((rows) => setAllAlerts(rows.map(dbToRow)))
      .catch((error) => {
        console.error(error);
        setLoadError(error instanceof Error ? error.message : "Unable to load alerts.");
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const types = [...new Set(allAlerts.map((a) => a.type))].sort();
  const drivers = [...new Set(allAlerts.map((a) => a.driver))].sort();
  const vehicles = [...new Set(allAlerts.map((a) => a.vehicle))].sort();

  const activeFilters = [filterType, filterDriver, filterVehicle, filterDate, filterSeverity].filter(Boolean).length;

  let filtered = allAlerts.filter((a) => {
    const searchText = search.trim().toLowerCase();
    if (searchText && !`${a.type} ${a.driver} ${a.vehicle} ${a.date} ${a.time} ${a.severity} ${a.evidence ? "yes" : "no"}`.toLowerCase().includes(searchText)) return false;
    if (filterType && a.type !== filterType) return false;
    if (filterDriver && a.driver !== filterDriver) return false;
    if (filterVehicle && a.vehicle !== filterVehicle) return false;
    if (filterDate && a.date !== filterDate) return false;
    if (filterSeverity && a.severity !== filterSeverity) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
  const mobileSummaryText = isMobile ? `${filtered.length} items` : `${filtered.length} records · Sorted newest first`;
  const compactMobile = isMobile;

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / Math.max(1, perPage)));
    setPage((current) => Math.min(current, maxPage));
  }, [filtered.length, perPage]);

  const visibleRows = filtered;

  function clearFilters() { setFilterType(""); setFilterDriver(""); setFilterVehicle(""); setFilterDate(""); setFilterSeverity(""); setPage(1); }

  function toggleOne(id: number) { setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); }
  function selectAll() { setSelected(new Set(visibleRows.map((a) => a.id))); setShowDeselectAll(true); }
  function deselectAll() { setSelected(new Set()); setShowDeselectAll(false); }
  const allChecked = visibleRows.length > 0 && visibleRows.every((a) => selected.has(a.id));
  const someChecked = visibleRows.some((a) => selected.has(a.id));

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
    XLSX.writeFile(wb, `viratrak_alerts_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const tableHeaders = isMobile ? ["Type", "Driver", "Vehicle", "Date/Time", "Severity", "View"] : ["Type", "Driver", "Vehicle", "Date", "Time", "Severity", "Evidence"];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", minHeight: 0, overflow: "hidden", padding: isMobile ? 16 : 24, background: bg, fontFamily: "Inter, sans-serif", transition: "background 0.2s" }}>
      {showPDFPreview && (
        <PDFPreviewModal
          title="Alerts & Evidence — PDF Preview"
          onClose={() => setShowPDFPreview(false)}
          onConfirm={() => buildPDF().save(`viratrak_alerts_${new Date().toISOString().slice(0, 10)}.pdf`)}
          buildDoc={buildPDF}
        />
      )}
      {selectedEvidence && (
        <EvidencePreviewModal
          alert={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}

      <PageHeader icon={Bell} iconColor="#EF4444" title="Alerts & Evidence" subtitle={isMobile ? "Driver events" : "All detected driver behavior events and evidence"}>
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={exportExcel} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 16px", background: "#10B981", color: "#fff", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
              <Download size={14} /> Excel
            </button>
            <button onClick={() => setShowPDFPreview(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 16px", background: "#EF4444", color: "#fff", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
              <Download size={14} /> PDF
            </button>
          </div>
        )}
      </PageHeader>



      {/* ============================================================ */}
      {/* Filter bar */}
      {/* ============================================================ */}
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 8 : 0, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: isCompactDesktop ? "wrap" : "nowrap", overflow: "visible" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: (showFilters && !isMobile) ? (isCompactDesktop ? "100%" : 240) : (isMobile ? "calc(100% - 82px)" : (isCompactDesktop ? "100%" : 320)), flexShrink: 0, transition: "width 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: dark ? "#374151" : "#F8F9FA", border: `1.5px solid ${dark ? "#6B7280" : "#D1D5DB"}`, borderRadius: 8, padding: "8px 12px", width: "100%", boxSizing: "border-box", boxShadow: dark ? "0 0 0 1px rgba(156,163,175,.12)" : "0 1px 3px rgba(15,23,42,.06)", flexShrink: 0 }}>
              <Search size={15} color={dark ? "#D1D5DB" : "#6B7280"} />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={isMobile ? "Search..." : "Search alerts..."} style={{ background: "transparent", border: "none", outline: "none", fontSize: 14, color: textMain, width: "100%", fontFamily: "Inter, sans-serif" }} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: isCompactDesktop ? 0 : "auto", flexShrink: 0, minWidth: 0, overflow: "visible", width: isCompactDesktop ? "100%" : undefined, justifyContent: isCompactDesktop ? "space-between" : undefined }}>
            {/* Desktop: chips stay inline in this row */}
            {showFilters && !isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: cardBg, border: `1px solid ${dark ? "#374151" : "#E5E7EB"}`, borderRadius: 10, boxShadow: shadow, padding: "6px 8px" }}>
                <SearchDropdown label="Event Type" value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }} options={types} openKey="type" activeKey={activeFilter} setActiveKey={setActiveFilter} dark={dark} />
                <SearchDropdown label="Driver" value={filterDriver} onChange={(v) => { setFilterDriver(v); setPage(1); }} options={drivers} openKey="driver" activeKey={activeFilter} setActiveKey={setActiveFilter} dark={dark} />
                <SearchDropdown label="Vehicle" value={filterVehicle} onChange={(v) => { setFilterVehicle(v); setPage(1); }} options={vehicles} openKey="vehicle" activeKey={activeFilter} setActiveKey={setActiveFilter} dark={dark} />
                <div style={{ position: "relative" }}>
                  <input type="date" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                    style={{ padding: "7px 10px", background: filterDate ? "#EBF2FF" : (dark ? "#1F2937" : "#fff"), border: `1px solid ${filterDate ? "#1D6AE5" : (dark ? "#374151" : "#E5E7EB")}`, borderRadius: 8, fontSize: 13, color: filterDate ? "#1D6AE5" : textSub, outline: "none", fontFamily: "Inter, sans-serif", cursor: "pointer", boxSizing: "border-box" }} />
                </div>
                <SimpleDropdown label="Severity" value={filterSeverity} onChange={(v) => { setFilterSeverity(v); setPage(1); }} options={["High", "Moderate", "Low"]} openKey="severity" activeKey={activeFilter} setActiveKey={setActiveFilter} dark={dark} />
              </div>
            )}

            <button onClick={() => setShowFilters((v) => !v)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: isMobile ? "8px 10px" : "8px 12px", background: showFilters ? "#FEE2E2" : (dark ? "#374151" : "#fff"), color: showFilters ? "#B91C1C" : textSub, border: `1px solid ${showFilters ? "#FCA5A5" : (dark ? "#4B5563" : "#E5E7EB")}`, borderRadius: 8, fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0, minWidth: isMobile ? 0 : undefined }}>
              {showFilters ? <X size={13} /> : <Filter size={13} />}
              {showFilters ? "Close" : "Filters"}
              {activeFilters > 0 && !showFilters && <span style={{ color: "#1D6AE5", fontSize: 12, fontWeight: 700 }}>({activeFilters})</span>}
            </button>

            {activeFilters > 0 && !showFilters && (
              <button onClick={clearFilters} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 10px", background: "transparent", color: "#EF4444", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile only: chips pop up as a full-width block below the search/filter row */}
        {showFilters && isMobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, background: cardBg, border: `1px solid ${dark ? "#374151" : "#E5E7EB"}`, borderRadius: 10, boxShadow: shadow, padding: 10, width: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SearchDropdown label="Event Type" value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }} options={types} openKey="type" activeKey={activeFilter} setActiveKey={setActiveFilter} dark={dark} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SearchDropdown label="Driver" value={filterDriver} onChange={(v) => { setFilterDriver(v); setPage(1); }} options={drivers} openKey="driver" activeKey={activeFilter} setActiveKey={setActiveFilter} dark={dark} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SearchDropdown label="Vehicle" value={filterVehicle} onChange={(v) => { setFilterVehicle(v); setPage(1); }} options={vehicles} openKey="vehicle" activeKey={activeFilter} setActiveKey={setActiveFilter} dark={dark} />
              </div>
              <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                <input type="date" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                  style={{ width: "100%", padding: "7px 10px", background: filterDate ? "#EBF2FF" : (dark ? "#1F2937" : "#fff"), border: `1px solid ${filterDate ? "#1D6AE5" : (dark ? "#374151" : "#E5E7EB")}`, borderRadius: 8, fontSize: 13, color: filterDate ? "#1D6AE5" : textSub, outline: "none", fontFamily: "Inter, sans-serif", cursor: "pointer", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SimpleDropdown label="Severity" value={filterSeverity} onChange={(v) => { setFilterSeverity(v); setPage(1); }} options={["High", "Moderate", "Low"]} openKey="severity" activeKey={activeFilter} setActiveKey={setActiveFilter} dark={dark} />
              </div>
            </div>
          </div>
        )}
      </div>



      {/* ============================================================ */}
      {/* Select all / deselect */}
      {/* ============================================================ */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: cardBg, borderRadius: 12, boxShadow: shadow, overflow: "hidden", marginBottom: isMobile ? 0 : 0 }}>
        <div style={{ flex: 1, minHeight: 0, overflowX: "auto", overflowY: "auto", borderBottom: `1px solid ${borderColor}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 330 : 600 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
              <tr style={{ borderBottom: `1px solid ${borderColor}`, background: cardBg }}>
                <th style={{ padding: "10px 16px", width: 40, position: "sticky", top: 0, zIndex: 3, background: cardBg }}>
                  <div onClick={allChecked ? deselectAll : selectAll}
                    style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${allChecked ? "#1D6AE5" : checkBorder}`, background: allChecked ? "#1D6AE5" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {allChecked && <Check size={10} color="#fff" />}
                    {!allChecked && someChecked && <div style={{ width: 8, height: 2, background: "#1D6AE5", borderRadius: 1 }} />}
                  </div>
                </th>
                {["Type", "Driver", "Vehicle", "Date", "Time", "Severity", "Evidence"].map((h) => (
                  <th key={h} style={{ fontSize: 12, fontWeight: 600, color: thColor, textAlign: "left", padding: "10px 14px", textTransform: "uppercase", letterSpacing: "0.04em", position: "sticky", top: 0, zIndex: 3, background: cardBg }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", fontSize: 15, color: textSub }}>Loading alerts…</td></tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", fontSize: 15, color: textSub }}>
                    <div>{loadError}</div>
                    <button type="button" onClick={() => setRefreshKey((current) => current + 1)} style={{ marginTop: 12, padding: "7px 12px", border: "1px solid #1D6AE5", borderRadius: 7, background: "transparent", color: "#1D6AE5", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      Retry
                    </button>
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", fontSize: 15, color: textSub }}>No records match the selected filters.</td></tr>
              ) : visibleRows.map((e, i) => {
                const Icon = e.icon;
                const checked = selected.has(e.id);
                return (
                  <tr key={e.id} style={{ borderBottom: i < visibleRows.length - 1 ? `1px solid ${borderColor}` : "none", transition: "background 0.1s", background: checked ? (dark ? "#1e3a5f" : "#EBF2FF") : "transparent", cursor: "pointer" }}
                    onClick={() => toggleOne(e.id)}
                    onMouseEnter={(el) => { if (!checked) (el.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                    onMouseLeave={(el) => { if (!checked) (el.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                    <td style={{ padding: "10px 16px" }}>
                      <div onClick={(event) => { event.stopPropagation(); toggleOne(e.id); }} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${checked ? "#1D6AE5" : checkBorder}`, background: checked ? "#1D6AE5" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        {checked && <Check size={10} color="#fff" />}
                      </div>
                    </td>
                    <td style={{ padding: isMobile ? "8px 10px" : "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 6, background: e.icon_bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={12} color={e.icon_color} /></div>
                        <span style={{ fontSize: isMobile ? 13 : 14, color: textMain, fontWeight: 500 }}>{e.type}</span>
                      </div>
                    </td>
                    <td style={{ padding: isMobile ? "8px 10px" : "10px 14px", fontSize: isMobile ? 13 : 14, color: textMain }}>{e.driver}</td>
                    <td style={{ padding: isMobile ? "8px 10px" : "10px 14px", fontSize: isMobile ? 13 : 14, color: textSub }}>{e.vehicle}</td>
                    <td style={{ padding: isMobile ? "8px 10px" : "10px 14px", fontSize: isMobile ? 12 : 14, color: textSub }}>
                      <span>{e.date}</span>
                    </td>
                    <td style={{ padding: isMobile ? "8px 10px" : "10px 14px", fontSize: isMobile ? 12 : 14, color: textSub, fontFamily: "monospace" }}>{e.time}</td>
                    <td style={{ padding: isMobile ? "8px 10px" : "10px 14px" }}>
                      <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 999, fontSize: isMobile ? 11 : 12, fontWeight: 600, background: sevStyle[e.severity].bg, color: sevStyle[e.severity].color }}>{e.severity}</span>
                    </td>
                    <td style={{ padding: isMobile ? "8px 10px" : "10px 14px" }}>
                      <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedEvidence(e); }} style={{ display: "inline-flex", alignItems: "center", padding: 0, border: "none", background: "transparent", fontSize: isMobile ? 12 : 13, color: e.evidence ? "#1D6AE5" : textSub, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {visibleRows.length > 0 && selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, paddingBottom: 8 }}>
          <span style={{ fontSize: isMobile ? 12 : 13, color: textSub }}>{selected.size} selected for PDF</span>
        </div>
      )}
    </div>
  );
}

// End of region comment
