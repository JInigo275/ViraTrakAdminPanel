import { useEffect, useRef } from "react";
import { X, Download, FileText } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import jsPDF from "jspdf";

interface PDFPreviewModalProps {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  buildDoc: () => jsPDF;
}

export function PDFPreviewModal({
  title,
  onClose,
  onConfirm,
  buildDoc,
}: PDFPreviewModalProps) {
  const { dark } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const bg = dark ? "#1F2937" : "#fff";
  const overlay = "rgba(0,0,0,0.55)";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const border = dark ? "#374151" : "#E5E7EB";

  useEffect(() => {
    try {
      const doc = buildDoc();
      const dataUri = doc.output("datauristring");
      if (iframeRef.current) {
        iframeRef.current.src = dataUri;
      }
    } catch {
      // preview generation failed silently
    }
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: overlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 24,
        fontFamily: "Inter, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: bg,
          borderRadius: 16,
          width: "100%",
          maxWidth: 800,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            borderBottom: `1px solid ${border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "#FEF2F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={16} color="#EF4444" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: textMain }}>
                {title}
              </div>
              <div style={{ fontSize: 12, color: textSub }}>
                Review before downloading
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: textSub,
              display: "flex",
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* PDF iframe preview */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            background: dark ? "#111827" : "#F4F5F7",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <iframe
            ref={iframeRef}
            style={{
              flex: 1,
              width: "100%",
              minHeight: 420,
              border: "none",
              borderRadius: 8,
              background: "#fff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}
            title="PDF Preview"
          />
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "14px 22px",
            borderTop: `1px solid ${border}`,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              background: "transparent",
              border: `1px solid ${border}`,
              borderRadius: 8,
              fontSize: 13,
              color: textSub,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: "10px",
              background: "#EF4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
