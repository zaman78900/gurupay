import { useState } from "react";

const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

export default function SetInstallmentsModal({ payment, student, batch, onSave, onClose }) {
  const [numInstallments, setNumInstallments] = useState(3);
  const [spacing, setSpacing] = useState(30);
  const maxInstallments = 6;

  const calculateInstallments = () => {
    if (numInstallments < 1 || numInstallments > maxInstallments) return [];
    const amountPerInstallment = Math.floor(payment.amount / numInstallments);
    const firstAmount = amountPerInstallment + (payment.amount % numInstallments);

    const installments = [];
    const today = new Date();

    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + (i === 0 ? spacing : spacing + i * 30));

      const yyyy = dueDate.getFullYear();
      const mm = String(dueDate.getMonth() + 1).padStart(2, "0");
      const dd = String(dueDate.getDate()).padStart(2, "0");

      installments.push({
        installmentNumber: i + 1,
        amount: i === 0 ? firstAmount : amountPerInstallment,
        dueDate: `${yyyy}-${mm}-${dd}`,
      });
    }

    return installments;
  };

  const installments = calculateInstallments();
  const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);

  const handleSave = async () => {
    onSave(payment, installments);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{maxWidth: 480}}>
        <div className="modal-header" style={{background: "var(--gradient-success)", borderRadius: "16px 16px 0 0", paddingBottom: 20, color: "white"}}>
          <div style={{flex: 1}}>
            <h2 className="modal-title" style={{color: "white", fontSize: 18, marginBottom: 4}}>💳 Split into Installments</h2>
            <div style={{fontSize: 13, color: "rgba(255,255,255,0.85)"}}>Create flexible payment plan</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{color: "white", fontSize: 24, fontWeight: "bold"}}>✕</button>
        </div>

        <div className="modal-content">
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)",
              borderRadius: "12px",
              marginBottom: 20,
              fontSize: "13px",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              fontWeight: 600
            }}
          >
            <div style={{ marginBottom: 6, color: "var(--text)" }}>
              👤 {student?.name}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text4)", marginTop: 4 }}>
              {batch?.name} • Total: <span style={{color: "var(--text)", fontWeight: 700, fontSize: 14}}>₹{(payment.amount).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Number of Installments */}
          <div className="input-group" style={{ marginBottom: 18 }}>
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 13}}>📊 Number of Installments</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[2, 3, 4, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumInstallments(num)}
                  style={{
                    padding: "12px",
                    border: `2px solid ${numInstallments === num ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "10px",
                    background: numInstallments === num ? "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.12) 100%)" : "linear-gradient(135deg, rgba(15, 23, 42, 0.02) 0%, rgba(15, 23, 42, 0.04) 100%)",
                    cursor: "pointer",
                    fontWeight: numInstallments === num ? 700 : 600,
                    color: numInstallments === num ? "var(--accent)" : "var(--text)",
                    transition: "var(--transition-smooth)",
                    fontSize: 14
                  }}
                  onMouseEnter={(e) => {
                    if (numInstallments !== num) {
                      e.target.style.borderColor = "var(--text4)";
                      e.target.style.background = "linear-gradient(135deg, rgba(15, 23, 42, 0.04) 0%, rgba(15, 23, 42, 0.06) 100%)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (numInstallments !== num) {
                      e.target.style.borderColor = "var(--border)";
                      e.target.style.background = "linear-gradient(135deg, rgba(15, 23, 42, 0.02) 0%, rgba(15, 23, 42, 0.04) 100%)";
                    }
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Spacing */}
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 13}}>⏰ First Payment Offset</label>
            <select
              className="input"
              value={spacing}
              onChange={(e) => setSpacing(+e.target.value)}
              style={{borderRadius: "10px"}}
            >
              <option value={7}>7 days from now</option>
              <option value={14}>14 days from now</option>
              <option value={30}>30 days from now</option>
            </select>
          </div>

          {/* Installment Breakdown */}
          <div style={{ marginBottom: 16 }}>
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 13}}>📅 Installment Schedule</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 250, overflowY: "auto", paddingRight: 4 }}>
              {installments.map((inst, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px 14px",
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)",
                    borderLeft: "4px solid var(--accent)",
                    borderRadius: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    border: "1px solid rgba(16, 185, 129, 0.2)"
                  }}
                >
                  <div>
                    <strong style={{color: "var(--text)"}}>📦 EMI {inst.installmentNumber}</strong>
                    <div style={{ fontSize: "11px", color: "var(--text4)", marginTop: 3 }}>
                      {fmtDate(inst.dueDate)}
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--accent)", fontSize: 14 }}>
                    ₹{inst.amount.toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Check */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)",
              borderRadius: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "13px",
              marginBottom: 0,
              border: "1px solid rgba(16, 185, 129, 0.2)",
              fontWeight: 700
            }}
          >
            <div style={{color: "var(--text)"}}>Total Amount</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--accent)", fontSize: 15 }}>
              ₹{totalAmount.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{paddingTop: 16}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{background: "var(--gradient-success)", boxShadow: "0 6px 20px rgba(16, 185, 129, 0.3)"}}
          >
            Create {numInstallments} EMIs
          </button>
        </div>
      </div>
    </div>
  );
}
