import { useState } from "react";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

const daysUntil = (d) => {
  if (!d) return null;
  const now = new Date();
  const dueDate = new Date(d);
  const diff = dueDate - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
};

const presets = [
  { label: "Due in 7 days", offset: 7 },
  { label: "Due in 14 days", offset: 14 },
  { label: "End of month", offset: "eom" },
  { label: "Due in 30 days", offset: 30 },
];

export default function SetPaymentDueDateModal({ payment, onSave, onClose }) {
  const [dueDate, setDueDate] = useState(payment?.dueDate || "");

  const applyPreset = (offset) => {
    const today = new Date();
    let date = new Date(today);

    if (offset === "eom") {
      date = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else {
      date.setDate(date.getDate() + offset);
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    setDueDate(`${yyyy}-${mm}-${dd}`);
  };

  const days = daysUntil(dueDate);

  const handleSave = () => {
    if (!dueDate) {
      alert("Please select a due date");
      return;
    }
    onSave({ ...payment, dueDate });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{maxWidth: 480, borderRadius: "16px", boxShadow: "0 20px 64px rgba(0,0,0,0.15)", overflow: "hidden"}}>
        <div className="modal-header" style={{background: "linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)", paddingBottom: 20, paddingTop: 24, color: "white"}}>
          <div style={{flex: 1}}>
            <h2 className="modal-title" style={{color: "white", fontSize: 18, marginBottom: 6, fontWeight: 700}}>📅 Set Payment Due Date</h2>
            <div style={{fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500}}>Configure when payment is due</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{color: "white", fontSize: 24, fontWeight: "bold", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s"}} onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.3)"; }} onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.2)"; }}>✕</button>
        </div>

        <div className="modal-content" style={{padding: "24px", background: "var(--bg2)"}}>
          <div style={{ marginBottom: 24 }}>
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 13, marginBottom: 8, display: "block"}}>Select Due Date</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ borderRadius: "10px", borderWidth: "1.5px", padding: "10px 12px", fontSize: 14 }}
            />
            {dueDate && (
              <div className="input-hint" style={{color: days > 0 ? "var(--accent)" : days === 0 ? "var(--amber)" : "var(--red)", fontWeight: 600, marginTop: 8, display: "flex", alignItems: "center", gap: 6}}>
                {days > 0 ? `✓` : days === 0 ? `🔔` : `⚠️`} {days > 0 ? `Due in ${days} day${days !== 1 ? 's' : ''}` : days === 0 ? `Due today` : `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 13, marginBottom: 10, display: "block"}}>⚡ Quick Presets</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset.offset)}
                  style={{
                    padding: "11px 14px",
                    border: dueDate && new Date(dueDate).toDateString() === (preset.offset === "eom" ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toDateString() : new Date(new Date().setDate(new Date().getDate() + preset.offset)).toDateString()) ? "2px solid var(--blue)" : "1.5px solid var(--border)",
                    borderRadius: "10px",
                    background: dueDate && new Date(dueDate).toDateString() === (preset.offset === "eom" ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toDateString() : new Date(new Date().setDate(new Date().getDate() + preset.offset)).toDateString()) ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)" : "var(--bg3)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: dueDate && new Date(dueDate).toDateString() === (preset.offset === "eom" ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toDateString() : new Date(new Date().setDate(new Date().getDate() + preset.offset)).toDateString()) ? "var(--blue)" : "var(--text)",
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)";
                    e.target.style.borderColor = "var(--blue)";
                    e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    const isSelected = dueDate && new Date(dueDate).toDateString() === (preset.offset === "eom" ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toDateString() : new Date(new Date().setDate(new Date().getDate() + preset.offset)).toDateString());
                    e.target.style.background = isSelected ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)" : "var(--bg3)";
                    e.target.style.borderColor = isSelected ? "var(--blue)" : "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {dueDate && (
            <div
              style={{
                padding: "14px 16px",
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)",
                borderRadius: "12px",
                marginBottom: 16,
                fontSize: "13px",
                color: "var(--text2)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                fontWeight: 600
              }}
            >
              <div style={{marginBottom: 6, color: "var(--text3)"}}>📋 Summary</div>
              <div style={{fontSize: 15, color: "var(--text)", fontWeight: 700}}>{fmtDate(dueDate)}</div>
              {days !== null && (
                <div style={{fontSize: 12, marginTop: 6, color: days > 0 ? "var(--accent)" : days === 0 ? "var(--amber)" : "var(--red)", fontWeight: 600}}>
                  {days > 0 ? `✓ Due in ${days} day${days !== 1 ? 's' : ''}` : days === 0 ? `🔔 Due today` : `⚠️ ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`}
                </div>
              )}
            </div>
          )}

          <div style={{padding: "12px", background: "linear-gradient(135deg, rgba(147, 51, 234, 0.08) 0%, rgba(79, 172, 254, 0.08) 100%)", borderRadius: "10px", fontSize: "12px", color: "var(--text3)", border: "1px solid rgba(147, 51, 234, 0.15)"}}>
            💡 <strong>Tip:</strong> Set a due date to enable automatic WhatsApp reminders
          </div>
        </div>

        <div className="modal-footer" style={{paddingTop: 16, paddingBottom: 20, paddingLeft: 24, paddingRight: 24, background: "var(--bg2)", display: "flex", gap: 10}}>
          <button className="btn btn-secondary" onClick={onClose} style={{flex: 1, borderRadius: "10px", padding: "10px 16px", fontWeight: 600}}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{flex: 1, borderRadius: "10px", padding: "10px 16px", fontWeight: 600, background: "linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)", color: "white", border: "none", boxShadow: "0 6px 20px rgba(59, 130, 246, 0.3)", cursor: dueDate ? "pointer" : "not-allowed", opacity: dueDate ? 1 : 0.6}}
            disabled={!dueDate}
          >
            Set Due Date
          </button>
        </div>
      </div>
    </div>
  );
}
