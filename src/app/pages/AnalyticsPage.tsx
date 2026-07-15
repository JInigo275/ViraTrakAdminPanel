import { useEffect, useMemo, useRef, useState } from "react";
import { Printer, TrendingUp, Download } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { PDFPreviewModal } from "../components/PDFPreviewModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { useApp } from "../context/AppContext";
import { alertsApi, DbAlert } from "../../api/viratrak";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

type Period =
  | "Today"
  | "This Week"
  | "This Month"
  | "This Year";

const sevMap: Record<string, { bg: string; color: string }> = {
  High: { bg: "#FEF2F2", color: "#EF4444" },
  Moderate: { bg: "#FFF7ED", color: "#F59E0B" },
  Low: { bg: "#ECFDF5", color: "#10B981" },
};

const EVENT_COLORS: Record<string, string> = {
  "Drowsiness": "#EF4444",
  "Lane Drift": "#F59E0B",
  "Distraction": "#1D6AE5",
  "Speeding": "#8B5CF6",
  "Yawning": "#EF4444",
  "Hard Braking": "#10B981",
  "Eyes Closed": "#F59E0B",
  "Micro Sleep": "#8B5CF6",
  "Head Pose": "#1D6AE5",
  "Body Posture": "#10B981",
  "Blink Rate": "#EAB308",
};

const PERIODS: Period[] = [
  "Today",
  "This Week",
  "This Month",
  "This Year",
];

type AlertSeriesPoint = { label: string; avg: number };
type EventBreakdown = { event: string; count: number; color: string };
type SeverityBreakdown = { label: string; count: number; color: string; bg: string };
type KPI = { label: string; value: string; color: string; note: string };
type RecentEvent = { event: string; driver: string; time: string; severity: string };
type DriverComparisonRow = { driver: string; blink: number; perclos: number; ear: number; posture: number };

