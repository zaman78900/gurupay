export default function ProgressBar({ value = 0, height = 6, showLabel = false }) {
  const color = value >= 80 ? "#10B981" : value >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
      <div style={{
        height, background: "var(--surface-3)",
        borderRadius: 99, flex: 1, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${Math.min(value, 100)}%`,
          background: color, borderRadius: 99,
          transition: "width 0.5s ease",
        }} />
      </div>
      {showLabel && (
        <span style={{ fontSize: 11, fontWeight: 800, color, minWidth: 32 }}>
          {value}%
        </span>
      )}
    </div>
  );
}
