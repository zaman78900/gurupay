import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import TopBar from "./components/layout/TopBar";
import BottomNav from "./components/layout/BottomNav";
import Dashboard from "./pages/Dashboard";
import Fees from "./pages/Fees";
import Batches from "./pages/Batches";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

function AppShell() {
  const [page, setPage] = useState("dashboard");
  const { dark, setDark } = useTheme();
  const { state } = useApp();

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
  const projectRef = supabaseUrl.match(/^https?:\/\/([^.]+)\.supabase\.co/i)?.[1];
  const authStorageKey = projectRef ? `sb-${projectRef}-auth-token` : "";
  const isLoggedIn = !!(authStorageKey && localStorage.getItem(authStorageKey));

  if (!isLoggedIn) {
    return <Login onLogin={() => window.location.reload()} />;
  }

  const pendingCount = state.students.filter((s) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const paid = state.payments.find(
      (p) => p.studentId === s.id && p.month === currentMonth
    );
    return !paid;
  }).length;

  const pages = {
    dashboard: <Dashboard />,
    fees: <Fees />,
    batches: <Batches />,
    reports: <Reports />,
    settings: <Settings />,
  };

  return (
    <div
      data-theme={dark ? "dark" : "light"}
      style={{
        maxWidth: 430,
        margin: "0 auto",
        minHeight: "100vh",
        position: "relative",
        background: "var(--surface-2)",
        fontFamily: "Outfit, sans-serif",
      }}
    >
      <TopBar page={page} dark={dark} setDark={setDark} />
      <div key={page} style={{ animation: "fadeUp 0.2s ease" }}>
        {pages[page]}
      </div>
      <BottomNav activePage={page} setPage={setPage} pendingCount={pendingCount} />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ThemeProvider>
  );
}