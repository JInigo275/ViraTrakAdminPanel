import { type LucideIcon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useIsMobile";

interface PageHeaderProps {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export function PageHeader({ icon: Icon, iconColor = "#1D6AE5", title, subtitle, children }: PageHeaderProps) {
  const { dark } = useTheme();
  const isMobile = useIsMobile();

  const cardBg      = dark ? "#1F2937" : "#fff";
  const textMain    = dark ? "#F9FAFB" : "#111827";
  const textSub     = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#E8EAED";
  const shadow      = dark ? "0 1px 6px rgba(0,0,0,0.3)" : "0 1px 6px rgba(0,0,0,0.06)";

  // Derive a soft tinted background from the icon color
  const iconBgOpacity = dark ? "22" : "14";
  const iconBg = iconColor + iconBgOpacity;

  return (
    <div style={{
      background: cardBg,
      borderRadius: 14,
      boxShadow: shadow,
      border: `1px solid ${borderColor}`,
      marginBottom: isMobile ? 8 : 20,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Left accent stripe */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 4,
        bottom: 0,
        background: iconColor,
        borderRadius: "14px 0 0 14px",
        pointerEvents: "none",
      }} />

      <div style={{
        display: "flex",
        alignItems: isMobile ? "stretch" : "center",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 6 : 0,
        padding: isMobile ? "10px 14px 10px 16px" : "18px 20px 18px 24px",
      }}>
        {/* Icon + text */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: Icon ? 14 : 0,
          flex: 1,
          minWidth: 0,
        }}>
          {Icon && (
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: iconBg,
              border: `1.5px solid ${iconColor}28`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon size={20} color={iconColor} strokeWidth={2} />
            </div>
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: isMobile ? 16 : 18,
              fontWeight: 700,
              color: textMain,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}>
              {title}
            </div>
            <div style={{ fontSize: 13, color: textSub, marginTop: 3, lineHeight: 1.4 }}>
              {subtitle}
            </div>
          </div>
        </div>

        {/* Right actions slot */}
        {children && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            flexShrink: 0,
            width: isMobile ? "100%" : "auto",
            justifyContent: isMobile ? "space-between" : "center",
          }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
