export default function EmptyState({ emoji = "📭", title, subtitle, actionLabel, onAction }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 20px", textAlign: "center",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{emoji}</div>
      <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{title}</p>
      {subtitle && <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20 }}>{subtitle}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} style={{
          background: "#1B8A5A", color: "white", border: "none",
          borderRadius: 12, padding: "10px 20px",
          fontFamily: "Outfit, sans-serif", fontWeight: 700,
          fontSize: 14, cursor: "pointer",
        }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
