import { useTheme } from "../context/ThemeContext";

export function LoadingState({
  label = "Loading ViraTrak data...",
}: {
  label?: string;
}) {
  const { dark } = useTheme();
  const text = dark ? "#F9FAFB" : "#111827";
  const muted = dark ? "#9CA3AF" : "#6B7280";
  const panel = dark ? "#1F2937" : "#fff";

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        minHeight: "100vh",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: dark ? "#111827" : "#F4F5F7",
      }}
    >
      <div
        role="status"
        aria-live="polite"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          minWidth: 220,
          padding: "28px 32px",
          background: panel,
          borderRadius: 14,
          boxShadow: dark
            ? "0 8px 30px rgba(0,0,0,.22)"
            : "0 8px 30px rgba(15,23,42,.08)",
        }}
      >
        <div className="viratrak-loader" aria-hidden="true">
          <span className="viratrak-loader-ring viratrak-loader-ring-outer" />
          <span className="viratrak-loader-ring viratrak-loader-ring-middle" />
          <span className="viratrak-loader-ring viratrak-loader-ring-inner" />
        </div>
        <div style={{ color: text, fontSize: 15, fontWeight: 600 }}>
          {label}
        </div>
        <div style={{ color: muted, fontSize: 13 }}>Please wait a moment.</div>
        <style>{`
          .viratrak-loader {
            position: relative;
            width: 7rem;
            height: 7rem;
            flex-shrink: 0;
          }
          .viratrak-loader-ring {
            position: absolute;
            inset: 0;
            border: 4px solid transparent;
            border-top-color: #1D6AE5;
            border-radius: 50%;
            animation: viratrak-rotate 2s infinite linear;
          }
          .viratrak-loader-ring-middle {
            inset: 6px;
            border-top-color: #10B981;
          }
          .viratrak-loader-ring-inner {
            inset: 12px;
            border-top-color: #1D6AE5;
            animation-duration: 1s;
          }
          @keyframes viratrak-rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
