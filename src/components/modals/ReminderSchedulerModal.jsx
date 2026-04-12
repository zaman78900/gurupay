import { useState } from "react";

const fmtDateTime = (dt) =>
  dt ? new Date(dt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

const reminderOptions = [
  { label: "1 day before due date", offset: -1 },
  { label: "On due date", offset: 0 },
  { label: "1 day after due date", offset: 1 },
  { label: "3 days after due date", offset: 3 },
];

export default function ReminderSchedulerModal({ payment, student, batch, onSave, onClose }) {
  const [reminderEnabled, setReminderEnabled] = useState(!!payment?.reminderScheduledAt);
  const [reminderOffset, setReminderOffset] = useState(-1);
  const [reminders, setReminders] = useState(payment?.reminders || []);

  const calculateReminderDate = (offset) => {
    if (!payment?.dueDate) return null;
    const dueDate = new Date(payment.dueDate);
    dueDate.setDate(dueDate.getDate() + offset);
    return dueDate.toISOString();
  };

  const addReminder = () => {
    const reminderDate = calculateReminderDate(reminderOffset);
    if (!reminderDate) return;

    const newReminder = {
      id: Date.now().toString(),
      offset: reminderOffset,
      scheduledAt: reminderDate,
      sent: false,
    };

    setReminders([...reminders, newReminder]);
  };

  const removeReminder = (id) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const handleSave = async () => {
    onSave(payment, { enabled: reminderEnabled, reminders });
    onClose();
  };

  const getReminderLabel = (offset) => {
    const option = reminderOptions.find((o) => o.offset === offset);
    return option?.label || `${offset} days`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{maxWidth: 480}}>
        <div className="modal-header" style={{background: "var(--gradient-warning)", borderRadius: "16px 16px 0 0", paddingBottom: 20, color: "white"}}>
          <div style={{flex: 1}}>
            <h2 className="modal-title" style={{color: "white", fontSize: 18, marginBottom: 4}}>🔔 Schedule Reminders</h2>
            <div style={{fontSize: 13, color: "rgba(255,255,255,0.85)"}}>Set payment reminders</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{color: "white", fontSize: 24, fontWeight: "bold"}}>✕</button>
        </div>

        <div className="modal-content">
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)",
              borderRadius: "12px",
              marginBottom: 20,
              fontSize: "13px",
              border: "1px solid rgba(217, 119, 6, 0.2)",
              fontWeight: 600
            }}
          >
            <div style={{ marginBottom: 6, color: "var(--text)" }}>
              📌 {student?.name}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text4)", marginTop: 4 }}>
              Batch: {batch?.name} • Due: {payment?.dueDate ? new Date(payment.dueDate).toLocaleDateString("en-IN") : "Not set"}
            </div>
          </div>

          {/* Enable Toggle */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%)",
              borderRadius: "12px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              border: "1px solid rgba(217, 119, 6, 0.2)",
              transition: "var(--transition-smooth)"
            }}
            onClick={() => setReminderEnabled(!reminderEnabled)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.12) 100%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%)";
            }}
          >
            <div>
              <strong style={{ fontSize: "13px", color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>🔔 Enable Reminders</strong>
              <div style={{ fontSize: "11px", color: "var(--text4)", marginTop: 4 }}>
                Automatic WhatsApp reminders
              </div>
            </div>
            <div
              style={{
                width: 50,
                height: 28,
                background: reminderEnabled ? "var(--amber)" : "var(--bg4)",
                borderRadius: 99,
                transition: "var(--transition-smooth)",
                display: "flex",
                alignItems: "center",
                padding: "2px",
                flexShrink: 0
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  background: "white",
                  borderRadius: 50,
                  transition: "var(--transition-smooth)",
                  transform: reminderEnabled ? "translateX(22px)" : "translateX(0)",
                }}
              />
            </div>
          </div>

          {reminderEnabled && (
            <>
              {/* Add Reminder */}
              <div className="input-group" style={{ marginBottom: 18 }}>
                <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 13}}>+ Add Reminder</label>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                  }}
                >
                  <select
                    className="input"
                    value={reminderOffset}
                    onChange={(e) => setReminderOffset(+e.target.value)}
                    style={{ flex: 1, borderRadius: "10px" }}
                  >
                    {reminderOptions.map((opt) => (
                      <option key={opt.offset} value={opt.offset}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addReminder}
                    style={{
                      padding: "9px 16px",
                      background: "var(--gradient-warning)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "13px",
                      transition: "var(--transition-smooth)",
                      boxShadow: "0 4px 12px rgba(217, 119, 6, 0.25)",
                      whiteSpace: "nowrap"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 6px 16px rgba(217, 119, 6, 0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 4px 12px rgba(217, 119, 6, 0.25)";
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Scheduled Reminders List */}
              {reminders.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 13}}>📅 Scheduled Reminders ({reminders.length})</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        style={{
                          padding: "12px 14px",
                          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%)",
                          borderLeft: "4px solid var(--amber)",
                          borderRadius: "10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "13px",
                          border: "1px solid rgba(217, 119, 6, 0.2)"
                        }}
                      >
                        <div>
                          <strong style={{color: "var(--text)"}}>{getReminderLabel(reminder.offset)}</strong>
                          <div style={{ fontSize: "11px", color: "var(--text4)", marginTop: 3 }}>
                            {fmtDateTime(reminder.scheduledAt)}
                          </div>
                        </div>
                        <button
                          onClick={() => removeReminder(reminder.id)}
                          style={{
                            background: "var(--red)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            padding: "6px 10px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: 700,
                            transition: "var(--transition-smooth)",
                            whiteSpace: "nowrap"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#b91c1c";
                            e.target.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "var(--red)";
                            e.target.style.transform = "scale(1)";
                          }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reminders.length === 0 && (
                <div
                  style={{
                    padding: "16px",
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)",
                    borderRadius: "12px",
                    fontSize: "13px",
                    color: "var(--text2)",
                    marginBottom: 16,
                    textAlign: "center",
                    border: "1px dashed rgba(59, 130, 246, 0.2)",
                    fontWeight: 600
                  }}
                >
                  ℹ️ No reminders scheduled yet
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer" style={{paddingTop: 16}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{background: "var(--gradient-warning)", boxShadow: "0 6px 20px rgba(217, 119, 6, 0.3)"}}
          >
            Save Reminders
          </button>
        </div>
      </div>
    </div>
  );
}
