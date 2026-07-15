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

type LogSource = "System" | "Hardware";
type LogLevel  = "INFO" | "WARNING" | "ERROR";

interface LogEntry {
  id: number;
  source: LogSource;
  date: string;
  time: string;
  level: LogLevel;
  ref: string;
  action: string;
}

const levelStyle: Record<LogLevel, { bg: string; color: string }> = {
  INFO:    { bg: "#EBF2FF", color: "#1D6AE5" },
  WARNING: { bg: "#FFF7ED", color: "#F59E0B" },
  ERROR:   { bg: "#FEF2F2", color: "#EF4444" },
};

const sourceStyle: Record<LogSource, { bg: string; color: string }> = {
  System:   { bg: "#F5F3FF", color: "#8B5CF6" },
  Hardware: { bg: "#FFF7ED", color: "#D97706" },
};

export function SystemLogsPage() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  useEffect(() => {
    logsApi.list()
      .then((rows) => setAllLogs(rows as LogEntry[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const bg          = dark ? "#111827" : "#F4F5F7";
  const cardBg      = dark ? "#1F2937" : "#fff";
  const textMain    = dark ? "#F9FAFB" : "#111827";
  const textSub     = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const shadow      = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";
  const rowHover    = dark ? "#374151" : "#FAFAFA";
  const inputBg     = dark ? "#374151" : "#F8F9FA";
  const thColor     = dark ? "#6B7280" : "#9CA3AF";
  const filterBg    = dark ? "#374151" : "#F3F4F6";

  const filtered = allLogs.filter((l) => {
    const q = search.toLowerCase();
    if (q && !l.action.toLowerCase().includes(q) && !l.ref.toLowerCase().includes(q)) return false;
    if (levelFilter !== "All" && l.level !== levelFilter) return false;
    if (sourceFilter !== "All" && l.source !== sourceFilter) return false;
    return true;
  });

  const allChecked  = filtered.length > 0 && filtered.every((l) => selected.has(l.id));
  const someChecked = filtered.some((l) => selected.has(l.id));

  function toggleOne(id: number) {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }
  function selectAll()   { setSelected((prev) => { const s = new Set(prev); filtered.forEach((l) => s.add(l.id)); return s; }); }
  function deselectAll() { setSelected((prev) => { const s = new Set(prev); filtered.forEach((l) => s.delete(l.id)); return s; }); }

  const printData = selected.size > 0 ? filtered.filter((l) => selected.has(l.id)) : filtered;

  function buildLogsPDF() {
    const doc = new jsPDF();
    doc.setFontSize(15); doc.text("ViraTrak System Logs", 14, 16);
    doc.setFontSize(9); doc.setTextColor(120);
    doc.text(`Exported: ${new Date().toLocaleString()}${selected.size > 0 ? ` | ${selected.size} selected` : ""}`, 14, 24);
    autoTable(doc, {
      startY: 30,
      head: [["Date", "Time", "Type", "Source", "Reference", "Description"]],
      body: printData.map((l) => [l.date, l.time, l.level, l.source, l.ref, l.action]),
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
        Date:        l.date,
        Time:        l.time,
        Type:        l.level,
        Source:      l.source,
        Reference:   l.ref,
        Description: l.action,
      }))),
      "System Logs"
    );
    XLSX.writeFile(wb, `viratrak_logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: bg, fontFamily: "Inter, sans-serif", transition: "background 0.2s" }}>
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

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: inputBg, border: `1px solid ${dark ? "#374151" : "#E5E7EB"}`, borderRadius: 8, padding: "7px 12px", minWidth: 220 }}>
          <Search size={13} color={textSub} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs…" style={{ background: "transparent", border: "none", outline: "none", fontSize: 14, color: textMain, width: "100%", fontFamily: "Inter, sans-serif" }} />
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: thColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Type:</span>
          {["All", "INFO", "WARNING", "ERROR"].map((f) => (
            <button key={f} onClick={() => setLevelFilter(f)}
              style={{ padding: "5px 11px", borderRadius: 999, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", background: levelFilter === f ? "#1D6AE5" : filterBg, color: levelFilter === f ? "#fff" : textSub, transition: "all 0.15s", fontFamily: "Inter, sans-serif" }}>
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: thColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Source:</span>
          {["All", "System", "Hardware"].map((f) => (
            <button key={f} onClick={() => setSourceFilter(f)}
              style={{ padding: "5px 11px", borderRadius: 999, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", background: sourceFilter === f ? "#1D6AE5" : filterBg, color: sourceFilter === f ? "#fff" : textSub, transition: "all 0.15s", fontFamily: "Inter, sans-serif" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Select / Deselect */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={selectAll} style={{ fontSize: 13, color: "#1D6AE5", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", padding: 0 }}>Select All</button>
          <span style={{ color: dark ? "#4B5563" : "#D1D5DB" }}>·</span>
          <button onClick={deselectAll} style={{ fontSize: 13, color: textSub, background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", padding: 0 }}>Deselect All</button>
          {selected.size > 0 && <span style={{ fontSize: 13, color: textSub }}>{selected.size} selected for export</span>}
          <span style={{ fontSize: 13, color: textSub, marginLeft: "auto" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Table */}
      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                <th style={{ padding: "10px 14px", width: 40 }}>
                  <div onClick={allChecked ? deselectAll : selectAll}
                    style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${allChecked ? "#1D6AE5" : (dark ? "#4B5563" : "#D1D5DB")}`, background: allChecked ? "#1D6AE5" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {allChecked && <Check size={10} color="#fff" />}
                    {!allChecked && someChecked && <div style={{ width: 8, height: 2, background: "#1D6AE5", borderRadius: 1 }} />}
                  </div>
                </th>
                {["Date", "Time", "Type", "Source", "Reference", "Description"].map((h) => (
                  <th key={h} style={{ fontSize: 12, fontWeight: 600, color: thColor, textAlign: "left", padding: "10px 14px", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", fontSize: 15, color: textSub }}>Loading logs…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", fontSize: 15, color: textSub }}>No logs match the current filters.</td></tr>
              ) : filtered.map((l, i) => {
                const checked = selected.has(l.id);
                return (
                  <tr key={l.id}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${borderColor}` : "none", transition: "background 0.1s", background: checked ? (dark ? "#1e3a5f" : "#EBF2FF") : "transparent" }}
                    onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                    onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                    <td style={{ padding: "10px 14px" }} onClick={() => toggleOne(l.id)}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${checked ? "#1D6AE5" : (dark ? "#4B5563" : "#D1D5DB")}`, background: checked ? "#1D6AE5" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {checked && <Check size={10} color="#fff" />}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: textSub, whiteSpace: "nowrap", fontFamily: "monospace" }}>{l.date}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: textSub, whiteSpace: "nowrap", fontFamily: "monospace" }}>{l.time}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: levelStyle[l.level].bg, color: levelStyle[l.level].color }}>{l.level}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: sourceStyle[l.source].bg, color: sourceStyle[l.source].color }}>{l.source}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: textSub, whiteSpace: "nowrap" }}>{l.ref}</td>
                    <td style={{ padding: "10px 14px", fontSize: 14, color: textMain }}>{l.action}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
