import { useMemo } from "react";
import { RevenueReport } from "../models/RevenueReport";

export default function ReportsPage({ payments, batches, students }) {
  const stats = useMemo(
    () => RevenueReport.getStats(payments, batches, students),
    [payments, batches, students]
  );

  const monthlyRevenue = useMemo(
    () => RevenueReport.calculateMonthlyRevenue(payments, batches, students),
    [payments, batches, students]
  );

  const batchRevenue = useMemo(
    () => RevenueReport.calculateBatchRevenue(payments, batches, students),
    [payments, batches, students]
  );

  const fmtINR = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n || 0);

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 2rem 0", color: "#111" }}>📊 Revenue & Analytics</h1>

      {/* Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ backgroundColor: "#10B981", color: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>Total Revenue</div>
          <div style={{ fontSize: "1.75rem", fontWeight: "bold" }}>{fmtINR(stats.totalRevenue)}</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: "0.5rem" }}>From {stats.paidCount} payments</div>
        </div>

        <div style={{ backgroundColor: "#F59E0B", color: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>Collection Rate</div>
          <div style={{ fontSize: "1.75rem", fontWeight: "bold" }}>{stats.collectionRate}%</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: "0.5rem" }}>Expected: {fmtINR(stats.expectedRevenue)}</div>
        </div>

        <div style={{ backgroundColor: "#3B82F6", color: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>Late Fees Collected</div>
          <div style={{ fontSize: "1.75rem", fontWeight: "bold" }}>{fmtINR(stats.totalLateFee)}</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: "0.5rem" }}>Additional income</div>
        </div>

        <div style={{ backgroundColor: "#EF4444", color: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>Outstanding</div>
          <div style={{ fontSize: "1.75rem", fontWeight: "bold" }}>₹{stats.unpaidCount}</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: "0.5rem" }}>{stats.unpaidCount} unpaid</div>
        </div>
      </div>

      {/* Batch Revenue */}
      <div style={{ marginBottom: "2rem", backgroundColor: "#fff", borderRadius: "8px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
        <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", color: "#111" }}>Revenue by Batch</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {batchRevenue.map((batch) => (
            <div key={batch.id} style={{ border: "1px solid #e5e7eb", borderRadius: "6px", padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: batch.color, marginRight: "0.75rem" }} />
                <h3 style={{ margin: 0, color: "#111", fontSize: "1rem" }}>{batch.name}</h3>
              </div>
              <div style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                  <span style={{ color: "#6B7280" }}>Revenue:</span>
                  <span style={{ fontWeight: "600", color: "#111" }}>{fmtINR(batch.revenue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Revenue */}
      <div style={{ marginBottom: "2rem", backgroundColor: "#fff", borderRadius: "8px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
        <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", color: "#111" }}>Monthly Revenue Trend</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "1rem", color: "#6B7280", fontWeight: "600" }}>Month</th>
              <th style={{ textAlign: "right", padding: "1rem", color: "#6B7280", fontWeight: "600" }}>Revenue</th>
              <th style={{ textAlign: "right", padding: "1rem", color: "#6B7280", fontWeight: "600" }}>Late Fees</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRevenue.map((month, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "1rem", color: "#111" }}>{month.month}</td>
                <td style={{ padding: "1rem", textAlign: "right", color: "#111", fontWeight: "600" }}>{fmtINR(month.revenue)}</td>
                <td style={{ padding: "1rem", textAlign: "right", color: "#111" }}>{fmtINR(month.lateFeeCollected)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
