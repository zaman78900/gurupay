import React from "react";

const variants = {
  primary: { background: "#1B8A5A", color: "white", border: "none" },
  outline: { background: "transparent", color: "#1B8A5A", border: "1.5px solid #1B8A5A" },
  danger: { background: "transparent", color: "#EF4444", border: "1.5px solid #EF4444" },
  orange: { background: "transparent", color: "#F97316", border: "1.5px solid #F97316" },
  gray: { background: "var(--surface-3)", color: "var(--text-2)", border: "1px solid var(--border)" },
  ghost: { background: "none", color: "var(--text-2)", border: "none" },
};

const sizes = {
  sm: { padding: "6px 12px", fontSize: 12, borderRadius: 8 },
  md: { padding: "10px 18px", fontSize: 14, borderRadius: 12 },
  lg: { padding: "14px 24px", fontSize: 15, borderRadius: 14 },
};

export default function Button({
  children, variant = "primary", size = "md",
  onClick, disabled, fullWidth, style = {}, icon
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        gap: 6, fontFamily: "Outfit, sans-serif", fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        width: fullWidth ? "100%" : "auto",
        transition: "all 0.15s",
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
    >
      {icon && icon}
      {children}
    </button>
  );
}
