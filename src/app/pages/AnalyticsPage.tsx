import { useState, useRef } from "react";
import { Printer, TrendingUp, Download } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { PDFPreviewModal } from "../components/PDFPreviewModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useIsMobile";
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

const blinkTrend: Record<
  Period,
  { label: string; avg: number }[]
> = {
  Today: [
    { label: "08:00", avg: 14 },
    { label: "09:00", avg: 11 },
    { label: "10:00", avg: 16 },
    { label: "11:00", avg: 9 },
    { label: "12:00", avg: 12 },
    { label: "13:00", avg: 17 },
    { label: "14:00", avg: 13 },
  ],
  "This Week": [
    { label: "Mon", avg: 14 },
    { label: "Tue", avg: 11 },
    { label: "Wed", avg: 16 },
    { label: "Thu", avg: 9 },
    { label: "Fri", avg: 12 },
    { label: "Sat", avg: 17 },
    { label: "Sun", avg: 13 },
  ],
  "This Month": [
    { label: "W1", avg: 13 },
    { label: "W2", avg: 15 },
    { label: "W3", avg: 10 },
    { label: "W4", avg: 16 },
  ],
  "This Year": [
    { label: "Jan", avg: 14 },
    { label: "Feb", avg: 12 },
    { label: "Mar", avg: 15 },
    { label: "Apr", avg: 11 },
    { label: "May", avg: 16 },
    { label: "Jun", avg: 13 },
    { label: "Jul", avg: 10 },
    { label: "Aug", avg: 14 },
    { label: "Sep", avg: 12 },
    { label: "Oct", avg: 15 },
    { label: "Nov", avg: 11 },
    { label: "Dec", avg: 13 },
  ],
};

const perclosTrend: Record<
  Period,
  { label: string; avg: number }[]
> = {
  Today: [
    { label: "08:00", avg: 4 },
    { label: "09:00", avg: 8 },
    { label: "10:00", avg: 6 },
    { label: "11:00", avg: 13 },
    { label: "12:00", avg: 10 },
    { label: "13:00", avg: 5 },
    { label: "14:00", avg: 9 },
  ],
  "This Week": [
    { label: "Mon", avg: 6 },
    { label: "Tue", avg: 11 },
    { label: "Wed", avg: 8 },
    { label: "Thu", avg: 15 },
    { label: "Fri", avg: 13 },
    { label: "Sat", avg: 5 },
    { label: "Sun", avg: 9 },
  ],
  "This Month": [
    { label: "W1", avg: 8 },
    { label: "W2", avg: 11 },
    { label: "W3", avg: 6 },
    { label: "W4", avg: 13 },
  ],
  "This Year": [
    { label: "Jan", avg: 7 },
    { label: "Feb", avg: 9 },
    { label: "Mar", avg: 11 },
    { label: "Apr", avg: 8 },
    { label: "May", avg: 13 },
    { label: "Jun", avg: 10 },
    { label: "Jul", avg: 6 },
    { label: "Aug", avg: 9 },
    { label: "Sep", avg: 12 },
    { label: "Oct", avg: 8 },
    { label: "Nov", avg: 10 },
    { label: "Dec", avg: 7 },
  ],
};

const eventsByPeriod: Record<
  Period,
  { event: string; count: number; color: string }[]
> = {
  Today: [
    { event: "Yawning", count: 14, color: "#EF4444" },
    { event: "Eyes Closed", count: 9, color: "#F59E0B" },
    { event: "Micro Sleep", count: 5, color: "#8B5CF6" },
    { event: "Head Pose", count: 11, color: "#1D6AE5" },
    { event: "Body Posture", count: 7, color: "#10B981" },
    { event: "Blink Rate", count: 6, color: "#EAB308" },
  ],
  "This Week": [
    { event: "Yawning", count: 52, color: "#EF4444" },
    { event: "Eyes Closed", count: 38, color: "#F59E0B" },
    { event: "Micro Sleep", count: 21, color: "#8B5CF6" },
    { event: "Head Pose", count: 44, color: "#1D6AE5" },
    { event: "Body Posture", count: 29, color: "#10B981" },
    { event: "Blink Rate", count: 31, color: "#EAB308" },
  ],
  "This Month": [
    { event: "Yawning", count: 198, color: "#EF4444" },
    { event: "Eyes Closed", count: 143, color: "#F59E0B" },
    { event: "Micro Sleep", count: 87, color: "#8B5CF6" },
    { event: "Head Pose", count: 172, color: "#1D6AE5" },
    { event: "Body Posture", count: 114, color: "#10B981" },
    { event: "Blink Rate", count: 122, color: "#EAB308" },
  ],
  "This Year": [
    { event: "Yawning", count: 1840, color: "#EF4444" },
    { event: "Eyes Closed", count: 1290, color: "#F59E0B" },
    { event: "Micro Sleep", count: 760, color: "#8B5CF6" },
    { event: "Head Pose", count: 1580, color: "#1D6AE5" },
    { event: "Body Posture", count: 1030, color: "#10B981" },
    { event: "Blink Rate", count: 1110, color: "#EAB308" },
  ],
};