function parseAlertTimestamp(alert: DbAlert): Date | null {
  const timestamp = new Date(`${alert.date}T${alert.time}`);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

function getPeriodStart(period: Period, now = new Date()) {
  const start = new Date(now);
  if (period === "Today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "This Week") {
    const day = start.getDay();
    const diff = (day + 6) % 7;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "This Month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getPeriodLabels(period: Period) {
  if (period === "Today") return ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"];
  if (period === "This Week") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (period === "This Month") return ["W1", "W2", "W3", "W4"];
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
}

function isWithinPeriod(timestamp: Date, period: Period, now = new Date()) {
  return timestamp >= getPeriodStart(period, now);
}

function getPeriodBucketIndex(timestamp: Date, period: Period) {
  if (period === "Today") return Math.min(5, Math.floor(timestamp.getHours() / 4));
  if (period === "This Week") return Math.max(0, Math.min(6, (timestamp.getDay() + 6) % 7));
  if (period === "This Month") {
    const day = timestamp.getDate();
    return Math.max(0, Math.min(3, Math.floor((day - 1) / 7)));
  }
  return timestamp.getMonth();
}

function buildSeries(alerts: DbAlert[], period: Period, valueSelector: (alert: DbAlert) => number): AlertSeriesPoint[] {
  const labels = getPeriodLabels(period);
  const buckets = labels.map((label) => ({ label, total: 0, count: 0 }));
  alerts.forEach((alert) => {
    const timestamp = parseAlertTimestamp(alert);
    if (!timestamp || !isWithinPeriod(timestamp, period)) return;
    const index = getPeriodBucketIndex(timestamp, period);
    const bucket = buckets[index];
    if (!bucket) return;
    bucket.total += valueSelector(alert);
    bucket.count += 1;
  });
  return buckets.map((bucket) => ({ label: bucket.label, avg: bucket.count > 0 ? bucket.total / bucket.count : 0 }));
}

function buildEventBreakdown(alerts: DbAlert[], period: Period): EventBreakdown[] {
  const counts = new Map<string, number>();
  alerts.forEach((alert) => {
    const timestamp = parseAlertTimestamp(alert);
    if (!timestamp || !isWithinPeriod(timestamp, period)) return;
    counts.set(alert.type, (counts.get(alert.type) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([event, count]) => ({ event, count, color: EVENT_COLORS[event] ?? "#1D6AE5" }))
    .sort((a, b) => b.count - a.count || a.event.localeCompare(b.event));
}

function buildSeverityBreakdown(alerts: DbAlert[], period: Period): SeverityBreakdown[] {
  const counts = { High: 0, Moderate: 0, Low: 0 };
  alerts.forEach((alert) => {
    const timestamp = parseAlertTimestamp(alert);
    if (!timestamp || !isWithinPeriod(timestamp, period)) return;
    counts[alert.severity] += 1;
  });
  return (["High", "Moderate", "Low"] as const).map((label) => ({
    label,
    count: counts[label],
    color: sevMap[label].color,
    bg: sevMap[label].bg,
  }));
}

function severityScore(severity: DbAlert["severity"]) {
  if (severity === "High") return 3;
  if (severity === "Moderate") return 2;
  return 1;
}

function buildRecentEvents(alerts: DbAlert[]): RecentEvent[] {
  return [...alerts]
    .map((alert) => ({
      alert,
      timestamp: parseAlertTimestamp(alert),
    }))
    .filter((entry): entry is { alert: DbAlert; timestamp: Date } => Boolean(entry.timestamp))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8)
    .map(({ alert }) => ({
      event: alert.type,
      driver: alert.driver,
      time: alert.time,
      severity: alert.severity,
    }));
}

function buildKpis(alerts: DbAlert[], driversCount: number, period: Period): KPI[] {
  const periodAlerts = alerts.filter((alert) => {
    const timestamp = parseAlertTimestamp(alert);
    return Boolean(timestamp && isWithinPeriod(timestamp, period));
  });
  const counts = { High: 0, Moderate: 0, Low: 0 };
  const vehicles = new Set<string>();
  periodAlerts.forEach((alert) => {
    counts[alert.severity] += 1;
    vehicles.add(alert.vehicle);
  });
  return [
    { label: "Total Events", value: String(periodAlerts.length), color: "#1D6AE5", note: period.toLowerCase() },
    { label: "High Severity", value: String(counts.High), color: "#EF4444", note: "Requires attention" },
    { label: "Moderate", value: String(counts.Moderate), color: "#F59E0B", note: "Monitor closely" },
    { label: "Low", value: String(counts.Low), color: "#10B981", note: "Within range" },
    { label: "Active Drivers", value: String(driversCount), color: "#8B5CF6", note: period.toLowerCase() },
    { label: "Vehicles", value: String(vehicles.size), color: "#6B7280", note: "Derived from alerts" },
  ];
}

function buildDriverComparison(alerts: DbAlert[], driverNames: string[]): DriverComparisonRow[] {
  const counts = new Map<string, { blink: number; perclos: number; ear: number; posture: number }>();
  const names = new Set<string>(driverNames);
  alerts.forEach((alert) => names.add(alert.driver));
  names.forEach((name) => counts.set(name, { blink: 0, perclos: 0, ear: 0, posture: 0 }));
  alerts.forEach((alert) => {
    const current = counts.get(alert.driver) ?? { blink: 0, perclos: 0, ear: 0, posture: 0 };
    current.blink += 1;
    if (alert.severity === "High") current.perclos += 1;
    if (alert.severity === "Moderate") current.ear += 1;
    current.posture += severityScore(alert.severity) * 10;
    counts.set(alert.driver, current);
  });
  return [...counts.entries()]
    .map(([driver, metrics]) => ({
      driver,
      blink: metrics.blink,
      perclos: metrics.perclos,
      ear: metrics.ear,
      posture: Math.min(100, metrics.posture),
    }))
    .sort((a, b) => b.blink - a.blink || a.driver.localeCompare(b.driver))
    .slice(0, 6);
}

export function AnalyticsPage() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const { drivers } = useApp();
  const [period, setPeriod] = useState<Period>("Today");
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [alerts, setAlerts] = useState<DbAlert[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alertsApi.list()
      .then((rows) => setAlerts(rows))
      .catch(console.error);
  }, []);

  const bg = dark ? "#111827" : "#F4F5F7";
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const shadow = dark
    ? "0 1px 4px rgba(0,0,0,0.3)"
    : "0 1px 4px rgba(0,0,0,0.07)";
  const gridColor = dark ? "#374151" : "#F3F4F6";
  const tooltipStyle = {
    fontSize: 13,
    borderRadius: 8,
    border: `1px solid ${borderColor}`,
    background: cardBg,
    color: textMain,
  };

  const periodAlerts = useMemo(
    () => alerts.filter((alert) => {
      const timestamp = parseAlertTimestamp(alert);
      return Boolean(timestamp && isWithinPeriod(timestamp, period));
    }),
    [alerts, period],
  );

  const eventSummary = useMemo(() => buildEventBreakdown(alerts, period), [alerts, period]);
  const totalEvents = periodAlerts.length;
  const sevData = useMemo(() => buildSeverityBreakdown(alerts, period), [alerts, period]);
  const kpis = useMemo(() => buildKpis(alerts, drivers.length, period), [alerts, drivers.length, period]);
  const recentEvents = useMemo(() => buildRecentEvents(periodAlerts), [periodAlerts]);
  const blinkTrend = useMemo(() => ({ [period]: buildSeries(alerts, period, () => 1) } as Record<Period, AlertSeriesPoint[]>), [alerts, period]);
  const perclosTrend = useMemo(() => ({ [period]: buildSeries(alerts, period, (alert) => severityScore(alert.severity)) } as Record<Period, AlertSeriesPoint[]>), [alerts, period]);
  const driverComparison = useMemo(() => buildDriverComparison(periodAlerts, drivers.map((driver) => `${driver.firstName} ${driver.lastName}`.trim()).filter(Boolean)), [periodAlerts, drivers]);

  function buildPDF(): jsPDF {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 18;

    // Title
    doc.setFontSize(18).setFont("helvetica", "bold");
    doc.text("Analytics Report", 14, y);
    y += 8;
    doc
      .setFontSize(10)
      .setFont("helvetica", "normal")
      .setTextColor(100);
    doc.text(
      `Period: ${period}   ·   Generated: ${new Date().toLocaleString()}`,
      14,
      y,
    );
    y += 10;
    doc.setTextColor(0);

    // KPI grid (2 per row)
    doc.setFontSize(12).setFont("helvetica", "bold");
    doc.text("Fleet Overview", 14, y);
    y += 6;
    const colW = (pageW - 28) / 2;
    kpis.forEach((k, i) => {
      const x = 14 + (i % 2) * (colW + 4);
      if (i % 2 === 0 && i > 0) y += 18;
      doc
        .setDrawColor(220)
        .setFillColor(248, 249, 250)
        .roundedRect(x, y, colW, 14, 2, 2, "FD");
      doc
        .setFontSize(9)
        .setFont("helvetica", "normal")
        .setTextColor(120);
      doc.text(k.label, x + 3, y + 5);
      doc
        .setFontSize(13)
        .setFont("helvetica", "bold")
        .setTextColor(0);
      doc.text(k.value, x + 3, y + 11);
    });
    y += 22;

    // Events by Type table
    doc
      .setFontSize(12)
      .setFont("helvetica", "bold")
      .setTextColor(0);
    doc.text("Events by Type", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Event Type", "Count", "% Share"]],
      body: eventSummary.map((e) => [
        e.event,
        String(e.count),
        `${totalEvents > 0 ? Math.round((e.count / totalEvents) * 100) : 0}%`,
      ]),
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [29, 106, 229],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Recent Events table
    doc
      .setFontSize(12)
      .setFont("helvetica", "bold")
      .setTextColor(0);
    doc.text("Recent Events", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Event", "Driver", "Time", "Severity"]],
      body: recentEvents.map((e) => [
        e.event,
        e.driver,
        e.time,
        e.severity,
      ]),
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [29, 106, 229],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      margin: { left: 14, right: 14 },
    });

    return doc;
  }

  function handlePrint() {
    const win = window.open(
      "",
      "_blank",
      "width=900,height=700",
    );
    if (!win) return;
    win.document
      .write(`<!DOCTYPE html><html><head><title>Analytics Report — ${period}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Inter, sans-serif; background: #fff; color: #111827; padding: 32px; }
        h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        p  { font-size: 13px; color: #6B7280; margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .kpi  { border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px; }
        .kpi-label { font-size: 11px; color: #9CA3AF; margin-bottom: 4px; }
        .kpi-value { font-size: 22px; font-weight: 700; line-height: 1; }
        .kpi-note  { font-size: 10px; color: #9CA3AF; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
        th { text-align: left; padding: 8px 12px; font-size: 11px; color: #9CA3AF; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; }
        td { padding: 9px 12px; border-bottom: 1px solid #F3F4F6; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        @media print { body { padding: 16px; } }
      </style></head><body>
      <h1>Analytics Report</h1>
      <p>Period: ${period} &nbsp;·&nbsp; Generated: ${new Date().toLocaleString()}</p>
      <div class="grid">${kpis.map((k) => `<div class="kpi"><div class="kpi-label">${k.label}</div><div class="kpi-value" style="color:${k.color}">${k.value}</div><div class="kpi-note">${k.note}</div></div>`).join("")}</div>
      <table><thead><tr><th>Event</th><th>Driver</th><th>Time</th><th>Severity</th></tr></thead><tbody>
      ${recentEvents
        .map((e) => {
          const s = sevMap[e.severity];
          return `<tr><td>${e.event}</td><td>${e.driver}</td><td>${e.time}</td><td><span class="badge" style="background:${s.bg};color:${s.color}">${e.severity}</span></td></tr>`;
        })
        .join("")}
      </tbody></table></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  function Card({
    title,
    subtitle,
    children,
    span,
  }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    span?: string;
  }) {
    return (
      <div
        style={{
          background: cardBg,
          borderRadius: 12,
          boxShadow: shadow,
          padding: isMobile ? "14px 12px" : "18px 20px",
          gridColumn: span,
          minWidth: 0,
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: textMain,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 13,
                color: textSub,
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "clip",
        padding: isMobile ? 12 : 24,
        background: bg,
        fontFamily: "Inter, sans-serif",
        transition: "background 0.2s",
      }}
    >
      <PageHeader
        icon={TrendingUp}
        iconColor="#8B5CF6"
        title="Analytics"
        subtitle="Fleet-wide fatigue and behavior summary — all drivers"
      >
        {!isMobile && (
          <>
            {/* Segmented period control — desktop only inside header */}
            <div
              style={{
                position: "relative",
                display: "flex",
                background: dark ? "#374151" : "#F3F4F6",
                borderRadius: 8,
                padding: 3,
                width: 340,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: 3 + PERIODS.indexOf(period) * 83.5,
                  width: 83.5,
                  bottom: 3,
                  background: "#8B5CF6",
                  borderRadius: 6,
                  transition: "left 0.22s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: "0 1px 4px rgba(139,92,246,0.35)",
                }}
              />
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: 83.5,
                    flexShrink: 0,
                    padding: "7px 0",
                    borderRadius: 6,
                    border: "none",
                    background: "transparent",
                    color: period === p ? "#fff" : textSub,
                    fontSize: 13,
                    fontWeight: period === p ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    whiteSpace: "nowrap",
                    transition: "color 0.18s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    outline: "none",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPDFPreview(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "none", background: "#EF4444", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}
            >
              <Download size={13} /> Export
            </button>
            <button
              onClick={handlePrint}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "none", background: "#10B981", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}
            >
              <Printer size={13} /> Print
            </button>
          </>
        )}
      </PageHeader>

      {/* Mobile-only controls row — period selector + action buttons */}
      {isMobile && (
        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Full-width period selector */}
          <div style={{ position: "relative", display: "flex", background: dark ? "#374151" : "#F3F4F6", borderRadius: 8, padding: 3, width: "100%" }}>
            <div
              style={{
                position: "absolute",
                top: 3,
                left: `calc(${PERIODS.indexOf(period)} * 25%)`,
                width: "25%",
                bottom: 3,
                background: "#8B5CF6",
                borderRadius: 6,
                transition: "left 0.22s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: "0 1px 4px rgba(139,92,246,0.35)",
              }}
            />
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  position: "relative",
                  zIndex: 1,
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 6,
                  border: "none",
                  background: "transparent",
                  color: period === p ? "#fff" : textSub,
                  fontSize: 13,
                  fontWeight: period === p ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  whiteSpace: "nowrap",
                  transition: "color 0.18s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  outline: "none",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {p}
              </button>
            ))}
          </div>
          {/* Export + Print row */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowPDFPreview(true)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 12px", borderRadius: 8, border: "none", background: "#EF4444", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
            >
              <Download size={13} /> Export
            </button>
            <button
              onClick={handlePrint}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 12px", borderRadius: 8, border: "none", background: "#10B981", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
            >
              <Printer size={13} /> Print
            </button>
          </div>
        </div>
      )}

      {showPDFPreview && (
        <PDFPreviewModal
          title={`Analytics Report — ${period}`}
          onClose={() => setShowPDFPreview(false)}
          onConfirm={() =>
            buildPDF().save(
              `analytics-${period.toLowerCase().replace(/\s+/g, "-")}.pdf`,
            )
          }
          buildDoc={buildPDF}
        />
      )}

      {/* Content to print */}
      <div ref={printRef}>
        {/* Fleet KPI row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : "repeat(6, 1fr)",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {kpis.map(({ label, value, color, note }) => (
            <div
              key={label}
              style={{
                background: cardBg,
                borderRadius: 12,
                boxShadow: shadow,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: textSub,
                  marginBottom: 6,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 25,
                  fontWeight: 700,
                  color,
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: textSub,
                  marginTop: 5,
                }}
              >
                {note}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 16,
          }}
        >
          {/* Event type breakdown */}
          <Card
            title="Events by Type"
            subtitle={`Derived from alert records for ${period.toLowerCase()}`}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {eventSummary.length === 0 ? (
                <div style={{ padding: "18px 0", color: textSub, fontSize: 14 }}>
                  No alert data available for this period.
                </div>
              ) : eventSummary.map((e) => (
                <div
                  key={e.event}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    height: 24,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: textMain,
                      width: isMobile ? 84 : 100,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {e.event}
                  </span>

                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      background: dark ? "#374151" : "#E5E7EB",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: totalEvents > 0 ? `${(e.count / totalEvents) * 100}%` : "0%",
                        height: "100%",
                        background: e.color,
                        borderRadius: 4,
                      }}
                    />
                  </div>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: e.color,
                      width: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    {e.count}
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      color: textSub,
                      width: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    {totalEvents > 0 ? `${Math.round((e.count / totalEvents) * 100)}%` : "0%"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Severity distribution */}
          <Card
            title="Severity Distribution"
            subtitle="Severity mix derived from the current alert set"
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {sevData.length === 0 ? (
                <div style={{ padding: "18px 0", color: textSub, fontSize: 14 }}>
                  No severity data available for this period.
                </div>
              ) : sevData.map((s) => {
                const total = sevData.reduce(
                  (a, b) => a + b.count,
                  0,
                );
                return (
                  <div
                    key={s.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: s.bg,
                        color: s.color,
                        width: 72,
                        textAlign: "center",
                      }}
                    >
                      {s.label}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 10,
                        background: dark
                          ? "#374151"
                          : "#E5E7EB",
                        borderRadius: 5,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: total > 0 ? `${(s.count / total) * 100}%` : "0%",
                          height: "100%",
                          background: s.color,
                          borderRadius: 5,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: s.color,
                        width: 50,
                        textAlign: "right",
                      }}
                    >
                      {s.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Blink trend */}
          <Card
            title={`Alert Volume — ${period}`}
            subtitle="Alert counts grouped into time buckets"
          >
            <ResponsiveContainer
              key={`blink-${period}`}
              width="100%"
              height={isMobile ? 130 : 160}
            >
              <LineChart data={blinkTrend[period]} margin={{ left: -10, right: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: textSub }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 25]}
                  tick={{ fontSize: 12, fill: textSub }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="avg"
                  name="Alert Volume"
                  stroke="#1D6AE5"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* PERCLOS trend */}
          <Card
            title={`Severity Index — ${period}`}
            subtitle="Average severity score derived from alerts"
          >
            <ResponsiveContainer
              key={`perclos-${period}`}
              width="100%"
              height={isMobile ? 130 : 160}
            >
              <LineChart data={perclosTrend[period]} margin={{ left: -10, right: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: textSub }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 3.5]}
                  tick={{ fontSize: 12, fill: textSub }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [v.toFixed(2), "Severity score"]}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  name="Severity score"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Driver comparison */}
          <Card
            title="Driver Alert Load"
            subtitle="Alert counts and weighted safety scores by driver"
            span={isMobile ? undefined : "1 / -1"}
          >
            {/* On mobile: fixed-width scrollable chart so all drivers show clearly */}
            <div style={{ overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" as any }}>
              <div style={{ width: isMobile ? Math.max(320, driverComparison.length * 60) : "100%", height: isMobile ? 180 : 200 }}>
                <ResponsiveContainer key={`bar-${period}`} width="100%" height="100%">
                  <BarChart data={driverComparison} margin={{ left: -10, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="driver" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="blink" name="Alerts" fill="#1D6AE5" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="perclos" name="High severity" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="ear" name="Moderate severity" fill="#EF4444" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="posture" name="Safety score" fill="#10B981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Recent events */}
          <Card
            title="Recent Events"
            subtitle="Latest alert records from the current data set"
            span={isMobile ? undefined : "1 / -1"}
          >
            <div
              style={{
                display: "block",
                overflowY: "auto",
                maxHeight: 280,
                overflowX: "auto",
                WebkitOverflowScrolling: "touch" as any,
                width: "100%",
              }}
            >
              <table
                style={{
                  borderCollapse: "collapse",
                  minWidth: isMobile ? 280 : 380,
                  width: "100%",
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    background: cardBg,
                    zIndex: 1,
                  }}
                >
                  <tr
                    style={{
                      borderBottom: `1px solid ${borderColor}`,
                    }}
                  >
                    {[
                      "Event",
                      "Driver",
                      "Time",
                      "Severity",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: textSub,
                          textAlign: "left",
                          padding: isMobile ? "8px 10px" : "8px 16px",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "24px 16px", textAlign: "center", color: textSub, fontSize: 14 }}>
                        No recent alert records are available.
                      </td>
                    </tr>
                  ) : recentEvents.map((e, i) => {
                    const sev = sevMap[e.severity];
                    return (
                      <tr
                        key={i}
                        style={{
                          borderBottom:
                            i < recentEvents.length - 1
                              ? `1px solid ${borderColor}`
                              : "none",
                        }}
                      >
                        <td style={{ padding: isMobile ? "8px 10px" : "10px 16px", fontSize: 14, fontWeight: 500, color: textMain }}>
                          {e.event}
                        </td>
                        <td style={{ padding: isMobile ? "8px 10px" : "10px 16px", fontSize: 14, color: textMain }}>
                          {e.driver}
                        </td>
                        <td style={{ padding: isMobile ? "8px 10px" : "10px 16px", fontSize: 14, color: textSub, fontFamily: "monospace" }}>
                          {e.time}
                        </td>
                        <td style={{ padding: isMobile ? "8px 10px" : "10px 16px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 10px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 600,
                              background: sev.bg,
                              color: sev.color,
                            }}
                          >
                            {e.severity}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}