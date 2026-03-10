const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", emoji: "🏠" },
  { id: "fees",      label: "Fee",       emoji: "💰" },
  { id: "batches",   label: "Batches",   emoji: "👥" },
  { id: "reports",   label: "Reports",   emoji: "📊" },
  { id: "settings",  label: "Settings",  emoji: "⚙️" },
];

export default function BottomNav({ activePage, setPage, pendingCount = 0 }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%",
      transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: "var(--surface)",
      borderTop: "1px solid var(--border)",
      display: "flex", padding: "8px 0 14px",
      zIndex: 60,
    }}>
      {NAV_ITEMS.map(n => (
        <div
          key={n.id}
          onClick={() => setPage(n.id)}
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3, cursor: "pointer",
            position: "relative", padding: "4px 0",
          }}
        >
          {activePage === n.id && (
            <div style={{
              width: 5, height: 5, background: "#1B8A5A",
              borderRadius: "50%", position: "absolute", top: 0,
            }} />
          )}
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: 20 }}>{n.emoji}</span>
            {n.id === "fees" && pendingCount > 0 && (
              <div style={{
                position: "absolute", top: -4, right: -8,
                width: 16, height: 16, background: "#EF4444",
                borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 900, color: "white",
              }}>
                {pendingCount}
              </div>
            )}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: activePage === n.id ? "#1B8A5A" : "var(--text-3)",
            fontFamily: "Outfit, sans-serif",
          }}>
            {n.label}
          </span>
        </div>
      ))}
    </div>
  );
}
