const PAGE_TITLES = {
  fees: "Fee Management",
  batches: "Batches & Students",
  reports: "Reports & Analytics",
  settings: "Settings",
};

export default function TopBar({ page, dark, setDark }) {
  if (page === "dashboard") {
    return (
      <div style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "14px 18px", display: "flex",
        alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: "linear-gradient(135deg,#1B8A5A,#22A96E)",
            borderRadius: 10, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontWeight: 900, color: "white", fontSize: 16,
          }}>G</div>
          <span style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", letterSpacing: -0.3 }}>
            GuruPay Pro
          </span>
        </div>
        <button onClick={() => setDark(!dark)} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "var(--surface-2)", border: "1px solid var(--border)",
          cursor: "pointer", fontSize: 16,
        }}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>
    );
  }
  return (
    <div style={{
      background: "var(--surface)", borderBottom: "1px solid var(--border)",
      padding: "14px 18px", display: "flex",
      alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", letterSpacing: -0.3 }}>
        {PAGE_TITLES[page] || page}
      </span>
      <button onClick={() => setDark(!dark)} style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "var(--surface-2)", border: "1px solid var(--border)",
        cursor: "pointer", fontSize: 16,
      }}>
        {dark ? "☀️" : "🌙"}
      </button>
    </div>
  );
}
