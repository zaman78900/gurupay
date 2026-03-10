export default function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 99,
        background: on ? "#1B8A5A" : "#E2E8F0",
        border: "none", cursor: "pointer",
        position: "relative", transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", width: 18, height: 18,
        background: "white", borderRadius: "50%",
        top: 3, left: on ? 23 : 3,
        transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}
