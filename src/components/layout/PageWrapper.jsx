export default function PageWrapper({ children }) {
  return (
    <div style={{
      padding: "16px 16px 100px",
      minHeight: "100vh",
      background: "var(--surface-2)",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      {children}
    </div>
  );
}