const sevByPeriod: Record<
  Period,
  { label: string; count: number; color: string; bg: string }[]
> = {
  Today: [
    {
      label: "High",
      count: 4,
      color: "#EF4444",
      bg: "#FEF2F2",
    },
    {
      label: "Moderate",
      count: 3,
      color: "#F59E0B",
      bg: "#FFF7ED",
    },
    { label: "Low", count: 1, color: "#10B981", bg: "#ECFDF5" },
  ],
  "This Week": [
    {
      label: "High",
      count: 18,
      color: "#EF4444",
      bg: "#FEF2F2",
    },
    {
      label: "Moderate",
      count: 14,
      color: "#F59E0B",
      bg: "#FFF7ED",
    },
    { label: "Low", count: 9, color: "#10B981", bg: "#ECFDF5" },
  ],
  "This Month": [
    {
      label: "High",
      count: 72,
      color: "#EF4444",
      bg: "#FEF2F2",
    },
    {
      label: "Moderate",
      count: 58,
      color: "#F59E0B",
      bg: "#FFF7ED",
    },
    {
      label: "Low",
      count: 34,
      color: "#10B981",
      bg: "#ECFDF5",
    },
  ],
  "This Year": [
    {
      label: "High",
      count: 680,
      color: "#EF4444",
      bg: "#FEF2F2",
    },
    {
      label: "Moderate",
      count: 524,
      color: "#F59E0B",
      bg: "#FFF7ED",
    },
    {
      label: "Low",
      count: 310,
      color: "#10B981",
      bg: "#ECFDF5",
    },
  ],
};

const kpisByPeriod: Record<
  Period,
  {
    label: string;
    value: string;
    color: string;
    note: string;
  }[]
> = {
  Today: [
    {
      label: "Total Events",
      value: "52",
      color: "#1D6AE5",
      note: "Today",
    },
    {
      label: "High Severity",
      value: "4",
      color: "#EF4444",
      note: "Requires attention",
    },
    {
      label: "Moderate",
      value: "3",
      color: "#F59E0B",
      note: "Monitor closely",
    },
    {
      label: "Low",
      value: "1",
      color: "#10B981",
      note: "Within range",
    },
    {
      label: "Active Drivers",
      value: "7",
      color: "#8B5CF6",
      note: "On duty today",
    },
    {
      label: "Vehicles",
      value: "7",
      color: "#6B7280",
      note: "In fleet",
    },
  ],
  "This Week": [
    {
      label: "Total Events",
      value: "215",
      color: "#1D6AE5",
      note: "This week",
    },
    {
      label: "High Severity",
      value: "18",
      color: "#EF4444",
      note: "Requires attention",
    },
    {
      label: "Moderate",
      value: "14",
      color: "#F59E0B",
      note: "Monitor closely",
    },
    {
      label: "Low",
      value: "9",
      color: "#10B981",
      note: "Within range",
    },
    {
      label: "Active Drivers",
      value: "7",
      color: "#8B5CF6",
      note: "This week",
    },
    {
      label: "Vehicles",
      value: "7",
      color: "#6B7280",
      note: "In fleet",
    },
  ],
  "This Month": [
    {
      label: "Total Events",
      value: "836",
      color: "#1D6AE5",
      note: "This month",
    },
    {
      label: "High Severity",
      value: "72",
      color: "#EF4444",
      note: "Requires attention",
    },
    {
      label: "Moderate",
      value: "58",
      color: "#F59E0B",
      note: "Monitor closely",
    },
    {
      label: "Low",
      value: "34",
      color: "#10B981",
      note: "Within range",
    },
    {
      label: "Active Drivers",
      value: "7",
      color: "#8B5CF6",
      note: "This month",
    },
    {
      label: "Vehicles",
      value: "7",
      color: "#6B7280",
      note: "In fleet",
    },
  ],
  "This Year": [
    {
      label: "Total Events",
      value: "7,814",
      color: "#1D6AE5",
      note: "This year",
    },
    {
      label: "High Severity",
      value: "680",
      color: "#EF4444",
      note: "Requires attention",
    },
    {
      label: "Moderate",
      value: "524",
      color: "#F59E0B",
      note: "Monitor closely",
    },
    {
      label: "Low",
      value: "310",
      color: "#10B981",
      note: "Within range",
    },
    {
      label: "Active Drivers",
      value: "7",
      color: "#8B5CF6",
      note: "This year",
    },
    {
      label: "Vehicles",
      value: "7",
      color: "#6B7280",
      note: "In fleet",
    },
  ],
};

