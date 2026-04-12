import { useState } from "react";

const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function BulkMarkPaidModal({ payments, students, batches, selectedMonth, onSave, onClose }) {
  const [selected, setSelected] = useState(new Set());
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);

  const getBatch = (batchId) => batches.find((b) => b.id === batchId);
  const getStudent = (studentId) => students.find((s) => s.id === studentId);

  const toggleSelect = (paymentId) => {
    const newSelected = new Set(selected);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === payments.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(payments.map((p) => p.id)));
    }
  };

  const selectedPayments = payments.filter((p) => selected.has(p.id));
  const selectedAmount = selectedPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleSave = async () => {
    if (selected.size === 0) {
      alert("Please select at least one payment");
      return;
    }

    onSave(selectedPayments, paidDate);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{maxWidth: 500}}>
        <div className="modal-header" style={{background: "var(--gradient-success)", borderRadius: "16px 16px 0 0", paddingBottom: 20, color: "white"}}>
          <div style={{flex: 1}}>
            <h2 className="modal-title" style={{color: "white", fontSize: 18, marginBottom: 4}}>✅ Mark as Paid</h2>
            <div style={{fontSize: 13, color: "rgba(255,255,255,0.85)"}}>Process multiple payments at once</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{color: "white", fontSize: 24, fontWeight: "bold"}}>✕</button>
        </div>

        <div className="modal-content">
          {/* Date Input */}
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 13}}>📅 Payment Date (for all selected)</label>
            <input
              type="date"
              className="input"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              style={{borderRadius: "10px"}}
            />
          </div>

          {/* Select All */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)",
              borderRadius: "12px",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              transition: "var(--transition-smooth)"
            }}
            onClick={selectAll}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.12) 100%)";
              e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)";
              e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.2)";
            }}
          >
            <input
              type="checkbox"
              checked={selected.size === payments.length && payments.length > 0}
              onChange={selectAll}
              style={{ cursor: "pointer", width: 18, height: 18, accentColor: "var(--accent)" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{fontWeight: 700, fontSize: 13, color: "var(--text)"}}>Select All Payments</div>
              <div style={{ fontSize: "11px", color: "var(--text4)", marginTop: 2 }}>
                {selected.size} of {payments.length} selected
              </div>
            </div>
            <div style={{fontWeight: 700, fontSize: 12, color: "var(--accent)"}}>
              {selected.size > 0 && `${selected.size}/${payments.length}`}
            </div>
          </div>

          {/* Payments List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "320px", overflowY: "auto", marginBottom: 16, paddingRight: 4 }}>
            {payments.map((payment) => {
              const student = getStudent(payment.studentId);
              const batch = getBatch(student?.batchId);
              const isSelected = selected.has(payment.id);

              return (
                <div
                  key={payment.id}
                  onClick={() => toggleSelect(payment.id)}
                  style={{
                    padding: "14px 16px",
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.12) 100%)"
                      : "linear-gradient(135deg, rgba(15, 23, 42, 0.02) 0%, rgba(15, 23, 42, 0.04) 100%)",
                    border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "11px",
                    cursor: "pointer",
                    transition: "var(--transition-smooth)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "var(--text4)";
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(15, 23, 42, 0.04) 0%, rgba(15, 23, 42, 0.06) 100%)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(15, 23, 42, 0.02) 0%, rgba(15, 23, 42, 0.04) 100%)";
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(payment.id)}
                    style={{ cursor: "pointer", width: 18, height: 18, accentColor: "var(--accent)" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text)" }}>
                      {student?.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text4)", marginTop: 2 }}>
                      {batch?.name}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      fontSize: "14px",
                      color: isSelected ? "var(--accent)" : "var(--text)",
                    }}
                  >
                    ₹{(payment.amount).toLocaleString("en-IN")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {selected.size > 0 && (
            <div
              style={{
                padding: "16px",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)",
                borderRadius: "12px",
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              <div style={{fontWeight: 700, color: "var(--text)", fontSize: 13}}>
                💰 {selected.size} payment{selected.size !== 1 ? 's' : ''} selected
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--accent)", fontSize: 16 }}>
                ₹{selectedAmount.toLocaleString("en-IN")}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{paddingTop: 16}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={selected.size === 0}
            style={{background: "var(--gradient-success)", boxShadow: selected.size > 0 ? "0 6px 20px rgba(16, 185, 129, 0.3)" : "none", opacity: selected.size === 0 ? 0.5 : 1}}
          >
            ✓ Mark {selected.size} as Paid
          </button>
        </div>
      </div>
    </div>
  );
}
