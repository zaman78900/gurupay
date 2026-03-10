const downloadCSV = (rows, filename) => {
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportRevenueCSV = (data, period = "report") =>
  downloadCSV(
    [
      ["Month", "Collected (Rs)", "Pending (Rs)", "GST (Rs)", "Rate"],
      ...data.map(d => [d.month, d.collected, d.pending, d.gst, d.rate + "%"])
    ],
    `gurupay_revenue_${period}.csv`
  );

export const exportGSTCSV = (data) =>
  downloadCSV(
    [
      ["Batch", "GST Rate", "Students", "Base Amount", "GST Amount"],
      ...data.map(d => [d.name, d.rate, d.students, d.base, d.gst])
    ],
    "gurupay_gst.csv"
  );

export const exportStudentsCSV = (students, batches) =>
  downloadCSV(
    [
      ["Name", "Phone", "Batch", "Fee", "Status"],
      ...students.map(s => {
        const batch = batches.find(b => b.id === s.batchId);
        return [s.name, s.phone, batch?.name || "", s.amount, s.status];
      })
    ],
    "gurupay_students.csv"
  );
