import { Eye, Wind, Navigation, Zap, User } from "lucide-react";

const statusRows = [
  { icon: Eye, label: "Eyes", value: "Open", color: "#10B981", bg: "#ECFDF5" },
  { icon: Wind, label: "Yawning", value: "No", color: "#10B981", bg: "#ECFDF5" },
  { icon: Navigation, label: "Head Pose", value: "Normal", color: "#1D6AE5", bg: "#EBF2FF" },
  { icon: Zap, label: "Distraction", value: "No", color: "#10B981", bg: "#ECFDF5" },
  { icon: User, label: "Posture", value: "Good", color: "#10B981", bg: "#ECFDF5" },
];

const vehicleInfo = [
  { label: "Vehicle ID", value: "TRK-101" },
  { label: "Driver", value: "Juan Dela Cruz" },
  { label: "Route", value: "Manila → Clark" },
  { label: "Speed", value: "62 km/h" },
];

export function LiveMonitoring() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Live Monitoring</span>
          <div className="flex items-center gap-1.5">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10B981",
                display: "inline-block",
                animation: "pulse 1.5s infinite",
              }}
            />
            <span style={{ fontSize: 12, color: "#10B981", fontWeight: 500 }}>Live</span>
          </div>
        </div>
        <a href="#" style={{ fontSize: 13, color: "#1D6AE5", textDecoration: "none", fontWeight: 500 }}>
          View All
        </a>
      </div>

      <div className="flex" style={{ gap: 0 }}>
        {/* Camera feed */}
        <div
          className="relative"
          style={{
            flex: "0 0 320px",
            minWidth: 320,
            height: 230,
            background: "#1a1a2e",
            overflow: "hidden",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=390&h=260&fit=crop&auto=format&grayscale"
            alt="Driver cabin camera feed"
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }}
          />

          {/* Bounding box overlay */}
          <div
            style={{
              position: "absolute",
              top: "28%",
              left: "30%",
              width: 110,
              height: 130,
              border: "2px solid #10B981",
              borderRadius: 4,
              boxShadow: "0 0 0 1px rgba(16,185,129,0.2)",
            }}
          >
            {/* Corner dots */}
            {[
              { x: 0, y: 0, k: "tl" }, { x: 50, y: 0, k: "tc" }, { x: 100, y: 0, k: "tr" },
              { x: 0, y: 50, k: "ml" }, { x: 100, y: 50, k: "mr" },
              { x: 0, y: 100, k: "bl" }, { x: 50, y: 100, k: "bc" }, { x: 100, y: 100, k: "br" },
            ].map(({ x, y, k }) => (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#10B981",
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
          </div>

          {/* CAM badge */}
          <div
            className="absolute"
            style={{
              top: 10,
              left: 10,
              background: "rgba(0,0,0,0.6)",
              borderRadius: 5,
              padding: "3px 8px",
              fontSize: 11,
              color: "#fff",
              fontWeight: 500,
              backdropFilter: "blur(4px)",
            }}
          >
            CAM 01 • Cabin
          </div>

          {/* Timestamp */}
          <div
            className="absolute"
            style={{
              top: 10,
              right: 10,
              background: "rgba(0,0,0,0.6)",
              borderRadius: 5,
              padding: "3px 8px",
              fontSize: 11,
              color: "#fff",
              backdropFilter: "blur(4px)",
            }}
          >
            10:24:15 AM
          </div>

          {/* REC indicator */}
          <div
            className="absolute flex items-center gap-1"
            style={{
              bottom: 10,
              left: 10,
              background: "rgba(0,0,0,0.6)",
              borderRadius: 5,
              padding: "3px 8px",
              backdropFilter: "blur(4px)",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 700 }}>REC</span>
          </div>
        </div>

        {/* Right info */}
        <div className="flex flex-col gap-4 flex-1 p-5">
          {/* Detected status */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Detected Status
            </div>
            <div className="flex flex-col gap-2">
              {statusRows.map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        background: bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={13} color={color} />
                    </div>
                    <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 13, color, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle info */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Vehicle Info
            </div>
            <div className="flex flex-col gap-1.5">
              {vehicleInfo.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>{label}</span>
                  <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
