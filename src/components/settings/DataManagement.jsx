import Button from "../ui/Button";

export default function DataManagement() {
  const exportData = () => {
    const data = { ...localStorage };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gurupay_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const clearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="card">
      <div className="card-header"><div className="card-title">💾 Data Management</div></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button onClick={exportData}>Export</Button>
        <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
          Import <input type="file" style={{ display: "none" }} />
        </label>
        <Button variant="danger" onClick={clearData}>Clear Data</Button>
      </div>
    </div>
  );
}