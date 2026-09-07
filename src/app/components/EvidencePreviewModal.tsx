import { Camera, ExternalLink, X } from "lucide-react";
import { DbAlert } from "../../api/viratrak";
import { useTheme } from "../context/ThemeContext";

interface EvidencePreviewModalProps {
  alert: DbAlert;
  onClose: () => void;
}

export function EvidencePreviewModal({ alert, onClose }: EvidencePreviewModalProps) {
  const { dark } = useTheme();
  const details = alert.evidenceDetails;
  const background = dark ? "#1F2937" : "#fff";
  const border = dark ? "#374151" : "#E5E7EB";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const imageUrl = details?.imageUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alert.type} evidence`}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 2000, padding: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.58)", fontFamily: "Inter, sans-serif" }}
    >
      <div style={{ width: "100%", maxWidth: 760, maxHeight: "92vh", overflow: "auto", background, borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Camera size={18} color="#1D6AE5" />
            <div>
              <div style={{ color: textMain, fontSize: 16, fontWeight: 700 }}>{alert.type} evidence</div>
              <div style={{ color: textSub, fontSize: 12 }}>{alert.driver} · {alert.vehicle}</div>
            </div>
          </div>
          <button aria-label="Close evidence preview" onClick={onClose} style={{ border: 0, background: "transparent", color: textSub, cursor: "pointer", padding: 4 }}>
            <X size={19} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 10, background: dark ? "#111827" : "#F3F4F6" }}>
            {imageUrl ? (
              <img src={imageUrl} alt={`Evidence captured for ${alert.type}`} style={{ width: "100%", maxHeight: 430, objectFit: "cover" }} />
            ) : (
              <div style={{ color: textSub, fontSize: 14 }}>No image URL is attached to this event.</div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 18 }}>
            {[
              ["Captured", details?.timestamp ? new Date(details.timestamp).toLocaleString() : "Unavailable"],
              ["Event ID", details?.eventId || "Unavailable"],
              ["Device", details?.deviceId || "Unavailable"],
              ["Driver state", details?.driverState || "Unavailable"],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: "11px 12px", border: `1px solid ${border}`, borderRadius: 8 }}>
                <div style={{ color: textSub, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                <div style={{ color: textMain, fontSize: 13, marginTop: 5, wordBreak: "break-word" }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, color: textSub, fontSize: 13 }}>
            Triggered metrics: <strong style={{ color: textMain }}>{details?.triggeredMetrics.join(", ") || "None recorded"}</strong>
          </div>
          {imageUrl && (
            <a href={imageUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14, color: "#1D6AE5", fontSize: 13, fontWeight: 600 }}>
              <ExternalLink size={14} /> Open original image
            </a>
          )}
        </div>
      </div>
    </div>
  );
}