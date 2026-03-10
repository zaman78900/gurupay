export default function Avatar({ name = "", size = 36, bg = "#1B8A5A" }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, display: "flex", alignItems: "center",
      justifyContent: "center", color: "white",
      fontWeight: 800, fontSize: size * 0.35, flexShrink: 0,
      fontFamily: "Outfit, sans-serif",
    }}>
      {initials}
    </div>
  );
}
