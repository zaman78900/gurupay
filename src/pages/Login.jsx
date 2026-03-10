import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabase";

export default function Login() {
  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: "2rem" }}>
      <h1 style={{ fontFamily: "serif", color: "#F59E0B" }}>GuruPay ■</h1>
      <p style={{ color: "#64748B", marginBottom: "2rem" }}>
        Coaching Fee Manager — Sign in to continue
      </p>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={["google"]}
      />
    </div>
  );
}