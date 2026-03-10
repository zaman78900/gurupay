const map = {
  paid:    { bg: "#DCFCE7", color: "#15803D", label: "✓ Paid" },
  pending: { bg: "#FEF3C7", color: "#D97706", label: "Pending" },
  overdue: { bg: "#FEE2E2", color: "#DC2626", label: "Overdue" },
  pro:     { bg: "linear-gradient(135deg,#1B8A5A,#22A96E)", color: "white", label: "PRO" },
};

export default function Badge({ status, label }) {
  const s = map[status] || { bg: "#F1F5F9", color: "#475569", label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "2px 9px", borderRadius: 999,
      fontSize: 10, fontWeight: 800,
      fontFamily: "Outfit, sans-serif",
      display: "inline-flex", alignItems: "center",
    }}>
      {label || s.label}
    </span>
  );
}
