import { useState, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { logsApi } from "../../api/viratrak";
import { Search, Download, Check, ScrollText } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFPreviewModal } from "../components/PDFPreviewModal";



// ============================================================
// Log types and styles
// ============================================================

type LogLevel = "INFO" | "ERROR";

interface LogEntry {
  id: number;
  date: string;
  time: string;
  level: LogLevel;
  ref: string;
  action: string;
  actor: string;
}

const levelStyle: Record<LogLevel, { bg: string; color: string }> = {
  INFO: { bg: "#EBF2FF", color: "#1D6AE5" },
  ERROR: { bg: "#FEF2F2", color: "#EF4444" },
};

// End of region comment



// ============================================================
// Page logic and UI
// ============================================================
// ============================================================
// Log loading, filters, selection, and export actions.
// ============================================================
export function SystemLogsPage() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  useEffect(() => {
    logsApi.list()
      .then((rows) => setAllLogs(rows as LogEntry[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const bg = dark ? "#111827" : "#F4F5F7";
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";
  const rowHover = dark ? "#374151" : "#FAFAFA";
  const inputBg = dark ? "#374151" : "#F8F9FA";
  const thColor = dark ? "#6B7280" : "#9CA3AF";
  const filterBg = dark ? "#374151" : "#F3F4F6";
  const getLevelStyle = (level: LogLevel) => dark
    ? level === "ERROR" ? { bg: "#451A1A", color: "#FCA5A5" } : { bg: "#172554", color: "#93C5FD" }
    : levelStyle[level];

  const filtered = allLogs.filter((l) => {
    const q = search.toLowerCase();
    if (q && !l.action.toLowerCase().includes(q) && !l.ref.toLowerCase().includes(q)) return false;
    if (levelFilter !== "All" && l.level !== levelFilter) return false;
    return true;
  });

  const allChecked = filtered.length > 0 && filtered.every((l) => selected.has(l.id));
  const someChecked = filtered.some((l) => selected.has(l.id));

  function toggleOne(id: number) {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }
  function toggleAll() { setSelected(allChecked ? new Set() : new Set(filtered.map((l) => l.id))); }

  const printData = selected.size > 0 ? filtered.filter((l) => selected.has(l.id)) : filtered;

  function buildLogsPDF() {
    const doc = new jsPDF();
    doc.setFontSize(15); doc.text("ViraTrak System Logs", 14, 16);
    doc.setFontSize(9); doc.setTextColor(120);
    doc.text(`Exported: ${new Date().toLocaleString()}${selected.size > 0 ? ` | ${selected.size} selected` : ""}`, 14, 24);
    autoTable(doc, {
      startY: 30,
      head: [["Date", "Time", "Type", "Reference", "Actor", "Description"]],
      body: printData.map((l) => [l.date, l.time, l.level, l.ref, l.actor, l.action]),
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [29, 106, 229] },
      margin: { left: 14, right: 14 },
    });
    return doc;
  }

  function downloadLogsPDF() {
    buildLogsPDF().save(`viratrak_logs_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function exportExcel() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(printData.map((l) => ({
        Date: l.date,
        Time: l.time,
        Type: l.level,
        Reference: l.ref,
        Actor: l.actor,
        Description: l.action,
      }))),
      "System Logs"
    );
    XLSX.writeFile(wb, `viratrak_logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, height: "100%", overflow: "hidden", padding: isMobile ? 16 : 24, background: bg, fontFamily: "Inter, sans-serif", transition: "background 0.2s" }}>
      {showPDFPreview && (
        <PDFPreviewModal
          title="System Logs — PDF Preview"
          onClose={() => setShowPDFPreview(false)}
          onConfirm={downloadLogsPDF}
          buildDoc={buildLogsPDF}
        />
      )}

      <PageHeader icon={ScrollText} iconColor="#6B7280" title="System Logs" subtitle="Unified audit trail — system events & hardware diagnostics">
        <button onClick={exportExcel} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#10B981", color: "#fff", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          <Download size={14} /> Excel
        </button>
        <button onClick={() => setShowPDFPreview(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#EF4444", color: "#fff", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          <Download size={14} /> PDF {selected.size > 0 && `(${selected.size})`}
        </button>
      </PageHeader>



      {/* ============================================================ */}
      {/* Filters */}
      {/* ============================================================ */}
      <div style={{ display: "flex", gap: 18, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: inputBg, border: `1.5px solid ${dark ? "#6B7280" : "#D1D5DB"}`, borderRadius: 8, padding: "8px 12px", minWidth: 220, boxShadow: dark ? "0 0 0 1px rgba(156,163,175,.12)" : "0 1px 3px rgba(15,23,42,.06)" }}>
          <Search size={13} color={textSub} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs…" style={{ background: "transparent", border: "none", outline: "none", fontSize: 14, color: textMain, width: "100%", fontFamily: "Inter, sans-serif" }} />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", paddingLeft: isMobile ? 0 : 20 }}>
          <span style={{ fontSize: 12, color: thColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Type:</span>
          {["All", "INFO", "ERROR"].map((f) => (
            <button key={f} onClick={() => setLevelFilter(f)}
              style={{ padding: "5px 11px", borderRadius: 999, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", background: levelFilter === f ? "#1D6AE5" : filterBg, color: levelFilter === f ? "#fff" : textSub, transition: "all 0.15s", fontFamily: "Inter, sans-serif" }}>
              {f}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 13, color: textSub, marginLeft: "auto", whiteSpace: "nowrap" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
      </div>



      {/* ============================================================ */}
      {/* Selection summary */}
      {/* ============================================================ */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          {selected.size > 0 && <span style={{ fontSize: 13, color: textSub }}>{selected.size} selected for export</span>}
        </div>
      )}



      {/* ============================================================ */}
      {/* Table */}
      {/* ============================================================ */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: cardBg, borderRadius: 12, boxShadow: shadow, overflow: "hidden" }}>
        <div style={{ flex: 1, minHeight: 0, overflowX: "auto", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 1, background: cardBg }}>
              <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                <th style={{ padding: "10px 14px", width: 40 }}>
                  <div onClick={toggleAll}
                    style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${allChecked ? "#1D6AE5" : (dark ? "#4B5563" : "#D1D5DB")}`, background: allChecked ? "#1D6AE5" : "transparent", cursor: filtered.length ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {allChecked && <Check size={10} color="#fff" />}
                    {!allChecked && someChecked && <div style={{ width: 8, height: 2, background: "#1D6AE5", borderRadius: 1 }} />}
                  </div>
                </th>
                {["Date", "Time", "Type", "Reference", "Actor", "Description"].map((h) => (
                  <th key={h} style={{ fontSize: 12, fontWeight: 600, color: thColor, textAlign: "left", padding: "10px 14px", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", fontSize: 15, color: textSub }}>Loading logs…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", fontSize: 15, color: textSub }}>No logs match the current filters.</td></tr>
              ) : (
                <>
                  {filtered.map((l, i) => {
                    const checked = selected.has(l.id);
                    return (
                      <tr key={l.id}
                        style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${borderColor}` : "none", transition: "background 0.1s", background: checked ? (dark ? "#1e3a5f" : "#EBF2FF") : "transparent", cursor: "pointer" }}
                        onClick={() => toggleOne(l.id)}
                        onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                        onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                        <td style={{ padding: "10px 14px" }}>
                          <div onClick={(event) => { event.stopPropagation(); toggleOne(l.id); }} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${checked ? "#1D6AE5" : (dark ? "#4B5563" : "#D1D5DB")}`, background: checked ? "#1D6AE5" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {checked && <Check size={10} color="#fff" />}
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: textSub, whiteSpace: "nowrap", fontFamily: "monospace" }}>{l.date}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: textSub, whiteSpace: "nowrap", fontFamily: "monospace" }}>{l.time}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: getLevelStyle(l.level).bg, color: getLevelStyle(l.level).color }}>{l.level}</span>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: textSub, whiteSpace: "nowrap" }}>{l.ref}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: textSub, whiteSpace: "nowrap" }}>{l.actor}</td>
                        <td style={{ padding: "10px 14px", fontSize: 14, color: textMain }}>{l.action}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td colSpan={7} style={{ padding: "10px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                        <span style={{ flex: 1, height: 1, background: dark ? "#374151" : "#E5E7EB" }} />
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: dark ? "#9CA3AF" : "#94A3B8", whiteSpace: "nowrap" }}>
                          End of table
                        </span>
                        <span style={{ flex: 1, height: 1, background: dark ? "#374151" : "#E5E7EB" }} />
                      </div>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// End of region comment
