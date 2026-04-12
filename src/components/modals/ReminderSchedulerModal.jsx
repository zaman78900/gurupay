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
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{maxWidth: 500, borderRadius: "16px", boxShadow: "0 20px 64px rgba(0,0,0,0.15)", overflow: "hidden"}}>
        <div className="modal-header" style={{background: "linear-gradient(135deg, var(--amber) 0%, var(--orange) 100%)", paddingBottom: 20, paddingTop: 24, color: "white"}}>
          <div style={{flex: 1}}>
            <h2 className="modal-title" style={{color: "white", fontSize: 18, marginBottom: 6, fontWeight: 700}}>🔔 Schedule Payment Reminders</h2>
            <div style={{fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500}}>Automatic WhatsApp notifications</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{color: "white", fontSize: 24, fontWeight: "bold", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s"}} onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.3)"; }} onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.2)"; }}>✕</button>
        </div>

        <div className="modal-content" style={{padding: "24px", background: "var(--bg2)"}}>
          {/* Payment Info Card */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)",
              borderRadius: "12px",
              marginBottom: 24,
              fontSize: "13px",
              border: "1.5px solid rgba(217, 119, 6, 0.2)",
              fontWeight: 600
            }}
          >
            <div style={{ marginBottom: 8, color: "var(--text)", fontWeight: 700 }}>
              👤 {student?.name}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text3)", marginTop: 2 }}>
              Batch: <span style={{fontWeight: 700, color: "var(--text)"}}>{batch?.name}</span>
            </div>
            {payment?.dueDate && (
              <div style={{ fontSize: "12px", color: "var(--text3)", marginTop: 2 }}>
                Due: <span style={{fontWeight: 700, color: "var(--amber)"}}>{new Date(payment.dueDate).toLocaleDateString("en-IN")}</span>
              </div>
            )}
          </div>

          {/* Reminder Toggle */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%)",
              borderRadius: "12px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              border: "1.5px solid rgba(217, 119, 6, 0.2)",
              transition: "all 0.2s ease"
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
              <strong style={{ fontSize: "13px", color: "var(--text)", display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>🔔 Enable Reminders</strong>
              <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: 4, fontWeight: 500 }}>
                Send WhatsApp notifications before due date
              </div>
            </div>
            <div
              style={{
                width: 50,
                height: 28,
                background: reminderEnabled ? "var(--amber)" : "var(--bg4)",
                borderRadius: 99,
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                padding: "2px",
                flexShrink: 0,
                boxShadow: reminderEnabled ? "0 4px 12px rgba(217, 119, 6, 0.25)" : "none"
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  background: "white",
                  borderRadius: 50,
                  transition: "all 0.3s ease",
                  transform: reminderEnabled ? "translateX(22px)" : "translateX(0)",
                }}
              />
            </div>
          </div>

          {reminderEnabled && (
            <>
              {/* Add Reminder Section */}
              <div style={{ marginBottom: 20 }}>
                <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 13, marginBottom: 10, display: "block"}}>+ Add Reminder Timing</label>
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
                    style={{ flex: 1, borderRadius: "10px", borderWidth: "1.5px", padding: "10px 12px", fontSize: 13 }}
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
                      padding: "10px 18px",
                      background: "linear-gradient(135deg, var(--amber) 0%, var(--orange) 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "13px",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 12px rgba(217, 119, 6, 0.25)",
                      whiteSpace: "nowrap",
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 6px 18px rgba(217, 119, 6, 0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 4px 12px rgba(217, 119, 6, 0.25)";
                    }}
                  >
                    ＋ Add
                  </button>
                </div>
              </div>

              {/* Scheduled Reminders List */}
              {reminders.length > 0 ? (
                <div style={{ marginBottom: 20 }}>
                  <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 13, marginBottom: 10, display: "block"}}>📋 Scheduled Reminders ({reminders.length})</label>
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
                          border: "1px solid rgba(217, 119, 6, 0.2)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div>
                          <strong style={{color: "var(--text)", fontWeight: 700}}>{getReminderLabel(reminder.offset)}</strong>
                          <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: 4, fontWeight: 500 }}>
                            ⏰ {fmtDateTime(reminder.scheduledAt)}
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
                            transition: "all 0.2s ease",
                            whiteSpace: "nowrap",
                            flexShrink: 0
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
              ) : (
                <div style={{padding: "16px 14px", background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)", borderRadius: "12px", fontSize: "13px", color: "var(--text3)", marginBottom: 20, textAlign: "center", border: "1px dashed rgba(59, 130, 246, 0.2)", fontWeight: 600}}>
                  ➕ Add reminders above
                </div>
              )}

              {/* Info Box */}
              <div style={{padding: "12px", background: "linear-gradient(135deg, rgba(147, 51, 234, 0.08) 0%, rgba(79, 172, 254, 0.08) 100%)", borderRadius: "10px", fontSize: "12px", color: "var(--text3)", border: "1px solid rgba(147, 51, 234, 0.15)"}}>
                💡 <strong>Tip:</strong> Reminders will be sent via WhatsApp on the scheduled dates
              </div>
            </>
          )}
        </div>

        <div className="modal-footer" style={{paddingTop: 16, paddingBottom: 20, paddingLeft: 24, paddingRight: 24, background: "var(--bg2)", display: "flex", gap: 10}}>
          <button className="btn btn-secondary" onClick={onClose} style={{flex: 1, borderRadius: "10px", padding: "10px 16px", fontWeight: 600}}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{flex: 1, borderRadius: "10px", padding: "10px 16px", fontWeight: 600, background: "linear-gradient(135deg, var(--amber) 0%, var(--orange) 100%)", color: "white", border: "none", boxShadow: "0 6px 20px rgba(217, 119, 6, 0.3)", cursor: "pointer"}}
          >
            Save Reminders
          </button>
        </div>
      </div>
    </div>
  );
}
