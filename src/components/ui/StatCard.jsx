export default function StatCard({ label, value, icon, color, bg }) {
  return (
    <div style={{
      background: bg || "var(--surface)",
      borderRadius: 18, padding: 16,
      border: bg ? "none" : "1px solid var(--border)",
    }}>
      {icon && (
        <div style={{
          width: 36, height: 36, background: bg ? "rgba(255,255,255,0.3)" : "var(--surface-3)",
          borderRadius: 10, display: "flex", alignItems: "center",
          justifyContent: "center", marginBottom: 10,
        }}>
          {icon}
        </div>
      )}
      <p style={{ fontSize: 20, fontWeight: 900, color: color || "var(--text)" }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: color || "var(--text-3)", opacity: 0.8, marginTop: 2 }}>
        {label}
      </p>
    </div>
  );
}
