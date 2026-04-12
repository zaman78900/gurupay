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
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{maxWidth: 460}}>
        <div className="modal-header" style={{background: "var(--gradient-primary)", borderRadius: "16px 16px 0 0", paddingBottom: 20, color: "white"}}>
          <div style={{flex: 1}}>
            <h2 className="modal-title" style={{color: "white", fontSize: 18, marginBottom: 4}}>📅 Set Due Date</h2>
            <div style={{fontSize: 13, color: "rgba(255,255,255,0.85)"}}>Configure payment deadline</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{color: "white", fontSize: 24, fontWeight: "bold"}}>✕</button>
        </div>

        <div className="modal-content">
          <div style={{ marginBottom: 20 }}>
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 13}}>Select Due Date</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ marginBottom: 8, borderRadius: "10px" }}
            />
            {dueDate && (
              <div className="input-hint" style={{color: days > 0 ? "var(--accent)" : days === 0 ? "var(--amber)" : "var(--red)", fontWeight: 600}}>
                {days > 0 ? `✓ Due in ${days} days` : days === 0 ? "🔔 Due today" : `⚠️ ${Math.abs(days)} days overdue`}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 13}}>⚡ Quick Presets</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset.offset)}
                  style={{
                    padding: "12px 14px",
                    border: "1.5px solid var(--border)",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text)",
                    transition: "var(--transition-smooth)",
                    position: "relative",
                    overflow: "hidden"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "var(--gradient-primary)";
                    e.target.style.color = "white";
                    e.target.style.border = "1.5px solid var(--blue)";
                    e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%)";
                    e.target.style.color = "var(--text)";
                    e.target.style.border = "1.5px solid var(--border)";
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
                padding: "16px 14px",
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)",
                borderRadius: "12px",
                marginBottom: 16,
                fontSize: "13px",
                color: "var(--text2)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                fontWeight: 600
              }}
            >
              <div style={{marginBottom: 6}}>📅 Due Date</div>
              <div style={{fontSize: 15, color: "var(--text)", fontWeight: 700}}>{fmtDate(dueDate)}</div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{paddingTop: 16}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{background: "var(--gradient-primary)", boxShadow: "0 6px 20px rgba(59, 130, 246, 0.3)"}}
          >
            Set Due Date
          </button>
        </div>
      </div>
    </div>
  );
}
