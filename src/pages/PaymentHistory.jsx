import { useMemo, useState } from "react";
import { AuditLog } from "../models/AuditLog";

export default function PaymentHistoryPage({ payments, students, auditLogs = [] }) {
  const history = useMemo(() => {
    return AuditLog.getPaymentHistory(payments, auditLogs);
  }, [payments, auditLogs]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 2rem 0" }}>Payment History & Audit Logs</h1>
      <div style={{ marginBottom: "1rem", color: "#6B7280" }}>
        Total entries: {history.length}
      </div>
      <div style={{ backgroundColor: "#fff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        {history.length > 0 ? (
          history.map((entry, idx) => (
            <div key={idx} style={{ padding: "1rem", borderBottom: idx < history.length - 1 ? "1px solid #e5e7eb" : "none" }}>
              <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>{entry.action}</div>
              <div style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "0.25rem" }}>
                {formatDate(entry.timestamp)}
              </div>
              <div style={{ fontSize: "0.875rem", color: "#111" }}>{entry.details}</div>
              {entry.amount > 0 && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", fontWeight: "500" }}>
                  Amount: ₹{entry.amount}
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6B7280" }}>
            No history entries found
          </div>
        )}
      </div>
    </div>
  );
}
