import { useState } from "react";
import { AlertTriangle, Camera, ExternalLink, X } from "lucide-react";
import { DbAlert } from "../../api/viratrak";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useIsMobile";

interface EvidencePreviewModalProps {
  alert: DbAlert;
  onClose: () => void;
}

export function EvidencePreviewModal({ alert, onClose }: EvidencePreviewModalProps) {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const details = alert.evidenceDetails;
  const background = dark ? "#1F2937" : "#fff";
  const border = dark ? "#374151" : "#E5E7EB";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const imageUrl = details?.imageUrl;
  const [imageError, setImageError] = useState(false);
  const severityStyle = {
    High: { background: dark ? "#451A03" : "#FEF2F2", color: "#EF4444" },
    Moderate: { background: dark ? "#451A03" : "#FFF7ED", color: "#F59E0B" },
    Low: { background: dark ? "#064E3B" : "#ECFDF5", color: "#10B981" },
  }[alert.severity];
  const formatMetricLabel = (metric: string) => metric
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  const metrics = details?.triggeredMetrics ?? [];
  const metadata = [
    [
      "Captured",
      details?.timestamp
        ? new Date(details.timestamp).toLocaleString()
        : `${alert.date} ${alert.time}`,
    ],
    ["Event ID", details?.eventId || "Unavailable"],
    ["Device", details?.deviceId || "Unavailable"],
    ["Driver state", details?.driverState || "Unavailable"],
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alert.type} Evidence`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        padding: isMobile ? 8 : 20,
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.58)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          maxHeight: isMobile ? "96vh" : "92vh",
          overflow: "auto",
          background,
          borderRadius: isMobile ? 10 : 14,
          boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? 10 : 40,
            padding: isMobile ? "14px 48px 14px 14px" : "28px 64px 28px 36px",
            borderBottom: `1px solid ${border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 10 : 20,
              minWidth: 0,
              flex: isMobile ? 1 : "0 1 auto",
            }}
          >
            <div
              style={{
                width: isMobile ? 36 : 56,
                height: isMobile ? 36 : 56,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #93C5FD",
                borderRadius: isMobile ? 9 : 14,
                background: dark ? "#172554" : "#EFF6FF",
              }}
            >
              <Camera size={isMobile ? 16 : 24} color="#1D6AE5" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  color: textMain,
                  fontSize: isMobile ? 16 : 18,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {alert.type} Evidence
              </div>
              <div
                style={{
                  color: textSub,
                  fontSize: 13,
                  marginTop: isMobile ? 1 : 2,
                  overflowWrap: "anywhere",
                }}
              >
                {alert.driver} | {alert.vehicle}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: isMobile ? 6 : 8,
              alignSelf: isMobile ? "stretch" : "auto",
              minHeight: isMobile ? 20 : 40,
              marginTop: isMobile ? 2 : 0,
              padding: isMobile ? "10px 0 0" : "0 50px 0 50px",
              borderLeft: isMobile ? "none" : `2px solid ${border}`,
              borderTop: isMobile ? `1px solid ${border}` : "none",
              color: textMain,
              fontSize: isMobile ? 15 : 15,
              fontWeight: 700,
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
            }}
          >
            <span>SEVERITY:</span>
            <span
              style={{
                padding: isMobile ? "5px 10px" : "7px 14px",
                borderRadius: 999,
                background: severityStyle.background,
                color: severityStyle.color,
                fontSize: isMobile ? 15 : 15,
                lineHeight: 1.1,
              }}
            >
              {alert.severity}
            </span>
          </div>
          <button
            aria-label="Close evidence preview"
            onClick={onClose}
            style={{
              position: "absolute",
              top: isMobile ? 12 : 16,
              right: isMobile ? 10 : 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              border: 0,
              background: "transparent",
              color: textSub,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: isMobile ? 12 : 22 }}>
          <div
            style={{
              minHeight: isMobile ? 200 : 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              borderRadius: 10,
              background: dark ? "#111827" : "#F3F4F6",
              border: `1px solid ${border}`,
            }}
          >
            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt={`Evidence captured for ${alert.type}`}
                onError={() => setImageError(true)}
                style={{
                  display: "block",
                  width: "100%",
                  maxHeight: isMobile ? 300 : 480,
                  objectFit: "contain",
                }}
              />
            ) : imageError ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: 24,
                  color: textSub,
                  textAlign: "center",
                }}
              >
                <AlertTriangle size={24} color="#F59E0B" />
                <span>Evidence URL could not be loaded.</span>
              </div>
            ) : (
              <div style={{ color: textSub, fontSize: 14 }}>No image URL is attached to this event.</div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginTop: 16,
            }}
          >
            {metadata.map(([label, value]) => (
              <div
                key={label}
                style={{
                  padding: "12px 14px",
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  background: dark ? "#111827" : "#FAFAFA",
                }}
              >
                <div
                  style={{
                    color: textSub,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    color: textMain,
                    fontSize: 14,
                    marginTop: 6,
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 18,
              padding: "13px 14px",
              borderRadius: 8,
              background: dark ? "#172554" : "#EFF6FF",
              color: textSub,
              fontSize: 13,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 7,
              }}
            >
              Triggered metrics
            </div>
            {metrics.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {metrics.map((metric) => (
                  <span
                    key={metric}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 999,
                      background: dark ? "#1E40AF" : "#DBEAFE",
                      color: dark ? "#DBEAFE" : "#1E3A8A",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {formatMetricLabel(metric)}
                  </span>
                ))}
              </div>
            ) : (
              <strong style={{ color: textMain }}>None recorded</strong>
            )}
          </div>
          {imageUrl && (
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                marginTop: 15,
                color: "#1D6AE5",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <ExternalLink size={16} /> Open original image
            </a>
          )}
        </div>
      </div>
    </div>
  );
}