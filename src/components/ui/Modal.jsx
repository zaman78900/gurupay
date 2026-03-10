export default function Modal({ isOpen, onClose, title, children, position = "bottom" }) {
  if (!isOpen) return null;
  const isCenter = position === "center";
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 100, display: "flex",
        alignItems: isCenter ? "center" : "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          borderRadius: isCenter ? 28 : "28px 28px 0 0",
          width: isCenter ? "calc(100% - 48px)" : "100%",
          maxWidth: 430,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
        }}
      >
        {title && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{title}</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-3)" }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
