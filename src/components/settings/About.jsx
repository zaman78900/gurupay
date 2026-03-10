export default function About() {
  return (
    <div className="card">
      <div className="card-header"><div className="card-title">ℹ️ About</div></div>
      <div style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.6 }}>
        <div><b>GuruPay Pro</b></div>
        <div>Version: 2.1.0</div>
        <div style={{ marginTop: 8 }}>
          Links: support@gurupay.com · gurupay.com
        </div>
      </div>
    </div>
  );
}