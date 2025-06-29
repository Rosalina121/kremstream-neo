// overlays/primo/src/components/SwitchHighlight.tsx
import React from "react";

type SwitchHighlightProps = {
  children: React.ReactNode;
  size?: number | string; // e.g. 80 or "5rem"
  thickness?: number | string; // e.g. 6 or "0.5rem"
  borderRadius?: string; // e.g. "50%" for circle, "1rem" for rounded, "0" for square
  className?: string;
  active?: boolean;
};

export function SwitchHighlight({
  children,
  size = 80,
  thickness = 6,
  borderRadius = "50%",
  className = "",
  active = false,
}: SwitchHighlightProps) {
  const outerSize = typeof size === "number" ? `${size}px` : size;
  const innerSize =
    typeof size === "number" && typeof thickness === "number"
      ? `${size - 2 * thickness}px`
      : `calc(${outerSize} - 2 * ${thickness})`;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{
        width: outerSize,
        height: outerSize,
        borderRadius,
      }}
    >
      {/* Standalone keyframes for spin */}
      <style>
        {`
        @keyframes switchhighlight-spin {
          100% { transform: rotate(360deg); }
        }
        `}
      </style>
      {/* Rotating conic gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius,
          background:
            "conic-gradient(from 0deg, #4E79FB 0deg, #C9A5FA 90deg, #FCD2DD 180deg, #256FEE 270deg, #4E79FB 360deg)",
          animation: "switchhighlight-spin 2s linear infinite",
          opacity: active ? 1 : 0,
        }}
      />
      {/* White background with padding */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: innerSize,
          height: innerSize,
          background: "#F4F4F4",
          borderRadius,
          padding: "0.25rem",
        }}
      >
        {children}
      </div>
    </div>
  );
}
