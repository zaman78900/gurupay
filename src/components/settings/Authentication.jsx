import Button from "../ui/Button";
import { supabase } from "../../supabase";

export default function Authentication({ user }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">🔐 Authentication</div>
          <div className="card-subtitle">Account info & security actions</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 12 }}>
        Email: <b>{user?.email || "—"}</b>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="danger" onClick={handleSignOut}>Sign Out</Button>
      </div>
    </div>
  );
}