const recentEvents = [
  {
    event: "Yawning",
    driver: "Driver 01",
    time: "10:23:14 AM",
    severity: "High",
  },
  {
    event: "Eyes Closed",
    driver: "Driver 02",
    time: "10:18:07 AM",
    severity: "High",
  },
  {
    event: "Head Pose",
    driver: "Driver 03",
    time: "10:12:45 AM",
    severity: "Moderate",
  },
  {
    event: "Body Posture",
    driver: "Driver 04",
    time: "09:58:33 AM",
    severity: "Moderate",
  },
  {
    event: "Micro Sleep",
    driver: "Driver 05",
    time: "09:45:21 AM",
    severity: "Low",
  },
  {
    event: "Blink Rate",
    driver: "Driver 06",
    time: "09:30:10 AM",
    severity: "High",
  },
  {
    event: "Yawning",
    driver: "Driver 07",
    time: "09:12:55 AM",
    severity: "High",
  },
  {
    event: "Head Pose",
    driver: "Jose Reyes",
    time: "08:50:22 AM",
    severity: "Moderate",
  },
];

const driverComparison = [
  {
    driver: "J. Dela Cruz",
    blink: 72,
    perclos: 78,
    ear: 68,
    posture: 72,
  },
  {
    driver: "M. Santos",
    blink: 88,
    perclos: 92,
    ear: 85,
    posture: 91,
  },
  {
    driver: "P. Reyes",
    blink: 65,
    perclos: 70,
    ear: 72,
    posture: 75,
  },
  {
    driver: "L. Fernandez",
    blink: 94,
    perclos: 95,
    ear: 92,
    posture: 93,
  },
  {
    driver: "R. Garcia",
    blink: 85,
    perclos: 88,
    ear: 83,
    posture: 88,
  },
  {
    driver: "C. Santos",
    blink: 60,
    perclos: 65,
    ear: 62,
    posture: 64,
  },
];

const sevMap: Record<string, { bg: string; color: string }> = {
  High: { bg: "#FEF2F2", color: "#EF4444" },
  Moderate: { bg: "#FFF7ED", color: "#F59E0B" },
  Low: { bg: "#ECFDF5", color: "#10B981" },
};

const PERIODS: Period[] = [
  "Today",
  "This Week",
  "This Month",
  "This Year",
];

export function AnalyticsPage() {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState<Period>("Today");
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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

  const eventSummary = eventsByPeriod[period];
  const totalEvents = eventSummary.reduce(
    (s, e) => s + e.count,
    0,
  );
  const sevData = sevByPeriod[period];
  const kpis = kpisByPeriod[period];

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
        `${Math.round((e.count / totalEvents) * 100)}%`,
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
            subtitle={`Total frequency per behavior category — ${period.toLowerCase()}`}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {eventSummary.map((e) => (
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
                        width: `${(e.count / totalEvents) * 100}%`,
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
                    {Math.round((e.count / totalEvents) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Severity distribution */}
          <Card
            title="Severity Distribution"
            subtitle="Breakdown of events by severity level"
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {sevData.map((s) => {
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
                          width: `${(s.count / total) * 100}%`,
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
            title={`Fleet Avg Blink Rate — ${period}`}
            subtitle="Average blinks per minute across all drivers"
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
                  name="Avg Blink Rate"
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
            title={`Fleet Avg PERCLOS — ${period}`}
            subtitle="Average eye closure percentage across all drivers"
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
                  domain={[0, 20]}
                  tick={{ fontSize: 12, fill: textSub }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [
                    `${v}%`,
                    "PERCLOS",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  name="PERCLOS"
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
            title="Driver Safety Scores"
            subtitle="Composite score per driver across all metrics"
            span={isMobile ? undefined : "1 / -1"}
          >
            {/* On mobile: fixed-width scrollable chart so all drivers show clearly */}
            <div style={{ overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" as any }}>
              <div style={{ width: isMobile ? 520 : "100%", height: isMobile ? 180 : 200 }}>
                <ResponsiveContainer key={`bar-${period}`} width="100%" height="100%">
                  <BarChart data={driverComparison} margin={{ left: -10, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="driver" tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: textSub }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="blink" name="Blink Rate" fill="#1D6AE5" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="perclos" name="PERCLOS" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="ear" name="EAR" fill="#EF4444" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="posture" name="Posture" fill="#10B981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Recent events */}
          <Card
            title="Recent Events"
            subtitle="Latest detected behavior events across all drivers"
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
                  minWidth: 380,
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
                  {recentEvents.map((e, i) => {
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