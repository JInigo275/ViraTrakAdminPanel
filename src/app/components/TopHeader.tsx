import { ChevronDown } from "lucide-react";

export function TopHeader() {
  return (
    <header
      className="flex items-center justify-between px-6"
      style={{
        height: 64,
        background: "#fff",
        borderBottom: "1px solid #E8EAED",
        fontFamily: "Inter, sans-serif",
        flexShrink: 0,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 20, color: "#111827", lineHeight: 1.2 }}>Dashboard</div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.3 }}>Overview of driver behavior and system status</div>
      </div>

      <div className="flex items-center gap-4">
        {/* User */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#1D6AE5",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            AU
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>Admin User</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.2 }}>Administrator</div>
          </div>
          <ChevronDown size={14} color="#9CA3AF" />
        </div>
      </div>
    </header>
  );
}
