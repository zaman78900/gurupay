import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from './supabase'
import Login from './Login'
import { ensureUserProfile, fetchOwnProfile } from './lib/authProfile'
import FeeSyncSettings from './pages/Settings';
import BatchDetails from './components/BatchDetails';
import html2canvas from "html2canvas";
import { 
  fetchBatches, createBatch, updateBatch, deleteBatch as deleteBatchFromDb,
  fetchStudents, createStudent, updateStudent, deleteStudent as deleteStudentFromDb,
  fetchPayments, createPayment, updatePayment, deletePayment as deletePaymentFromDb,
  fetchProfile, saveProfile, fetchSettings, saveSettings
} from './lib/database';
import SetPaymentDueDateModal from './components/modals/SetPaymentDueDateModal';
import BulkMarkPaidModal from './components/modals/BulkMarkPaidModal';
import ReminderSchedulerModal from './components/modals/ReminderSchedulerModal';
import { applyAutoPaymentSetup, calculateDueDateFromPreference } from './utils/autoPaymentSetup';

const VERSION_CHECK_INTERVAL_MS = 60 * 1000;
const VERSION_STORAGE_KEY = "gp_app_build_id";
const MAX_VERSION_CHECK_FAILURES = 3;
const AUTH_BOOTSTRAP_TIMEOUT_MS = 3000; // Fail fast to prevent UI blocking
const AUTH_SYNC_TIMEOUT_MS = 3000;

function isRecoverableNetworkError(error) {
  const msg = String(error?.message || "").toLowerCase();
  return (
    msg.includes("timed out") ||
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("name_not_resolved") ||
    msg.includes("load failed")
  );
}

function isRecoverableAuthLockError(error) {
  const msg = String(error?.message || "").toLowerCase();
  return (
    msg.includes('lock:sb-') ||
    msg.includes('another request stole it') ||
    msg.includes('was released because another request')
  );
}

async function fetchBuildVersion() {
  // Skip in contexts where a network fetch to version file is not reliable.
  if (typeof window !== "undefined") {
    const protocol = window.location?.protocol;
    if (protocol && !protocol.startsWith("http")) {
      return null;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return null;
    }
  }

  const response = await fetch(`/version.json?t=${Date.now()}`, {
    cache: "no-store",
    headers: {
      "cache-control": "no-cache"
    }
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function clearRuntimeCaches() {
  if (!("caches" in window)) return;

  const cacheKeys = await window.caches.keys();
  await Promise.all(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)));
}

// Wrap your whole app with this auth check:
export default function Root() {
const [user, setUser] = useState(null)
const [authProfile, setAuthProfile] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

const withTimeout = (promise, ms = 10000, message = 'Request timed out') =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    }),
  ])

const isTimeoutError = (err) => {
  const msg = err?.message || ''
  return /timed out/i.test(msg)
}

useEffect(() => {
  let disposed = false
  let versionCheckFailures = 0
  let versionChecksDisabled = false
  const bootstrapFallbackTimer = setTimeout(() => {
    if (!disposed) setLoading(false)
  }, 1500)

  const checkForNewDeployment = async () => {
    if (versionChecksDisabled || disposed) return

    try {
      const versionInfo = await fetchBuildVersion()
      const nextBuildId = versionInfo?.buildId
      if (!nextBuildId || disposed) return

      versionCheckFailures = 0

      const knownBuildId = localStorage.getItem(VERSION_STORAGE_KEY)

      if (!knownBuildId) {
        localStorage.setItem(VERSION_STORAGE_KEY, nextBuildId)
        return
      }

      if (knownBuildId !== nextBuildId) {
        localStorage.setItem(VERSION_STORAGE_KEY, nextBuildId)
        await clearRuntimeCaches()
        window.location.reload()
      }
    } catch (err) {
      // Silent fail: deployment check should never block app usage.
      versionCheckFailures += 1
      if (versionCheckFailures >= MAX_VERSION_CHECK_FAILURES && isRecoverableNetworkError(err)) {
        versionChecksDisabled = true
      }
    }
  }

  checkForNewDeployment()
  const versionTimer = setInterval(checkForNewDeployment, VERSION_CHECK_INTERVAL_MS)
  const onWindowFocus = () => checkForNewDeployment()
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      checkForNewDeployment()
    }
  }

  window.addEventListener("focus", onWindowFocus)
  document.addEventListener("visibilitychange", onVisibilityChange);

  if (!isSupabaseConfigured) {
    setLoading(false)
    return () => {
      disposed = true
      clearTimeout(bootstrapFallbackTimer)
      clearInterval(versionTimer)
      window.removeEventListener("focus", onWindowFocus)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }

  // ✓ Immediately show login page - let auth listener restore session in background
  setLoading(false)

  ;(async () => {
    try {
      const { data: { session }, error: sessionError } = await withTimeout(
        supabase.auth.getSession(),
        AUTH_BOOTSTRAP_TIMEOUT_MS,
        'Auth session check timed out'
      )
      if (sessionError) throw sessionError
      if (disposed) return
      
      // Only update user if we got a valid session
      if (session?.user) {
        setUser(session.user)
        try {
          const profile = await ensureUserProfile(session.user)
          if (!disposed) setAuthProfile(profile)
        } catch (profileError) {
          console.error('Profile bootstrap error:', profileError)
        }
      }
    } catch (e) {
      // Silently fail on timeout/network errors - auth listener will handle it
      if (!isRecoverableNetworkError(e) && !isRecoverableAuthLockError(e) && !isTimeoutError(e)) {
        console.error('Auth bootstrap error:', e)
      }
    }
  })()
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (disposed) return

      // Ensure logout reflects immediately in UI (no refresh needed).
      if (event === "SIGNED_OUT") {
        setUser(null)
        setAuthProfile(null)
        return
      }

      // For auth events that include a valid session, sync user instantly.
      if (session?.user) {
        setUser(session.user)

        try {
          const profile = await ensureUserProfile(session.user)
          if (!disposed) setAuthProfile(profile)
        } catch (profileError) {
          console.error('Profile sync error:', profileError)
        }

        return
      }

      // Fallback safety for edge cases where event/session payload is partial.
      try {
        const { data: { session: latestSession } } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_SYNC_TIMEOUT_MS,
          'Auth state sync timed out'
        )
        if (disposed) return
        setUser(latestSession?.user ?? null)

        if (latestSession?.user) {
          try {
            const profile = await fetchOwnProfile(latestSession.user.id)
            if (!disposed) setAuthProfile(profile)
          } catch (profileError) {
            console.error('Profile fallback fetch error:', profileError)
          }
        }
      } catch (syncError) {
        if (!isRecoverableNetworkError(syncError) && !isRecoverableAuthLockError(syncError)) {
          console.error('Auth state sync error:', syncError)
        }
      }
    }
  )

  return () => {
    disposed = true
    clearTimeout(bootstrapFallbackTimer)
    clearInterval(versionTimer)
    window.removeEventListener("focus", onWindowFocus)
    document.removeEventListener("visibilitychange", onVisibilityChange)
    subscription.unsubscribe()
  }
}, [])
if (error) {
  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#fef2f2',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px', color: '#991b1b' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 1rem 0' }}>❌ Authentication Error</h1>
        <p style={{ margin: '0 0 1rem 0', lineHeight: 1.6 }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Retry
        </button>
      </div>
    </div>
  )
}

if (loading) {
  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#fff',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          margin: '0 auto 1rem',
          borderRadius: '50%',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #059669',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#6b7280', margin: 0 }}>Loading GuruPay...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}

if (!user) return <Login />
return <FeeSyncPro user={user} authProfile={authProfile} />
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (k) => {
  if (!k) return "";
  const [y, m] = k.split("-");
  return new Date(+y, +m - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
};
const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const months6 = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return monthKey(d);
});
const curMonth = monthKey();

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_BATCHES = [
  { id: "b1", name: "Morning Yoga", subject: "Yoga & Wellness", timing: "6:00 – 7:00 AM", fee: 1500, gstRate: 18, capacity: 15, color: "#10b981" },
  { id: "b2", name: "Class 10 Maths", subject: "Mathematics", timing: "5:00 – 6:30 PM", fee: 2000, gstRate: 0, capacity: 20, color: "#f59e0b" },
  { id: "b3", name: "Guitar – Beginners", subject: "Music", timing: "4:00 – 5:00 PM", fee: 1200, gstRate: 18, capacity: 10, color: "#8b5cf6" },
];
const SEED_STUDENTS = [
  { id: "s1", rollNumber: "R001", status: "Active", name: "Aarav Sharma", phone: "9876543210", email: "aarav@email.com", batchId: "b1", joiningDate: "2025-01-01", notes: "Good progress", discount: 0 },
  { id: "s2", rollNumber: "R002", status: "Active", name: "Priya Patel", phone: "9867534201", email: "priya@email.com", batchId: "b1", joiningDate: "2025-01-05", notes: "", discount: 100 },
  { id: "s3", rollNumber: "R003", status: "Active", name: "Rahul Verma", phone: "9845612370", email: "rahul@email.com", batchId: "b1", joiningDate: "2025-02-01", notes: "Needs extra attention", discount: 0 },
  { id: "s4", rollNumber: "R004", status: "Active", name: "Sneha Gupta", phone: "9812345678", email: "sneha@email.com", batchId: "b2", joiningDate: "2025-01-10", notes: "", discount: 0 },
  { id: "s5", rollNumber: "R005", status: "Active", name: "Karan Mehta", phone: "9765432100", email: "karan@email.com", batchId: "b2", joiningDate: "2025-01-15", notes: "Fee concession", discount: 200 },
  { id: "s6", rollNumber: "R006", status: "Active", name: "Ananya Singh", phone: "9898989898", email: "ananya@email.com", batchId: "b3", joiningDate: "2025-02-01", notes: "", discount: 0 },
  { id: "s7", rollNumber: "R007", status: "Active", name: "Rohan Joshi", phone: "9912345678", email: "rohan@email.com", batchId: "b3", joiningDate: "2025-02-10", notes: "", discount: 0 },
];
const calcAmount = (batch, student) => {
  const base = batch.fee - (student.discount || 0);
  return base + Math.round(base * (batch.gstRate / 100));
};
const SEED_PAYMENTS = [
  { id: "p1", studentId: "s1", month: curMonth, status: "paid", amount: calcAmount(SEED_BATCHES[0], SEED_STUDENTS[0]), paidOn: today(), lateFee: 0, notes: "" },
  { id: "p2", studentId: "s2", month: curMonth, status: "paid", amount: calcAmount(SEED_BATCHES[0], SEED_STUDENTS[1]), paidOn: today(), lateFee: 0, notes: "" },
  { id: "p3", studentId: "s3", month: curMonth, status: "unpaid", amount: calcAmount(SEED_BATCHES[0], SEED_STUDENTS[2]), paidOn: null, lateFee: 0, notes: "" },
  { id: "p4", studentId: "s4", month: curMonth, status: "paid", amount: calcAmount(SEED_BATCHES[1], SEED_STUDENTS[3]), paidOn: today(), lateFee: 0, notes: "" },
  { id: "p5", studentId: "s5", month: curMonth, status: "unpaid", amount: calcAmount(SEED_BATCHES[1], SEED_STUDENTS[4]), paidOn: null, lateFee: 0, notes: "" },
  { id: "p6", studentId: "s6", month: curMonth, status: "paid", amount: calcAmount(SEED_BATCHES[2], SEED_STUDENTS[5]), paidOn: today(), lateFee: 0, notes: "" },
  { id: "p7", studentId: "s7", month: curMonth, status: "unpaid", amount: calcAmount(SEED_BATCHES[2], SEED_STUDENTS[6]), paidOn: null, lateFee: 0, notes: "" },
  // Prev month
  { id: "p8", studentId: "s1", month: months6[1], status: "paid", amount: 1770, paidOn: "2026-02-03", lateFee: 0, notes: "" },
  { id: "p9", studentId: "s2", month: months6[1], status: "paid", amount: 1652, paidOn: "2026-02-05", lateFee: 50, notes: "Late payment" },
  { id: "p10", studentId: "s3", month: months6[1], status: "paid", amount: 1770, paidOn: "2026-02-10", lateFee: 0, notes: "" },
  { id: "p11", studentId: "s4", month: months6[1], status: "paid", amount: 2000, paidOn: "2026-02-02", lateFee: 0, notes: "" },
  { id: "p12", studentId: "s5", month: months6[1], status: "unpaid", amount: 1800, paidOn: null, lateFee: 0, notes: "" },
];
const SEED_PROFILE = {
  name: "Sri Balaji Coaching Academy", gstin: "29ABCDE1234F1Z5",
  address: "12, MF Road, Bengaluru – 560001", phone: "9876543210",
  email: "balaji@coaching.in", upiId: "balaji@okaxis",
};

function normalizeInstituteProfile(profile) {
  const merged = { ...SEED_PROFILE, ...(profile || {}) };
  const safeName = String(merged.name || "").trim();

  return {
    ...merged,
    name: safeName || SEED_PROFILE.name,
  };
}

// Default feature settings
const DEFAULT_FEATURES = { showStudents: true, showPayments: true, showReports: true, enableNotifications: true, enableDarkMode: true, enableWaiveFee: true, enableGST: true, enableWhatsApp: true };
const DEFAULT_WHATSAPP_CONFIG = { mode: "default", customTemplate: "" };
const DEFAULT_UI_SETTINGS = { colorTheme: "Default Green", fontSize: "Medium" };

const UI_THEME_PALETTE = {
  "Default Green": { accent: "#059669", accentDark: "#047857", accentLight: "#ecfdf5" },
  "Ocean Blue": { accent: "#2563eb", accentDark: "#1d4ed8", accentLight: "#eff6ff" },
  "Royal Purple": { accent: "#7c3aed", accentDark: "#6d28d9", accentLight: "#f5f3ff" },
  "Sunset Orange": { accent: "#ea580c", accentDark: "#c2410c", accentLight: "#fff7ed" },
};

const UI_FONT_SIZE = { Small: "12px", Medium: "14px", Large: "16px" };
const UI_FONT_SCALE = { Small: 0.92, Medium: 1, Large: 1.08 };

function normalizeWhatsAppConfig(config) {
  const mode = config?.mode === "custom" ? "custom" : "default";
  const customTemplate = typeof config?.customTemplate === "string"
    ? config.customTemplate
    : "";

  return { mode, customTemplate };
}

// ─── Storage ──────────────────────────────────────────────────────────────────
const KEYS = { batches: "gp2_b", students: "gp2_s", payments: "gp2_p", profile: "gp2_pr", theme: "gp2_th", features: "gp2_feat", whatsappConfig: "gp2_wa_cfg", uiSettings: "gp2_ui" };
async function dbGet(k, fallback) {
  try { const val = localStorage.getItem(k); return val ? JSON.parse(val) : fallback; }
  catch { return fallback; }
}
async function dbSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

const DEFAULT_REMINDER_TEMPLATE = `Namaste {{studentName}} ji! 🙏\n\nYour *{{batchName}}* fee for *{{month}}* is pending.\n\nFee: ₹{{base}}{{gstLine}}\n*Total Due: ₹{{total}}*\n\nKindly pay at your earliest convenience.\n\nThank you! 🎓`;

function buildDefaultReminderMessage({ studentName, batchName, month, base, gst, gstRate, total }) {
  const gstLine = gst ? `\nGST (${gstRate}%): ₹${gst}` : "";
  return `Namaste ${studentName} ji! 🙏\n\nYour *${batchName}* fee for *${month}* is pending.\n\nFee: ₹${base}${gstLine}\n*Total Due: ₹${total}*\n\nKindly pay at your earliest convenience.\n\nThank you! 🎓`;
}

function applyReminderTemplate(template, vars) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => (vars[key] ?? "").toString());
}

function buildReminderMessage({ student, batch, month, amount, whatsappConfig }) {
  const safeWhatsAppConfig = normalizeWhatsAppConfig(whatsappConfig);
  const baseNum = batch.fee - (student.discount || 0);
  const gstNum = Math.round(baseNum * batch.gstRate / 100);
  const totalNum = amount ?? (baseNum + gstNum);
  const base = baseNum.toLocaleString("en-IN");
  const gst = gstNum.toLocaleString("en-IN");
  const total = totalNum.toLocaleString("en-IN");
  const monthText = monthLabel(month);

  if (safeWhatsAppConfig.mode !== "custom" || !safeWhatsAppConfig.customTemplate.trim()) {
    return buildDefaultReminderMessage({
      studentName: student.name,
      batchName: batch.name,
      month: monthText,
      base,
      gst,
      gstRate: batch.gstRate,
      total,
    });
  }

  const gstLine = gstNum ? `\nGST (${batch.gstRate}%): ₹${gst}` : "";
  return applyReminderTemplate(safeWhatsAppConfig.customTemplate, {
    studentName: student.name,
    batchName: batch.name,
    month: monthText,
    base,
    gst,
    gstRate: batch.gstRate,
    total,
    amount: total,
    gstLine,
  });
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700;900&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap");

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f8fafc; --bg2: #ffffff; --bg3: #f1f5f9; --bg4: #e2e8f0;
    --text: #0f172a; --text2: #334155; --text3: #64748b; --text4: #94a3b8;
    --border: #e2e8f0; --border2: #cbd5e1;
    --accent: #059669; --accent-light: #ecfdf5; --accent-dark: #047857;
    --amber: #d97706; --amber-light: #fffbeb;
    --red: #dc2626; --red-light: #fef2f2;
    --blue: #2563eb; --blue-light: #eff6ff;
    --purple: #7c3aed; --purple-light: #f5f3ff;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.05);
    --shadow: 0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px -1px rgba(0,0,0,.05);
    --shadow-lg: 0 10px 25px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05);
    --shadow-xl: 0 20px 40px -8px rgba(0,0,0,.15);
    --radius: 12px; --radius-sm: 8px; --radius-lg: 16px; --radius-xl: 20px;
    --font-display: 'Fraunces', serif;
    --font-body: 'Outfit', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    --global-font-size: 14px;
    --global-scale: 1;
    --sidebar-w: 256px;
    --transition: all 0.18s cubic-bezier(.4,0,.2,1);
  }
  [data-theme="dark"] {
    --bg: #0a0e1a; --bg2: #111827; --bg3: #1e2736; --bg4: #2d3748;
    --text: #f8fafc; --text2: #e2e8f0; --text3: #94a3b8; --text4: #64748b;
    --border: #1e293b; --border2: #2d3748;
    --accent-light: #052e1e; --amber-light: #1c1208;
    --red-light: #1a0707; --blue-light: #08112a; --purple-light: #150b2a;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.4); --shadow: 0 4px 6px rgba(0,0,0,.35);
    --shadow-lg: 0 10px 25px rgba(0,0,0,.5); --shadow-xl: 0 20px 40px rgba(0,0,0,.6);
  }

  html, body, #root { height: 100%; font-family: var(--font-body); background: var(--bg); color: var(--text); font-size: var(--global-font-size); }
  .app { display: flex; height: 100vh; overflow: hidden; zoom: var(--global-scale); }

  /* Sidebar */
  .sidebar { width: var(--sidebar-w); background: var(--bg2); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto; transition: var(--transition); z-index: 50; position: relative; }

  /* Mobile sidebar styles */
  .sidebar-overlay { display: none; }
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .sidebar-overlay { display: none; }
  }

  /* Hamburger button */
  .hamburger-btn { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; background: none; border: none; color: var(--text); }
  .hamburger-btn span { width: 22px; height: 2px; background: currentColor; border-radius: 1px; transition: var(--transition); }
  @media (max-width: 768px) { .hamburger-btn { display: none; } }

  /* Hamburger animation */
  .hamburger-btn.is-active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .hamburger-btn.is-active span:nth-child(2) { opacity: 0; }
  .hamburger-btn.is-active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
  
  /* Bottom Navigation Bar */
  .bottom-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; height: 65px; background: var(--bg2);
    border-top: 1px solid var(--border); box-shadow: 0 -2px 6px rgba(0,0,0,.06); z-index: 999;
    align-items: stretch; justify-content: space-around; padding: 0; }
  .bottom-nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; border: none; background: none; color: var(--text3); cursor: pointer;
    font-family: var(--font-body); font-size: 10px; font-weight: 600; transition: var(--transition);
    position: relative; padding: 6px 4px; }
  .bottom-nav-item:hover { background: var(--bg3); color: var(--text); }
  .bottom-nav-item.active { color: var(--accent); background: var(--accent-light); }
  .bottom-nav-item .nav-icon { width: 18px; height: 18px; opacity: .8; }
  .bottom-nav-item.active .nav-icon { opacity: 1; }
  .bottom-nav-item span { display: block; text-align: center; line-height: 1.1; }
  
  @media (max-width: 768px) {
    .bottom-nav { display: flex; }
    .content { padding-bottom: 80px; }
  }

  
   .sidebar-logo { padding: 22px 20px 16px; border-bottom: 1px solid var(--border); }
  .logo-icon { font-size: 28px; display: block; }
  .logo-name { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--accent); line-height: 1; margin-top: 4px; }
  .logo-sub { font-size: 11px; color: var(--text4); margin-top: 2px; letter-spacing: .5px; }
  .nav { flex: 1; padding: 12px 10px; }
  .nav-group { margin-bottom: 4px; }
  .nav-label { font-size: 10px; font-weight: 600; color: var(--text4); text-transform: uppercase; letter-spacing: 1px; padding: 8px 10px 4px; }
  .nav-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 12px;
    border-radius: var(--radius-sm); border: none; background: none; color: var(--text3);
    font-family: var(--font-body); font-size: 13.5px; font-weight: 500; cursor: pointer; text-align: left;
    transition: var(--transition); position: relative; }
  .nav-btn:hover { background: var(--bg3); color: var(--text); }
  .nav-btn.active { background: var(--accent-light); color: var(--accent); font-weight: 600; }
  .nav-btn .nav-icon { width: 16px; height: 16px; flex-shrink: 0; opacity: .7; }
  .nav-btn.active .nav-icon { opacity: 1; }
  .nav-badge { margin-left: auto; background: var(--red); color: #fff; font-size: 10px; font-weight: 700;
    padding: 2px 6px; border-radius: 100px; min-width: 18px; text-align: center; }
  .sidebar-footer { padding: 12px 14px; border-top: 1px solid var(--border); }
  .profile-card { display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    background: var(--bg3); border-radius: var(--radius-sm); }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--amber));
    display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: white; flex-shrink: 0; }
  .profile-name { font-size: 12px; font-weight: 600; color: var(--text); line-height: 1.3; }
  .profile-plan { font-size: 10px; color: var(--accent); font-weight: 600; }

  /* Main */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .topbar { height: 60px; border-bottom: 1px solid var(--border); display: flex; align-items: center;
    padding: 0 16px; gap: 12px; background: var(--bg2); flex-shrink: 0; }
  .topbar-title { font-family: var(--font-display); font-size: 17px; font-weight: 700; color: var(--text); }
  .topbar-sub { font-size: 12px; color: var(--text4); margin-left: 2px; }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  .content { flex: 1; overflow-y: auto; padding: 24px; }

  /* Cards */
  .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-lg);
    padding: 20px; box-shadow: var(--shadow-sm); }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .card-title { font-size: 14px; font-weight: 600; color: var(--text); }
  .card-subtitle { font-size: 12px; color: var(--text4); margin-top: 2px; }

  /* Stat cards */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-lg);
    padding: 18px 20px; box-shadow: var(--shadow-sm); transition: var(--transition); cursor: default; }
  .stat-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
  .stat-icon-wrap { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center;
    justify-content: center; font-size: 18px; margin-bottom: 12px; }
  .stat-val { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text); line-height: 1; }
  .stat-lbl { font-size: 12px; color: var(--text4); margin-top: 5px; font-weight: 500; }
  .stat-sub { font-size: 11px; color: var(--text4); margin-top: 3px; }
  .stat-change { font-size: 11px; margin-top: 6px; font-weight: 600; }
  .stat-change.up { color: var(--accent); }
  .stat-change.down { color: var(--red); }

  /* Progress bar */
  .progress { height: 6px; background: var(--bg4); border-radius: 100px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 100px; transition: width .6s ease; }

  /* Buttons */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    padding: 8px 16px; border-radius: var(--radius-sm); border: none; font-family: var(--font-body);
    font-size: 13px; font-weight: 600; cursor: pointer; transition: var(--transition); white-space: nowrap; }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: var(--accent-dark); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(5,150,105,.3); }
  .btn-secondary { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }
  .btn-secondary:hover { background: var(--bg4); }
  .btn-danger { background: var(--red-light); color: var(--red); border: 1px solid rgba(220,38,38,.2); }
  .btn-danger:hover { background: var(--red); color: #fff; }
  .btn-ghost { background: none; color: var(--text3); border: 1.0px solid transparent; }
  .btn-ghost:hover { background: var(--bg3); color: var(--text); }
  .btn-icon { padding: 7px; border-radius: var(--radius-sm); }
  .btn-wa { background: #25d366; color: #fff; }
  .btn-wa:hover { background: #1da851; }
  .btn-amber { background: var(--amber-light); color: var(--amber); border: 1.0px solid rgba(217,119,6,.2); }
  .btn-amber:hover { background: var(--amber); color: #fff; }
  .btn-sm { padding: 5px 10px; font-size: 12px; gap: 5px; }
  .btn-lg { padding: 11px 22px; font-size: 14px; border-radius: var(--radius); }
  .btn:disabled { opacity: .45; cursor: not-allowed; transform: none !important; }

  /* Badges */
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 100px;
    font-size: 11px; font-weight: 600; }
  .badge-paid { background: var(--accent-light); color: var(--accent); }
  .badge-unpaid { background: var(--red-light); color: var(--red); }
  .badge-waived { background: var(--blue-light); color: var(--blue); }
  .badge-discount { background: var(--amber-light); color: var(--amber); }
  .badge-batch { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }

  /* Table */
  .table-wrap { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--border); }
  table { width: 100%; border-collapse: collapse; }
  thead { background: var(--bg3); }
  th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text4);
    text-transform: uppercase; letter-spacing: .7px; white-space: nowrap; }
  td { padding: 13px 14px; font-size: 13px; color: var(--text2); border-top: 1px solid var(--border); vertical-align: middle; }
  tr:hover td { background: var(--bg3); }
  .td-primary { font-weight: 600; color: var(--text); }
  .td-mono { font-family: var(--font-mono); font-size: 12px; }

  /* Inputs */
  .input { width: 100%; padding: 9px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border);
    background: var(--bg2); color: var(--text); font-family: var(--font-body); font-size: 13px;
    outline: none; transition: var(--transition); }
  .input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(5,150,105,.1); }
  .input::placeholder { color: var(--text4); }
  .input-label { font-size: 12px; font-weight: 600; color: var(--text3); margin-bottom: 5px; display: block; }
  .input-group { margin-bottom: 14px; }
  .input-hint { font-size: 11px; color: var(--text4); margin-top: 4px; }
  .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  select.input { cursor: pointer; }
  textarea.input { resize: vertical; min-height: 70px; }

  /* Toggle Switch */
  .toggle-input { position: relative; width: 48px; height: 28px; background: var(--bg4); border-radius: 100px; border: none; cursor: pointer; transition: var(--transition); appearance: none; padding: 0; }
  .toggle-input:checked { background: var(--accent); }
  .toggle-input::after { content: ''; position: absolute; width: 24px; height: 24px; background: white; border-radius: 50%; top: 2px; left: 2px; transition: var(--transition); }
  .toggle-input:checked::after { left: 22px; }

  /* Settings items */
  .settings-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .settings-item:last-child { border-bottom: none; }
  .settings-item-label { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  .settings-item-desc { font-size: 12px; color: var(--text4); }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center;
    justify-content: center; padding: 16px; }
  .modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.5); backdrop-filter: blur(4px);
    animation: fadeIn .15s ease; }
  .modal-box { position: relative; z-index: 1; background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius-xl); width: 100%; max-width: 500px; max-height: 90vh;
    overflow-y: auto; box-shadow: var(--shadow-xl); animation: slideUp .2s cubic-bezier(.34,1.56,.64,1); }
  .modal-header { padding: 20px 22px 0; display: flex; align-items: flex-start; justify-content: space-between; }
  .modal-title { font-family: var(--font-display); font-size: 17px; font-weight: 700; color: var(--text); }
  .modal-subtitle { font-size: 12px; color: var(--text4); margin-top: 3px; }
  .modal-body { padding: 16px 22px 22px; }
  .modal-footer { padding: 0 22px 20px; display: flex; gap: 8px; justify-content: flex-end; }

  /* Confirm Modal */
  .confirm-box { max-width: 380px; }
  .confirm-icon { font-size: 36px; text-align: center; margin-bottom: 12px; }
  .confirm-msg { font-size: 13px; color: var(--text3); text-align: center; line-height: 1.6; }

  /* Toast */
  .toast-stack { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 9999;
    display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
  .toast { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: var(--radius);
    background: var(--text); color: var(--bg2); font-size: 13px; font-weight: 500;
    box-shadow: var(--shadow-lg); pointer-events: all; min-width: 280px; max-width: 380px;
    animation: slideUp .25s cubic-bezier(.34,1.56,.64,1); }
  .toast-icon { font-size: 16px; flex-shrink: 0; }
  .toast-msg { flex: 1; }
  .toast-undo { font-size: 12px; font-weight: 700; color: var(--accent); cursor: pointer; white-space: nowrap;
    background: none; border: none; font-family: var(--font-body); }
  .toast-undo:hover { text-decoration: underline; }
  .toast-close { font-size: 16px; cursor: pointer; opacity: .6; background: none; border: none; color: inherit; }

  /* Search bar */
  .search-wrap { position: relative; }
  .search-wrap svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); opacity: .4; pointer-events: none; }
  .search-wrap .input { padding-left: 34px; }

  /* Select filter tabs */
  .filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
  .filter-tab { padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; cursor: pointer;
    border: 1.5px solid var(--border); color: var(--text3); background: var(--bg2); transition: var(--transition); }
  .filter-tab.active { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }
  .filter-tab:hover:not(.active) { background: var(--bg3); }

  /* Toolbar */
  .toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }

  /* Receipt */
  .receipt { background: #fff; border-radius: var(--radius); border: 1px solid #e5e7eb;
    padding: 22px; font-family: var(--font-mono); font-size: 12px; color: #111; }
  .receipt-logo { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: #059669; }
  .receipt-divider { border: none; border-top: 1px dashed #d1d5db; margin: 12px 0; }
  .receipt-row { display: flex; justify-content: space-between; padding: 3px 0; }
  .receipt-total { font-weight: 700; font-size: 14px; border-top: 2px solid #111; padding-top: 8px; margin-top: 4px; }

  /* Invoice print mode */
  @media print {
    body * { visibility: hidden !important; }
    .modal-overlay.invoice-modal-print,
    .modal-overlay.invoice-modal-print * { visibility: visible !important; }
    .modal-overlay.invoice-modal-print {
      position: static !important;
      inset: auto !important;
      padding: 0 !important;
      display: block !important;
      background: #fff !important;
    }
    .modal-overlay.invoice-modal-print .modal-backdrop,
    .modal-overlay.invoice-modal-print .modal-header button,
    .modal-overlay.invoice-modal-print .invoice-actions {
      display: none !important;
    }
    .modal-overlay.invoice-modal-print .modal-box {
      max-width: 100% !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      max-height: none !important;
      overflow: visible !important;
    }
    .modal-overlay.invoice-modal-print .modal-body {
      padding: 0 !important;
    }
    .modal-overlay.invoice-modal-print .receipt {
      border: none !important;
      padding: 16px !important;
    }
  }

  /* Empty state */
  .empty { text-align: center; padding: 48px 20px; }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .empty-title { font-weight: 700; font-size: 15px; color: var(--text); margin-bottom: 6px; }
  .empty-desc { font-size: 13px; color: var(--text4); line-height: 1.6; }

  /* Skeleton */
  .skeleton { background: linear-gradient(90deg, var(--bg3) 25%, var(--bg4) 50%, var(--bg3) 75%);
    background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; }
  @keyframes shimmer { to { background-position: -200% 0; } }

  /* Theme toggle */
  .theme-btn { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; border: 1.5px solid var(--border); background: var(--bg3);
    cursor: pointer; transition: var(--transition); font-size: 16px; }
  .theme-btn:hover { background: var(--bg4); }
  .theme-btn .nav-icon { width: 16px; height: 16px; opacity: 1; }
  [data-theme="dark"] .theme-btn {
    background: #1f2937;
    border-color: #334155;
    color: #f8fafc;
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.2);
  }
  [data-theme="dark"] .theme-btn:hover {
    background: #273449;
    border-color: #475569;
  }

  /* Month selector */
  .month-sel { padding: 7px 10px; border-radius: var(--radius-sm); border: 1.5px solid var(--border);
    background: var(--bg2); color: var(--text); font-family: var(--font-body); font-size: 12.5px;
    font-weight: 600; outline: none; cursor: pointer; }
  .month-sel:focus { border-color: var(--accent); }

  /* History list */
  .hist-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px;
    border-radius: var(--radius-sm); border: 1px solid var(--border); margin-bottom: 6px; }

  /* Sparkline bars */
  .sparkbar-wrap { display: flex; align-items: flex-end; gap: 3px; height: 32px; }
  .sparkbar { border-radius: 3px 3px 0 0; min-width: 8px; transition: height .4s ease; }

  /* Dot indicator */
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* Section divider */
  .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .section-title { font-size: 15px; font-weight: 700; color: var(--text); }

  /* Color dot for batch */
  .batch-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

  /* Grid layouts */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

  /* Scroll */
  .content::-webkit-scrollbar, .modal-box::-webkit-scrollbar, .sidebar::-webkit-scrollbar { width: 5px; }
  .content::-webkit-scrollbar-thumb, .modal-box::-webkit-scrollbar-thumb, .sidebar::-webkit-scrollbar-thumb
    { background: var(--bg4); border-radius: 100px; }

  /* Keyframes */
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }

  /* Responsive */
  @media (max-width: 800px) {
    :root { --sidebar-w: 58px; }
    .logo-name, .logo-sub, .nav-label, .nav-btn span, .sidebar-footer .profile-name,
    .sidebar-footer .profile-plan { display: none; }
    .stat-grid { grid-template-columns: 1fr 1fr; }
    .grid-2 { grid-template-columns: 1fr; }
    .grid-3 { grid-template-columns: 1fr 1fr; }
    .content { padding: 16px; }
    .topbar { padding: 0 16px; }
    .nav-btn { justify-content: center; padding: 10px; }
    .avatar { margin: 0 auto; }
    .profile-card { justify-content: center; }
  }
  
  @media (max-width: 768px) {
    .stat-grid { grid-template-columns: 1fr 1fr; }
    .grid-2 { grid-template-columns: 1fr; }
    .grid-3 { grid-template-columns: 1fr 1fr; }
    .content { padding: 16px; padding-bottom: 80px; }
    .topbar { padding: 0 16px; }

    /* Batch details mobile fixes */
    .batch-detail-top-header {
      flex-direction: column;
      gap: 12px;
      align-items: stretch !important;
    }

    .batch-detail-meta {
      flex-wrap: wrap;
      gap: 8px 14px !important;
    }

    .batch-detail-actions {
      width: 100%;
      flex-wrap: wrap;
    }

    .batch-detail-actions .btn {
      flex: 1 1 140px;
    }

    .batch-student-header {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .batch-student-controls {
      width: 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
    }

    .batch-student-controls .month-sel {
      min-width: 170px;
      flex: 1 1 170px;
    }

    .batch-student-controls .filter-tabs {
      flex: 1 1 170px;
    }

    .batch-student-controls .btn {
      flex: 1 1 150px;
    }

    .batch-student-filters {
      flex-direction: column;
      align-items: stretch;
    }

    .batch-student-filters .search-wrap,
    .batch-student-filters .month-sel,
    .batch-student-filters .btn {
      width: 100%;
      flex: 1 1 auto !important;
    }
  }

  /* Batch color strip */
  .batch-card { border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border);
    background: var(--bg2); box-shadow: var(--shadow-sm); transition: var(--transition); }
  .batch-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
  .batch-strip { height: 4px; width: 100%; }
  .batch-body { padding: 16px; }

  /* UPI QR placeholder */
  .upi-box { background: var(--bg3); border-radius: var(--radius); padding: 16px;
    text-align: center; border: 2px dashed var(--border2); }

  /* Notification dot */
  .notif-dot { width: 7px; height: 7px; background: var(--red); border-radius: 50%; position: absolute; top: 6px; right: 6px; }

  /* Overdue indicator */
  .overdue { animation: pulse 2s infinite; }
`;

// ─── Icon Components ──────────────────────────────────────────────────────────
const I = {
  Dashboard: () => <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  Fees: () => <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Batches: () => <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Reports: () => <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  Settings: () => <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Plus: () => <svg className="nav-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit: () => <svg className="nav-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: () => <svg className="nav-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Undo: () => <svg className="nav-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,
  Check: () => <svg className="nav-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg className="nav-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Search: () => <svg className="nav-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  WA: () => <svg className="nav-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  Receipt: () => <svg className="nav-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  History: () => <svg className="nav-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/><polyline points="12 7 12 12 15 15"/></svg>,
  Download: () => <svg className="nav-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Sun: () => <svg className="nav-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon: () => <svg className="nav-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Eye: () => <svg className="nav-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Zap: () => <svg className="nav-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Tag: () => <svg className="nav-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Alert: () => <svg className="nav-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Waive: () => <svg className="nav-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  LogOut: () => <svg className="nav-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
};

export { I };

// ─── Toast System ─────────────────────────────────────────────────────────────
function ToastStack({ toasts, dismiss }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <span className="toast-icon">{t.icon || "✓"}</span>
          <span className="toast-msg">{t.msg}</span>
          {t.onUndo && <button className="toast-undo" onClick={() => { t.onUndo(); dismiss(t.id); }}>UNDO</button>}
          <button className="toast-close" onClick={() => dismiss(t.id)}><I.X /></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, { icon, onUndo, duration = 4000 } = {}) => {
    const id = uid();
    setToasts(p => [...p, { id, msg, icon, onUndo }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
    return id;
  }, []);
  const dismiss = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, push, dismiss };
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmModal({ icon, title, msg, confirmLabel = "Confirm", danger, onConfirm, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box confirm-box" style={{ animation: "slideUp .2s cubic-bezier(.34,1.56,.64,1)" }}>
        <div className="modal-body" style={{ textAlign: "center", padding: "28px 24px 20px" }}>
          <div className="confirm-icon">{icon}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</div>
          <div className="confirm-msg">{msg}</div>
        </div>
        <div className="modal-footer" style={{ justifyContent: "center", gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={() => { console.log('[DEBUG] Confirm button clicked, calling onConfirm'); onConfirm(); onClose(); }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WA Reminder Modal ────────────────────────────────────────────────────────
function WaModal({ student, batch, month, whatsappConfig, onSaveWhatsAppConfig, onClose }) {
  const initialConfig = normalizeWhatsAppConfig(whatsappConfig);
  const [mode, setMode] = useState(initialConfig.mode);
  const [customTemplate, setCustomTemplate] = useState(initialConfig.customTemplate || DEFAULT_REMINDER_TEMPLATE);
  const msg = buildReminderMessage({
    student,
    batch,
    month,
    whatsappConfig: {
      mode,
      customTemplate,
    },
  });

  const saveTemplatePreference = () => {
    onSaveWhatsAppConfig?.({
      mode,
      customTemplate,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box">
        <div className="modal-header">
          <div><div className="modal-title">📲 WhatsApp Reminder</div><div className="modal-subtitle">To: {student.name} (+91 {student.phone})</div></div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><I.X /></button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 12 }}>
            <div className="input-label" style={{ marginBottom: 8 }}>Message Option</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={`btn btn-sm ${mode === "default" ? "btn-primary" : "btn-secondary"}`} onClick={() => setMode("default")}>
                Use Default
              </button>
              <button className={`btn btn-sm ${mode === "custom" ? "btn-primary" : "btn-secondary"}`} onClick={() => setMode("custom")}>
                Customize
              </button>
            </div>
          </div>

          {mode === "custom" && (
            <div className="input-group">
              <label className="input-label">Custom WhatsApp Message</label>
              <textarea
                className="input"
                value={customTemplate}
                onChange={(e) => setCustomTemplate(e.target.value)}
                style={{ minHeight: 120 }}
                placeholder={DEFAULT_REMINDER_TEMPLATE}
              />
              <div className="input-hint">Use: {'{{studentName}}'}, {'{{batchName}}'}, {'{{month}}'}, {'{{base}}'}, {'{{gst}}'}, {'{{gstRate}}'}, {'{{total}}'}, {'{{amount}}'}, {'{{gstLine}}'}</div>
            </div>
          )}

          <div style={{ background: "var(--bg3)", borderRadius: "var(--radius)", padding: "14px 16px", fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", marginBottom: 14, color: "var(--text2)" }}>{msg}</div>
          <button className="btn btn-secondary" style={{ width: "100%", marginBottom: 10 }} onClick={saveTemplatePreference}>Save Message Setting</button>
          <a href={`https://wa.me/91${student.phone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="btn btn-wa btn-lg" style={{ width: "100%", textDecoration: "none" }}>
            <I.WA /> Open in WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Receipt Modal ─────────────────────────────────────────────────────────────
function escapePdfText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildSimplePdfFromLines(lines) {
  const encoder = new TextEncoder();
  const safeLines = (lines || []).map((line) => escapePdfText(line));

  const contentStream = [
    "BT",
    "/F1 12 Tf",
    "50 800 Td",
    ...safeLines.flatMap((line) => [`(${line}) Tj`, "0 -18 Td"]),
    "ET",
  ].join("\n");

  const streamBytesLength = encoder.encode(contentStream).length;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${streamBytesLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((obj) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += obj;
  });

  const xrefStart = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function ReceiptModal({ student, batch, payment, profile, toast, onClose }) {
  const [sharing, setSharing] = useState(false);
  const invoiceRef = useRef(null);
  const base = batch.fee - (student.discount || 0);
  const gst = Math.round(base * batch.gstRate / 100);
  const late = payment.lateFee || 0;
  const total = base + gst + late;

  const invoiceNo = `GP-${String(payment.id || Date.now()).toUpperCase()}`;
  const invoiceDate = fmtDate(payment.paidOn || today());
  const invoiceMonth = monthLabel(payment.month);
  const studentName = student?.name || "Student";
  const instituteName = profile?.name || "FeeSync Institute";

  const captureInvoiceAsImage = async () => {
    if (!invoiceRef.current) throw new Error("Invoice content not ready");

    return html2canvas(invoiceRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
  };

  const shareInvoiceToWhatsApp = async () => {
    if (sharing) return;

    const rawPhone = (student?.phone || "").replace(/\D/g, "");
    if (!rawPhone || rawPhone.length < 10) {
      alert("No valid phone number found for this student. Please update the student profile.");
      return;
    }

    setSharing(true);

    try {
      const canvas = await captureInvoiceAsImage();

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Receipt-${invoiceNo}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      const phone = rawPhone.startsWith("91") ? rawPhone : `91${rawPhone}`;
      const message = encodeURIComponent(
        `Dear ${studentName},\n\nYour fee receipt has been saved to your device.\n\n` +
        `Receipt No: ${invoiceNo}\nAmount Paid: ₹${total.toLocaleString("en-IN")}\nDate: ${invoiceDate}\nBatch: ${batch.name}\n\n` +
        `— ${instituteName}`
      );

      window.location.href = `whatsapp://send?phone=${phone}&text=${message}`;

      setTimeout(() => {
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
      }, 1500);
    } catch (err) {
      if (err?.name !== "AbortError") {
        alert("Could not share. Please try again.");
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="modal-overlay invoice-modal-print">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div><div className="modal-title">Invoice</div></div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><I.X /></button>
        </div>
        <div className="modal-body">
          <div
            className="receipt"
            ref={invoiceRef}
            style={{
              background: "#ffffff",
              padding: 16,
              boxShadow: "none",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div className="receipt-logo">{profile.name}</div>
              <div style={{ color: "#555", fontSize: 11, marginTop: 3 }}>{profile.address}</div>
              {profile.gstin && <div style={{ fontSize: 11, marginTop: 2 }}>GSTIN: <b>{profile.gstin}</b></div>}
            </div>
            <hr className="receipt-divider" />
            <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, marginBottom: 10, letterSpacing: 1 }}>TAX INVOICE</div>
            {[["Invoice No", invoiceNo], ["Date", invoiceDate], ["Student", student.name], ["Mobile", `+91 ${student.phone}`], ["Batch", batch.name], ["Period", invoiceMonth]].map(([k, v]) => (
              <div className="receipt-row" key={k}><span style={{ color: "#666" }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
            ))}
            <hr className="receipt-divider" />
            <div className="receipt-row"><span>Base Fee</span><span>₹{base.toLocaleString("en-IN")}</span></div>
            {student.discount > 0 && <div className="receipt-row" style={{ color: "#16a34a" }}><span>Discount</span><span>– ₹{student.discount.toLocaleString("en-IN")}</span></div>}
            {gst > 0 && <div className="receipt-row"><span>GST @ {batch.gstRate}%</span><span>₹{gst.toLocaleString("en-IN")}</span></div>}
            {late > 0 && <div className="receipt-row" style={{ color: "#dc2626" }}><span>Late Fee</span><span>₹{late.toLocaleString("en-IN")}</span></div>}
            <div className="receipt-row receipt-total"><span>Total Paid</span><span style={{ color: "#059669" }}>₹{total.toLocaleString("en-IN")}</span></div>
            <hr className="receipt-divider" />
            <div style={{ textAlign: "center", fontSize: 11, color: "#888", marginTop: 6 }}>Thank you for your payment! 🙏</div>
          </div>
          <div className="invoice-actions" style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => window.print()}>🖨️ Print</button>
            <button className="btn btn-wa" style={{ flex: 1, backgroundColor: "#25D366" }} onClick={shareInvoiceToWhatsApp} disabled={sharing}>
              {sharing ? "⏳ Please wait..." : "📤 Share on WhatsApp"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Student Form Modal ───────────────────────────────────────────────────────
function StudentModal({ student, batches, onSave, onClose, defaultBatchId }) {
  const [f, setF] = useState(student || { rollNumber: "", status: "Active", name: "", phone: "", email: "", batchId: defaultBatchId || batches[0]?.id || "", joiningDate: today(), notes: "", discount: 0, dueDateMode: "preset", dueDatePreference: "lastDay", customDueDate: "" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name.trim() && f.phone.trim().length === 10 && f.batchId;
  const isNewStudent = !student;
  const selectedBatch = batches.find(b => b.id === f.batchId);
  
  const DUE_DATE_PRESETS = [
    { value: "lastDay", label: "Last day of month", description: "Auto-set to last day each month" },
    { value: "15", label: "15th of month", description: "Fixed date: 15th each month" },
    { value: "20", label: "20th of month", description: "Fixed date: 20th each month" },
    { value: "25", label: "25th of month", description: "Fixed date: 25th each month" },
    { value: "endOfWeek", label: "End of week", description: "Every Friday" },
  ];
  
  const getPresetLabel = (value) => {
    return DUE_DATE_PRESETS.find(p => p.value === value)?.label || value;
  };
  
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Not set';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box">
        <div className="modal-header">
          <div><div className="modal-title">{student ? "✏️ Edit Student" : "➕ Add Student"}</div></div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><I.X /></button>
        </div>
        <div className="modal-body">
          <div className="input-row">
            <div className="input-group"><label className="input-label">Roll Number</label><input className="input" value={f.rollNumber} onChange={e => set("rollNumber", e.target.value)} placeholder="e.g. R001" /></div>
            <div className="input-group"><label className="input-label">Full Name *</label><input className="input" value={f.name} onChange={e => set("name", e.target.value)} placeholder="Aarav Sharma" /></div>
          </div>
          <div className="input-row">
            <div className="input-group"><label className="input-label">Mobile Number *</label><input className="input" value={f.phone} onChange={e => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" /></div>
            <div className="input-group"><label className="input-label">Status</label>
              <select className="input" value={f.status} onChange={e => set("status", e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="input-group"><label className="input-label">Email (optional)</label><input className="input" type="email" value={f.email} onChange={e => set("email", e.target.value)} placeholder="student@email.com" /></div>
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">Batch *</label>
              <select className="input" value={f.batchId} onChange={e => set("batchId", e.target.value)}>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="input-group"><label className="input-label">Joining Date</label><input className="input" type="date" value={f.joiningDate} onChange={e => set("joiningDate", e.target.value)} /></div>
          </div>
          <div className="input-row">
            <div className="input-group"><label className="input-label">Fee Discount (₹)</label><input className="input" type="number" min="0" value={f.discount} onChange={e => set("discount", +e.target.value)} placeholder="0" /><div className="input-hint">Applied every month before GST</div></div>
            <div className="input-group"><label className="input-label">Notes</label><input className="input" value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Any special notes..." /></div>
          </div>
          
          {/* Payment Due Date Selection */}
          <div className="input-group">
            <label className="input-label">Payment Due Date {isNewStudent && "📅"}</label>
            
            {/* Toggle between Preset and Custom */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, background: "var(--bg2)", padding: "6px", borderRadius: "8px" }}>
              <button 
                className={`btn ${f.dueDateMode === 'preset' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => set("dueDateMode", "preset")}
                style={{ flex: 1, padding: "7px 12px", fontSize: 12, borderRadius: "6px" }}
              >
                📋 Preset
              </button>
              <button 
                className={`btn ${f.dueDateMode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => set("dueDateMode", "custom")}
                style={{ flex: 1, padding: "7px 12px", fontSize: 12, borderRadius: "6px" }}
              >
                📅 Calendar
              </button>
            </div>
            
            {/* Preset Selection */}
            {f.dueDateMode === 'preset' && (
              <>
                <select 
                  className="input" 
                  value={f.dueDatePreference} 
                  onChange={e => set("dueDatePreference", e.target.value)}
                  style={{ borderRadius: "10px", marginBottom: 8 }}
                >
                  {DUE_DATE_PRESETS.map(preset => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <div className="input-hint">{DUE_DATE_PRESETS.find(p => p.value === f.dueDatePreference)?.description || "Select a due date pattern"}</div>
              </>
            )}
            
            {/* Custom Date Selection */}
            {f.dueDateMode === 'custom' && (
              <>
                <input 
                  className="input" 
                  type="date" 
                  value={f.customDueDate}
                  onChange={e => set("customDueDate", e.target.value)}
                  min={today()}
                  style={{ borderRadius: "10px", marginBottom: 8 }}
                />
                <div className="input-hint">
                  {f.customDueDate ? `Selected: ${formatDateDisplay(f.customDueDate)}` : "Pick a specific date from the calendar"}
                </div>
              </>
            )}
          </div>
          
          {/* Auto Setup Information */}
          {isNewStudent && (
            <div style={{padding: "14px 16px", background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)", borderRadius: "10px", marginTop: 16, marginBottom: 0, fontSize: "12px", color: "var(--text3)", border: "1px solid rgba(59, 130, 246, 0.2)", fontWeight: 500}}>
              <div style={{display: "flex", alignItems: "flex-start", gap: 8}}>
                <div style={{marginTop: 2}}>🤖</div>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 700, color: "var(--text)", marginBottom: 4}}>Auto Setup Every Month</div>
                  <div style={{lineHeight: "1.4"}}>
                    For this student, we'll automatically every month:
                  </div>
                  <ul style={{margin: "6px 0", paddingLeft: 20, color: "var(--text3)"}}>
                    {f.dueDateMode === 'preset' ? (
                      <>
                        <li>Create payment with due date: <strong>{getPresetLabel(f.dueDatePreference)}</strong></li>
                        <li>Apply this pattern every month automatically</li>
                      </>
                    ) : (
                      <>
                        <li>Create payment with due date: <strong>{f.customDueDate ? formatDateDisplay(f.customDueDate) : 'Please select a date'}</strong></li>
                        <li>Use same date each month (can override anytime)</li>
                      </>
                    )}
                    <li>Schedule WhatsApp reminders (1 day before & on due date)</li>
                    <li>Calculate fee based on batch rate & discount</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} onClick={() => { onSave({ ...f, id: student?.id || uid() }); onClose(); }}>{student ? "Save Changes" : "Add Student"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Batch Form Modal ──────────────────────────────────────────────────────────
function BatchModal({ batch, onSave, onClose }) {
  const COLORS = ["#10b981", "#f59e0b", "#8b5cf6", "#3b82f6", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];
  const [f, setF] = useState(batch || { name: "", subject: "", timing: "", fee: "", gstRate: 18, capacity: 20, color: COLORS[0] });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name.trim() && f.fee > 0;
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box">
        <div className="modal-header">
          <div><div className="modal-title">{batch ? "✏️ Edit Batch" : "➕ New Batch"}</div></div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><I.X /></button>
        </div>
        <div className="modal-body">
          <div className="input-row">
            <div className="input-group"><label className="input-label">Batch Name *</label><input className="input" value={f.name} onChange={e => set("name", e.target.value)} placeholder="Morning Yoga" /></div>
            <div className="input-group"><label className="input-label">Subject</label><input className="input" value={f.subject} onChange={e => set("subject", e.target.value)} placeholder="Yoga & Wellness" /></div>
          </div>
          <div className="input-row">
            <div className="input-group"><label className="input-label">Timing</label><input className="input" value={f.timing} onChange={e => set("timing", e.target.value)} placeholder="6:00 – 7:00 AM" /></div>
            <div className="input-group"><label className="input-label">Capacity (students)</label><input className="input" type="number" min="1" value={f.capacity} onChange={e => set("capacity", +e.target.value)} /></div>
          </div>
          <div className="input-row">
            <div className="input-group"><label className="input-label">Monthly Fee (₹) *</label><input className="input" type="number" min="0" value={f.fee} onChange={e => set("fee", +e.target.value)} placeholder="1500" /></div>
            <div className="input-group">
              <label className="input-label">GST Rate</label>
              <select className="input" value={f.gstRate} onChange={e => set("gstRate", +e.target.value)}>
                <option value={0}>0% — Exempt</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Batch Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => set("color", c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: f.color === c ? "3px solid var(--text)" : "3px solid transparent", transition: "var(--transition)" }} />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} onClick={() => { onSave({ ...f, id: batch?.id || uid() }); onClose(); }}>{batch ? "Save Changes" : "Create Batch"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Mark Paid / Late Fee Modal ───────────────────────────────────────────────
function MarkPaidModal({ student, batch, payment, onSave, onClose }) {
  const base = batch.fee - (student.discount || 0);
  const gst = Math.round(base * batch.gstRate / 100);
  const [lateFee, setLateFee] = useState(payment?.lateFee || 0);
  const [paidOn, setPaidOn] = useState(payment?.paidOn || today());
  const [notes, setNotes] = useState(payment?.notes || "");
  const total = base + gst + (+lateFee || 0);
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div><div className="modal-title">✅ Mark as Paid</div><div className="modal-subtitle">{student.name} · {batch.name}</div></div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><I.X /></button>
        </div>
        <div className="modal-body">
          <div style={{ background: "var(--bg3)", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 14, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "var(--text3)" }}>Base fee</span><span style={{ fontWeight: 600 }}>₹{base.toLocaleString("en-IN")}</span></div>
            {student.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "var(--text3)" }}>Discount</span><span style={{ color: "var(--accent)", fontWeight: 600 }}>– ₹{student.discount.toLocaleString("en-IN")}</span></div>}
            {gst > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "var(--text3)" }}>GST ({batch.gstRate}%)</span><span style={{ fontWeight: 600 }}>₹{gst.toLocaleString("en-IN")}</span></div>}
            {lateFee > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "var(--red)" }}>Late fee</span><span style={{ color: "var(--red)", fontWeight: 600 }}>₹{(+lateFee).toLocaleString("en-IN")}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}><span style={{ fontWeight: 700 }}>Total</span><span style={{ fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-display)", fontSize: 16 }}>{fmtINR(total)}</span></div>
          </div>
          <div className="input-row">
            <div className="input-group"><label className="input-label">Payment Date</label><input className="input" type="date" value={paidOn} onChange={e => setPaidOn(e.target.value)} /></div>
            <div className="input-group"><label className="input-label">Late Fee (₹)</label><input className="input" type="number" min="0" value={lateFee} onChange={e => setLateFee(+e.target.value)} placeholder="0" /></div>
          </div>
          <div className="input-group"><label className="input-label">Notes (optional)</label><input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Cash / UPI / Cheque..." /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onSave({ paidOn, lateFee: +lateFee, notes, amount: base + gst }); onClose(); }}>Confirm Payment</button>
        </div>
      </div>
    </div>
  );
}

// ─── Waive Fee Modal ───────────────────────────────────────────────────────────
function WaiveModal({ student, batch, onSave, onClose }) {
  const [reason, setReason] = useState("");
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <div><div className="modal-title">🔵 Waive Fee</div><div className="modal-subtitle">{student.name} — {monthLabel(curMonth)}</div></div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><I.X /></button>
        </div>
        <div className="modal-body">
          <div className="input-group"><label className="input-label">Reason for Waiver</label><textarea className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Financial hardship, scholarship..." /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ background: "var(--blue)" }} onClick={() => { onSave(reason); onClose(); }}>Waive Fee</button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────
function DashboardTab({ batches, students, payments, selectedMonth, setSelectedMonth, toast, openModal }) {
  const mPayments = payments.filter(p => p.month === selectedMonth);
  const paid = mPayments.filter(p => p.status === "paid");
  const unpaid = mPayments.filter(p => p.status === "unpaid");
  const waived = mPayments.filter(p => p.status === "waived");
  const collected = paid.reduce((a, p) => a + p.amount + (p.lateFee || 0), 0);
  const pending = unpaid.reduce((a, p) => a + p.amount, 0);
  const rate = mPayments.length ? Math.round((paid.length + waived.length) / mPayments.length * 100) : 0;

  const sparkData = months6.slice().reverse().map(m => {
    const mp = payments.filter(p => p.month === m && p.status === "paid");
    return mp.reduce((a, p) => a + p.amount, 0);
  });
  const maxSpark = Math.max(...sparkData, 1);

  const getStudent = id => students.find(s => s.id === id);
  const getBatch = id => batches.find(b => b.id === id);

  return (
    <div>
      <div className="toolbar">
        <select className="month-sel" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          {months6.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => openModal("generateFees")}>⚡ Generate Fees</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openModal("bulkReminder", unpaid)}><I.WA /> Bulk Remind ({unpaid.length})</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {[
          { icon: "💰", iconBg: "#dcfce7", label: "Collected", val: fmtINR(collected), sub: `${paid.length} payments`, color: "var(--accent)" },
          { icon: "⏳", iconBg: "#fef2f2", label: "Pending", val: fmtINR(pending), sub: `${unpaid.length} dues`, color: "var(--red)" },
          { icon: "📊", iconBg: "#eff6ff", label: "Collection Rate", val: `${rate}%`, sub: `${mPayments.length} total records`, color: "var(--blue)" },
          { icon: "🎓", iconBg: "#f5f3ff", label: "Students", val: students.length, sub: `${batches.length} batches`, color: "var(--purple)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ background: s.iconBg }} className="stat-icon-wrap">{s.icon}</div>
            <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-lbl">{s.label}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* Revenue trend */}
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">Revenue Trend</div><div className="card-subtitle">Last 6 months</div></div>
            <div className="sparkbar-wrap">
              {sparkData.map((v, i) => (
                <div key={i} className="sparkbar" style={{ height: `${Math.max(4, Math.round(v / maxSpark * 32))}px`, background: i === 5 ? "var(--accent)" : "var(--bg4)", flex: 1 }} title={fmtINR(v)} />
              ))}
            </div>
          </div>
          {months6.slice().reverse().map((m, i) => {
            const mp = payments.filter(p => p.month === m);
            const mc = mp.filter(p => p.status === "paid");
            const total = mc.reduce((a, p) => a + p.amount, 0);
            const r = mp.length ? Math.round(mc.length / mp.length * 100) : 0;
            return (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: "var(--text3)", width: 80, flexShrink: 0 }}>{monthLabel(m).split(" ")[0]}</div>
                <div className="progress" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${r}%`, background: i === 5 ? "var(--accent)" : "var(--bg4)" }} /></div>
                <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600, width: 70, textAlign: "right" }}>{fmtINR(total)}</div>
              </div>
            );
          })}
        </div>

        {/* Pending list */}
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">Pending Fees</div><div className="card-subtitle">{monthLabel(selectedMonth)}</div></div>
            {unpaid.length > 0 && <span className="badge badge-unpaid">{unpaid.length} due</span>}
          </div>
          {unpaid.length === 0
            ? <div className="empty" style={{ padding: 24 }}><div className="empty-icon">🎉</div><div className="empty-title">All fees collected!</div></div>
            : unpaid.slice(0, 6).map(p => {
              const s = getStudent(p.studentId); const b = s && getBatch(s.batchId);
              if (!s || !b) return null;
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ background: "var(--red)" }} className="dot overdue" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }} truncate="true">{s.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text4)" }}>{b.name}</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--red)" }}>{fmtINR(p.amount)}</div>
                  <button className="btn btn-wa btn-sm" onClick={() => openModal("wa", { student: s, batch: b })}><I.WA /></button>
                </div>
              );
            })}
        </div>
      </div>

      {/* Recent payments */}
      <div className="card">
        <div className="card-header">
          <div><div className="card-title">Recent Payments</div></div>
        </div>
        {paid.length === 0
          ? <div className="empty" style={{ padding: 24 }}><div className="empty-icon">💸</div><div className="empty-title">No payments yet this month</div></div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Batch</th><th>Amount</th><th>Paid On</th><th>Actions</th></tr></thead>
                <tbody>
                  {paid.slice(0, 8).map(p => {
                    const s = getStudent(p.studentId); const b = s && getBatch(s.batchId);
                    if (!s || !b) return null;
                    return (
                      <tr key={p.id}>
                        <td className="td-primary">{s.name}</td>
                        <td><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ background: b.color }} className="dot" />{b.name}</span></td>
                        <td className="td-mono" style={{ color: "var(--accent)", fontWeight: 700 }}>{fmtINR(p.amount + (p.lateFee || 0))}</td>
                        <td style={{ fontSize: 12, color: "var(--text4)" }}>{fmtDate(p.paidOn)}</td>
                        <td><button className="btn btn-secondary btn-sm" onClick={() => openModal("receipt", { student: s, batch: b, payment: p })}><I.Receipt /> Invoice</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

// ─── FEE TRACKING TAB ─────────────────────────────────────────────────────────
function FeesTab({ batches, students, payments, setPayments, selectedMonth, setSelectedMonth, toast, openModal, profile, deleteStudent }) {
  const [filterBatch, setFilterBatch] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [bulkSelected, setBulkSelected] = useState(new Set());

  const _getStudent = id => students.find(s => s.id === id);
  const getBatch = id => batches.find(b => b.id === id);
  const getPayment = (sId, m) => payments.find(p => p.studentId === sId && p.month === m);
  
  // Bulk select handlers
  const toggleBulkSelect = (paymentId) => {
    const newSelected = new Set(bulkSelected);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setBulkSelected(newSelected);
  };
  
  const selectAllVisible = () => {
    const allPaymentIds = new Set();
    filtered.forEach(s => {
      const p = getPayment(s.id, selectedMonth);
      if (p) allPaymentIds.add(p.id);
    });
    
    if (bulkSelected.size === allPaymentIds.size) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(allPaymentIds);
    }
  };
  
  const getSelectedPayments = () => {
    return payments.filter(p => bulkSelected.has(p.id));
  };

  const filtered = students.filter(s => {
    if (filterBatch !== "all" && s.batchId !== filterBatch) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.phone.includes(search)) return false;
    const p = getPayment(s.id, selectedMonth);
    if (filterStatus === "paid" && p?.status !== "paid") return false;
    if (filterStatus === "unpaid" && p?.status !== "unpaid") return false;
    if (filterStatus === "none" && p) return false;
    return true;
  });

  const mPayments = payments.filter(p => p.month === selectedMonth);
  const paid = mPayments.filter(p => p.status === "paid");
  const unpaid = mPayments.filter(p => p.status === "unpaid");
  const collected = paid.reduce((a, p) => a + p.amount + (p.lateFee || 0), 0);
  const pending = unpaid.reduce((a, p) => a + p.amount, 0);
  const rate = mPayments.length ? Math.round((paid.length) / mPayments.length * 100) : 0;

  const handleMarkPaid = async (payment, { paidOn, lateFee, notes, amount }) => {
    const prev = [...payments];
    const np = payments.map(p => p.id === payment.id
      ? { ...p, status: "paid", paidOn, lateFee, notes, amount }
      : p);
    setPayments(np); await dbSet(KEYS.payments, np);
    toast("Fee marked as paid!", { icon: "✅", onUndo: async () => { setPayments(prev); await dbSet(KEYS.payments, prev); } });
  };

  const handleUndo = async (payment) => {
    const prev = [...payments];
    const np = payments.map(p => p.id === payment.id ? { ...p, status: "unpaid", paidOn: null, lateFee: 0 } : p);
    setPayments(np);
    await dbSet(KEYS.payments, np);
    toast("Payment reverted to unpaid", { icon: "↩️" });
  };

  const handleWaive = async (payment, reason) => {
    const _prev = [...payments];
    const waivedPayment = { ...payment, status: "waived", notes: reason, paidAt: payment.paidAt || new Date().toISOString() };
    const np = payments.map(p => p.id === payment.id ? waivedPayment : p);
    setPayments(np);
    await dbSet(KEYS.payments, np);
    
    // Also update in Supabase if user is logged in
    if (user?.id) {
      await updatePayment(user.id, waivedPayment).catch(console.error);
    }
    
    toast("Fee waived successfully", { icon: "🔵" });
  };

  const exportCSV = () => {
    const rows = [["Name", "Phone", "Batch", "Month", "Amount", "Status", "Paid On", "Late Fee", "Notes"]];
    filtered.forEach(s => {
      const b = getBatch(s.batchId);
      const p = getPayment(s.id, selectedMonth);
      rows.push([s.name, s.phone, b?.name, monthLabel(selectedMonth), p ? fmtINR(p.amount) : "—", p?.status || "not generated", p?.paidOn || "—", p?.lateFee || 0, p?.notes || ""]);
    });
    const csv = rows.map(r => r.map(c => `\"${c}\"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `FeeSync_${selectedMonth}.csv`; a.click();
    toast("CSV exported!", { icon: "📥" });
  };

  return (
    <div>
      <div className="toolbar">
        <select className="month-sel" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          {months6.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => openModal("generateFees")}>⚡ Generate</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><I.Download /> Export CSV</button>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 16 }}>
        {[
          { l: "Collected", v: fmtINR(collected), c: "var(--accent)" },
          { l: "Pending", v: fmtINR(pending), c: "var(--red)" },
          { l: "Rate", v: `${rate}%`, c: "var(--blue)" },
          { l: "Waived", v: mPayments.filter(p => p.status === "waived").length, c: "var(--text3)" },
        ].map(s => (
          <div key={s.l} className="stat-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 4, fontWeight: 500 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div className="search-wrap" style={{ flex: "1 1 180px" }}>
            <I.Search /><input className="input" style={{ paddingLeft: 34 }} placeholder="Search student or phone..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-tabs">
            {["all", "paid", "unpaid", "none"].map(s => (
              <div key={s} className={`filter-tab ${filterStatus === s ? "active" : ""}`} onClick={() => setFilterStatus(s)}>
                {s === "all" ? "All" : s === "none" ? "Not Generated" : s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
            ))}
          </div>
          <select className="month-sel" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
            <option value="all">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {bulkSelected.size > 0 && (
            <button className="btn btn-primary btn-sm" onClick={() => openModal("bulkMarkPaid", { payments: getSelectedPayments() })} style={{ marginLeft: "auto" }}>
              ✓ Mark {bulkSelected.size} as Paid
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: "center", padding: "10px 8px" }}>
                  <input 
                    type="checkbox" 
                    checked={bulkSelected.size > 0 && bulkSelected.size === payments.filter(p => p.month === selectedMonth).length}
                    onChange={selectAllVisible}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th>Student</th><th>Batch</th><th>Amount</th><th>Status</th><th>Due Date</th><th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7}><div className="empty"><div className="empty-icon">🔍</div><div className="empty-title">No results found</div></div></td></tr>
              )}
              {filtered.map(s => {
                const b = getBatch(s.batchId);
                if (!b) return null;
                const p = getPayment(s.id, selectedMonth);
                const amt = p ? p.amount : b.fee - (s.discount || 0) + Math.round((b.fee - (s.discount || 0)) * b.gstRate / 100);
                const daysUntilDue = p?.dueDate ? Math.ceil((new Date(p.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                const isDaysOverdue = daysUntilDue !== null && daysUntilDue < 0;
                
                return (
                  <tr key={s.id}>
                    <td style={{ width: 40, textAlign: "center", padding: "10px 8px" }}>
                      <input 
                        type="checkbox" 
                        checked={p ? bulkSelected.has(p.id) : false}
                        onChange={() => p && toggleBulkSelect(p.id)}
                        disabled={!p}
                        style={{ cursor: p ? "pointer" : "not-allowed", opacity: p ? 1 : 0.5 }}
                      />
                    </td>
                    <td>
                      <div className="td-primary">{s.name}</div>
                      {s.notes && <div style={{ fontSize: 11, color: "var(--amber)" }}>📝 {s.notes}</div>}
                    </td>
                    <td>{b && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5 }}><span style={{ background: b.color }} className="dot" />{b.name}</span>}</td>
                    <td>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700 }}>{fmtINR(amt + (p?.lateFee || 0))}</div>
                      {s.discount > 0 && <div style={{ fontSize: 10, color: "var(--amber)" }}>₹{s.discount} discount</div>}
                      {p?.lateFee > 0 && <div style={{ fontSize: 10, color: "var(--red)" }}>+₹{p.lateFee} late</div>}
                    </td>
                    <td>
                      {p
                        ? <span className={`badge ${p.status === "paid" ? "badge-paid" : p.status === "waived" ? "badge-waived" : "badge-unpaid"}`}>
                          {p.status === "paid" ? "✓ Paid" : p.status === "waived" ? "🔵 Waived" : "⏳ Unpaid"}
                        </span>
                        : <span className="badge" style={{ background: "var(--bg3)", color: "var(--text4)" }}>Not generated</span>}
                    </td>
                    <td style={{ fontSize: 11, color: "var(--text4)", textAlign: "center" }}>
                      {p?.dueDate 
                        ? <span style={{ fontWeight: 600, color: isDaysOverdue ? "var(--red)" : daysUntilDue <= 2 ? "var(--amber)" : "var(--accent)" }}>
                            {isDaysOverdue ? `${Math.abs(daysUntilDue)}d overdue` : daysUntilDue === 0 ? "Today" : `${daysUntilDue}d left`}
                          </span>
                        : "—"
                      }
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 5, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {p && p.status === "unpaid" && (
                          <>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openModal("setDueDate", { payment: p })} title="Set due date">📅</button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openModal("createInstallments", { payment: p, student: s, batch: b })} title="Create installments">💳</button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openModal("reminderScheduler", { payment: p, student: s, batch: b })} title="Schedule reminder">🔔</button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openModal("markPaid", { payment: p, student: s, batch: b })} title="Mark as paid">✅</button>
                          </>
                        )}
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openModal("editStudent", s)} title="Edit"><I.Edit /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--red)" }} onClick={() => { 
                          console.log('[DEBUG] Delete student clicked:', s.name); 
                          const studentData = s;
                          openModal("confirm", { 
                            icon: "🗑️", 
                            title: "Remove Student?", 
                            msg: `Remove ${s.name} from all batches and delete their payment records?`, 
                            confirmLabel: "Remove", 
                            danger: true, 
                            onConfirm: () => { 
                              console.log('[DEBUG] Confirm delete for student:', studentData.name, 'ID:', studentData.id);
                              deleteStudent(studentData); 
                            } 
                          }); 
                        }} title="Delete"><I.Trash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark paid handler — needs to be passed */}
      {/* This is handled via openModal("markPaid", ...) */}
    </div>
  );
}

// ─── BATCHES & STUDENTS TAB ───────────────────────────────────────────────────
function BatchesTab({ user, batches, setBatches, students, setStudents, payments, setPayments, toast, openModal, selectedBatch, setSelectedBatch, profile }) {
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");

  const deleteBatch = async (batch) => {
    console.log('[DEBUG] deleteBatch wrapper called with:', batch);
    const hasStu = students.some(s => s.batchId === batch.id);
    console.log('[DEBUG] Batch has students:', hasStu);
    if (hasStu) { toast("Cannot delete batch with students. Move students first.", { icon: "⚠️" }); return; }
    const prev = [...batches];
    const nb = batches.filter(b => b.id !== batch.id);
    setBatches(nb); await dbSet(KEYS.batches, nb);
    
    // Also delete from Supabase if user is logged in
    if (user?.id) {
      await deleteBatchFromDb(user.id, batch.id).catch(console.error);
    }
    
    if (selectedBatch && selectedBatch.id === batch.id) {
      setSelectedBatch(null);
    }
    toast("Batch deleted", { icon: "🗑️", onUndo: async () => { setBatches(prev); await dbSet(KEYS.batches, prev); } });
  };

  const deleteStudent = async (student) => {
    console.log('[DEBUG] deleteStudent wrapper called with:', student);
    const prev = { students: [...students], payments: [...payments] };
    const ns = students.filter(s => s.id !== student.id);
    const np = payments.filter(p => p.studentId !== student.id);
    setStudents(ns); setPayments(np);
    await dbSet(KEYS.students, ns); await dbSet(KEYS.payments, np);
    
    // Also delete from Supabase if user is logged in
    if (user?.id) {
      console.log('[DEBUG] Deleting from Supabase, userId:', user.id, 'studentId:', student.id);
      await deleteStudentFromDb(user.id, student.id).catch(console.error);
      for (const p of prev.payments.filter(p => p.studentId === student.id)) {
        await deletePaymentFromDb(user.id, p.id).catch(console.error);
      }
    } else {
      console.log('[DEBUG] No user logged in, skipping Supabase delete');
    }
    
    toast("Student removed", { icon: "🗑️", onUndo: async () => { setStudents(prev.students); setPayments(prev.payments); await dbSet(KEYS.students, prev.students); await dbSet(KEYS.payments, prev.payments); } });
  };

  const handleRevertPayment = async (student, payment) => {
    const revertedPayment = { ...payment, status: "unpaid", paidOn: null, paidAt: null, lateFee: 0, notes: "" };
    const np = payments.map(p => p.id === payment.id ? revertedPayment : p);
    setPayments(np);
    await dbSet(KEYS.payments, np);
    
    // Also update in Supabase if user is logged in
    if (user?.id) {
      await updatePayment(user.id, revertedPayment).catch(console.error);
    }
    
    toast(`Payment reverted for ${student.name}`, { icon: "↩️" });
  };

  const handleRevertWaiver = async (student, payment) => {
    const waivedPayment = { ...payment, status: "unpaid", paidOn: null, paidAt: null, notes: "" };
    const np = payments.map(p => p.id === payment.id ? waivedPayment : p);
    setPayments(np);
    await dbSet(KEYS.payments, np);
    
    // Also update in Supabase if user is logged in
    if (user?.id) {
      await updatePayment(user.id, waivedPayment).catch(console.error);
    }
    
    toast(`Fee waiver removed for ${student.name}`, { icon: "↩️" });
  };

  const filteredStudents = students.filter(s =>
    (!search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(search.toLowerCase()))
    ) &&
    (!batchFilter || s.batchId === batchFilter)
  );

  const getCurPayment = (sId) => payments.find(p => p.id === sId && p.month === curMonth);
  const getBatch = id => batches.find(b => b.id === id);

  // if a specific batch is selected, show the detail panel
  if (selectedBatch) {
    return (
      <div>
        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedBatch(null)} style={{ marginBottom: 12 }}><span aria-hidden="true">&lt;</span> Back to all batches</button>
        <BatchDetails
          batch={selectedBatch}
          students={students}
          payments={payments}
          onEditBatch={(b) => openModal("editBatch", b)}
          onDeleteBatch={(b) => openModal("confirm", { icon: "🗑️", title: "Delete Batch?", msg: `Delete "${b.name}"? This cannot be undone.`, confirmLabel: "Delete", danger: true, onConfirm: () => deleteBatch(b) })}
          onAddStudent={() => openModal("addStudent", { batchId: selectedBatch.id })}
          onEditStudent={(s) => openModal("editStudent", s)}
          onDeleteStudent={(s) => openModal("confirm", { icon: "🗑️", title: "Remove Student?", msg: `Remove ${s.name} from this batch?`, confirmLabel: "Remove", danger: true, onConfirm: () => deleteStudent(s) })}
          onMarkPaid={(s,p) => openModal("markPaid", { student: s, batch: selectedBatch, payment: p })}
          onWaiveFee={(s,p) => openModal("waive", { student: s, batch: selectedBatch, payment: p })}
          onSendInvoice={(s,p) => openModal("receipt", { student: s, batch: selectedBatch, payment: p })}
          onRevertPayment={handleRevertPayment}
          onRevertWaiver={handleRevertWaiver}
          onSendReminder={(s) => openModal("wa", { student: s, batch: selectedBatch })}
          toast={toast}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="toolbar" style={{ gap: 8, flexWrap: "wrap" }}>
        <div className="search-wrap" style={{ flex: "1 1 200px", maxWidth: 300 }}>
          <I.Search /><input className="input" style={{ paddingLeft: 34 }} placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" value={batchFilter} onChange={e => setBatchFilter(e.target.value)} style={{ flex: "0 0 160px" }}>
          <option value="">All Batches</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={() => openModal("addBatch")}><I.Plus /> New Batch</button>
          <button className="btn btn-primary" onClick={() => openModal("addStudent")}><I.Plus /> Add Student</button>
        </div>
      </div>

      {/* Batch cards */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {batches.map(b => {
          const enrolled = students.filter(s => s.batchId === b.id).length;
          const capPct = Math.min(100, Math.round(enrolled / b.capacity * 100));
          const mPaid = payments.filter(p => p.month === curMonth && p.status === "paid" && students.find(s => s.id === p.studentId && s.batchId === b.id)).length;
          return (
            <div key={b.id} className="batch-card" onClick={() => setSelectedBatch(b)} style={{ cursor: 'pointer' }}>
              <div className="batch-strip" style={{ background: b.color }} />
              <div className="batch-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text4)", marginTop: 2 }}>{b.subject} · {b.timing}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); openModal("editBatch", b); }}><I.Edit /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--red)" }} onClick={(e) => { 
                      e.stopPropagation(); 
                      e.preventDefault();
                      console.log('[DEBUG] Delete batch button clicked, opening modal for:', b.name);
                      const batchData = b;
                      openModal("confirm", { 
                        icon: "🗑️", 
                        title: "Delete Batch?", 
                        msg: `Delete "${b.name}"? This cannot be undone.`, 
                        confirmLabel: "Delete", 
                        danger: true, 
                        onConfirm: () => { 
                          console.log('[DEBUG] Confirm delete for batch:', batchData.name, 'ID:', batchData.id);
                          deleteBatch(batchData); 
                        } 
                      }); 
                    }}><I.Trash /></button>
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: b.color, marginBottom: 8 }}>
                  {fmtINR(b.fee + Math.round(b.fee * b.gstRate / 100))}
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text4)", fontWeight: 400 }}>/mo{b.gstRate ? ` incl. ${b.gstRate}% GST` : ""}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text4)", marginBottom: 6 }}>
                  <span>{enrolled}/{b.capacity} students</span>
                  <span>{mPaid}/{enrolled} paid this month</span>
                </div>
                <div className="progress"><div className="progress-fill" style={{ width: `${capPct}%`, background: b.color }} /></div>
              </div>
            </div>
          );
        })}
        {batches.length === 0 && <div style={{ gridColumn: "1/-1" }}><div className="empty"><div className="empty-icon">📚</div><div className="empty-title">No batches yet</div><div className="empty-desc">Create your first batch to get started</div></div></div>}
      </div>

      {/* Students table */}
      <div className="card">
        <div className="card-header">
          <div><div className="card-title">All Students</div><div className="card-subtitle">{filteredStudents.length} students</div></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Phone</th><th>Batch</th><th>Joined</th><th>Discount</th><th>This Month</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>
              {filteredStudents.length === 0 && <tr><td colSpan={7}><div className="empty"><div className="empty-icon">👥</div><div className="empty-title">No students found</div></div></td></tr>}
              {filteredStudents.map(s => {
                const b = getBatch(s.batchId);
                const p = getCurPayment(s.id);
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="td-primary">{s.name}</div>
                      {s.notes && <div style={{ fontSize: 11, color: "var(--amber)" }}>📝 {s.notes}</div>}
                    </td>
                    <td className="td-mono" style={{ fontSize: 12 }}>{s.phone}</td>
                    <td>{b && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5 }}><span style={{ background: b.color }} className="dot" />{b.name}</span>}</td>
                    <td style={{ fontSize: 12, color: "var(--text4)" }}>{fmtDate(s.joiningDate)}</td>
                    <td>{s.discount > 0 ? <span className="badge badge-discount">– {fmtINR(s.discount)}</span> : <span style={{ color: "var(--text4)", fontSize: 12 }}>None</span>}</td>
                    <td>{p ? <span className={`badge ${p.status === "paid" ? "badge-paid" : p.status === "waived" ? "badge-waived" : "badge-unpaid"}`}>{p.status === "paid" ? "Paid" : p.status === "waived" ? "Waived" : "Due"}</span> : <span style={{ fontSize: 12, color: "var(--text4)"}}>—</span>}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openModal("editStudent", s)} title="Edit"><I.Edit /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--red)" }} onClick={() => { 
                          console.log('[DEBUG] Delete student clicked:', s.name); 
                          const studentData = s;
                          openModal("confirm", { 
                            icon: "🗑️", 
                            title: "Remove Student?", 
                            msg: `Remove ${s.name} from all batches and delete their payment records?`, 
                            confirmLabel: "Remove", 
                            danger: true, 
                            onConfirm: () => { 
                              console.log('[DEBUG] Confirm delete for student:', studentData.name, 'ID:', studentData.id);
                              deleteStudent(studentData); 
                            } 
                          }); 
                        }} title="Delete"><I.Trash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── REPORTS TAB ──────────────────────────────────────────────────────────────
function ReportsTab({ batches, students, payments }) {
  const getBatch = id => batches.find(b => b.id === id);
  const _getStudent = id => students.find(s => s.id === id);

  const totalGST = (month) => batches.reduce((acc, b) => {
    const bStu = students.filter(s => s.batchId === b.id);
    const bPaid = payments.filter(p => p.month === month && p.status === "paid" && bStu.find(s => s.id === p.studentId));
    return acc + bPaid.reduce((a, p) => a + Math.round(p.amount * b.gstRate / (100 + b.gstRate)), 0);
  }, 0);

  return (
    <div>
      {/* 6-month table */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div><div className="card-title">6-Month Revenue Report</div></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Month</th><th>Expected</th><th>Collected</th><th>Pending</th><th>GST</th><th>Rate</th></tr></thead>
            <tbody>
              {months6.map(m => {
                const mp = payments.filter(p => p.month === m);
                const mc = mp.filter(p => p.status === "paid");
                const collected = mc.reduce((a, p) => a + p.amount + (p.lateFee || 0), 0);
                const expected = mp.reduce((a, p) => a + p.amount, 0);
                const pending = mp.filter(p => p.status === "unpaid").reduce((a, p) => a + p.amount, 0);
                const rate = mp.length ? Math.round(mc.length / mp.length * 100) : 0;
                const gst = totalGST(m);
                const isCur = m === curMonth;
                return (
                  <tr key={m} style={{ fontWeight: isCur ? 700 : 400 }}>
                    <td><span style={{ color: isCur ? "var(--accent)" : "inherit" }}>{monthLabel(m)}{isCur ? " •" : ""}</span></td>
                    <td className="td-mono">{fmtINR(expected)}</td>
                    <td className="td-mono" style={{ color: "var(--accent)" }}>{fmtINR(collected)}</td>
                    <td className="td-mono" style={{ color: pending > 0 ? "var(--red)" : "var(--text4)" }}>{fmtINR(pending)}</td>
                    <td className="td-mono" style={{ color: "var(--amber)" }}>{fmtINR(gst)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress" style={{ width: 60 }}><div className="progress-fill" style={{ width: `${rate}%`, background: rate >= 90 ? "var(--accent)" : rate >= 60 ? "var(--amber)" : "var(--red)" }} /></div>
                        <span style={{ fontSize: 12, fontWeight: 700, width: 30, color: rate >= 90 ? "var(--accent)" : rate >= 60 ? "var(--amber)" : "var(--red)" }}>{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        {/* GST summary */}
        <div className="card">
          <div className="card-header"><div><div className="card-title">GST Summary — {monthLabel(curMonth)}</div></div></div>
          {batches.map(b => {
            const bStu = students.filter(s => s.batchId === b.id);
            const bPaid = payments.filter(p => p.month === curMonth && p.status === "paid" && bStu.find(s => s.id === p.studentId));
            const taxable = bPaid.reduce((a, p) => a + p.amount - Math.round(p.amount * b.gstRate / (100 + b.gstRate)), 0);
            const gstAmt = bPaid.reduce((a, p) => a + Math.round(p.amount * b.gstRate / (100 + b.gstRate)), 0);
            return (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><span style={{ background: b.color }} className="dot" />{b.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text4)" }}>GST @ {b.gstRate}% · {bPaid.length} students</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--amber)" }}>{fmtINR(gstAmt)}</div>
                  <div style={{ fontSize: 11, color: "var(--text4)" }}>Base: {fmtINR(taxable)}</div>
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontWeight: 700 }}>
            <span>Total GST Collected</span>
            <span style={{ color: "var(--amber)", fontFamily: "var(--font-mono)" }}>{fmtINR(totalGST(curMonth))}</span>
          </div>
        </div>

        {/* Top students */}
        <div className="card">
          <div className="card-header"><div><div className="card-title">Payment Consistency</div></div></div>
          {students.map(s => {
            const hist = months6.filter(m => payments.find(p => p.studentId === s.id && p.month === m));
            const paid = hist.filter(m => payments.find(p => p.studentId === s.id && p.month === m && p.status === "paid")).length;
            const rate = hist.length ? Math.round(paid / hist.length * 100) : 0;
            const b = getBatch(s.batchId);
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text4)" }}>{b?.name}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="progress" style={{ width: 60 }}><div className="progress-fill" style={{ width: `${rate}%`, background: rate >= 90 ? "var(--accent)" : rate >= 70 ? "var(--amber)" : "var(--red)" }} /></div>
                  <span style={{ fontSize: 12, fontWeight: 700, width: 30, color: rate >= 90 ? "var(--accent)" : rate >= 70 ? "var(--amber)" : "var(--red)" }}>{rate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ─── GENERATE FEES MODAL ──────────────────────────────────────────────────────
function GenerateFeesModal({ user, batches, students, payments, setPayments, selectedMonth, toast, onClose }) {
  const existing = payments.filter(p => p.month === selectedMonth).map(p => p.studentId);
  const toGenerate = students.filter(s => !existing.includes(s.id));
  const doGenerate = async () => {
    if (toGenerate.length === 0) { toast("All fees already generated for this month!", { icon: "ℹ️" }); onClose(); return; }
    const newPayments = [...payments];
    toGenerate.forEach(s => {
      const b = batches.find(b => b.id === s.batchId);
      if (b) {
        const base = b.fee - (s.discount || 0);
        const total = base + Math.round(base * b.gstRate / 100);
        newPayments.push({ id: uid(), studentId: s.id, month: selectedMonth, status: "unpaid", amount: total, lateFee: 0, notes: "" });
      }
    });
    setPayments(newPayments); await dbSet(KEYS.payments, newPayments);
    
    // Also save new payments to Supabase if user is logged in
    if (user?.id) {
      for (const p of newPayments.slice(payments.length)) {
        await createPayment(user.id, p).catch(console.error);
      }
    }
    
    toast(`Generated ${toGenerate.length} fee records for ${monthLabel(selectedMonth)}!`, { icon: "⚡" });
    onClose();
  };
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box" style={{ maxWidth: 380 }}>
        <div className="modal-header"><div><div className="modal-title">⚡ Generate Fees</div></div></div>
        <div className="modal-body">
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Generate for {monthLabel(selectedMonth)}</div>
            <div style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.6 }}>
              {toGenerate.length > 0 ? <><strong style={{ color: "var(--accent)" }}>{toGenerate.length} students</strong> don't have fee records yet. Generate now?</> : "All students already have fee records for this month."}
            </div>
          </div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={doGenerate}>Generate{toGenerate.length > 0 ? ` (${toGenerate.length})` : ""}</button></div>
      </div>
    </div>
  );
}

// ─── BULK REMINDER MODAL ──────────────────────────────────────────────────────
function BulkReminderModal({ unpaid, students, batches, selectedMonth, whatsappConfig, onClose }) {
  const getStudent = id => students.find(s => s.id === id);
  const getBatch = id => batches.find(b => b.id === id);
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-header"><div><div className="modal-title">📲 Bulk WhatsApp Reminder</div><div className="modal-subtitle">{unpaid.length} students with pending fees</div></div><button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><I.X /></button></div>
        <div className="modal-body">
          <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 12, lineHeight: 1.6 }}>
            Click each student's button to open WhatsApp with a pre-filled reminder message. Send them one by one.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
            {unpaid.map(p => {
              const s = getStudent(p.studentId); const b = s && getBatch(s.batchId);
              if (!s || !b) return null;
              const msg = buildReminderMessage({
                student: s,
                batch: b,
                month: selectedMonth,
                amount: p.amount,
                whatsappConfig,
              });
              return (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--bg3)", borderRadius: "var(--radius-sm)" }}>
                  <div><div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div><div style={{ fontSize: 11, color: "var(--text4)" }}>{b.name} · {fmtINR(p.amount)}</div></div>
                  <a href={`https://wa.me/91${s.phone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="btn btn-wa btn-sm" style={{ textDecoration: "none" }}><I.WA /> Send</a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
function FeeSyncPro({ user, authProfile }) {
  const [tab, setTab] = useState("dashboard");
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [profile, setProfile] = useState(SEED_PROFILE);
  const [selectedMonth, setSelectedMonth] = useState(curMonth);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");
  const [modal, setModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [whatsappConfig, setWhatsappConfig] = useState(DEFAULT_WHATSAPP_CONFIG);
  const [uiSettings, setUiSettings] = useState(DEFAULT_UI_SETTINGS);

  const [selectedBatch, setSelectedBatch] = useState(null);
  const { toasts, push: toast, dismiss } = useToast();

  // Pending handler stored in ref (to avoid stale closure in FeesTab)
  const _pendingMarkPaid = useRef(null);

  // Handle sign out - will trigger auth state change in Root
  const handleSignOut = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userId = user?.id;
        
        // Defaults/fallbacks to keep dashboard usable even when network is unstable.
        let supabaseBatches = [];
        let supabaseStudents = [];
        let supabasePayments = [];
        let supabaseProfile = null;
        let supabaseSettings = null;

        if (userId) {
          try {
            // Helper to add timeout to individual queries (6 sec per query - enough time for network)
            const withTimeout = (promise, ms = 6000) =>
              Promise.race([
                promise.catch(err => {
                  console.warn('Query error:', err?.message);
                  return null;  // Return null on error, not throw
                }),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Query timeout')), ms)
                ),
              ]).catch(err => {
                console.warn('Query failed:', err?.message);
                return null;
              });

            // Use allSettled so all queries run in parallel; failures don't block the others
            const results = await Promise.allSettled([
              withTimeout(fetchBatches(userId)),
              withTimeout(fetchStudents(userId)),
              withTimeout(fetchPayments(userId)),
              withTimeout(fetchProfile(userId)),
              withTimeout(fetchSettings(userId)),
            ]);

            // Extract values with fallbacks
            supabaseBatches = results[0]?.value || [];
            supabaseStudents = results[1]?.value || [];
            supabasePayments = results[2]?.value || [];
            supabaseProfile = results[3]?.value || null;
            supabaseSettings = results[4]?.value || null;

            // Log successful loads
            const loadedCount = [supabaseBatches, supabaseStudents, supabasePayments].filter(x => x?.length > 0).length;
            if (loadedCount > 0) {
              console.log(`Supabase data loaded: ${supabaseBatches.length} batches, ${supabaseStudents.length} students, ${supabasePayments.length} payments`);
            } else {
              console.warn('No Supabase data loaded. Using local data.');
            }
          } catch (supabaseLoadError) {
            console.warn("Supabase data load failed, falling back to local data:", supabaseLoadError?.message);
          }
        }

        // If Supabase has data, use it; otherwise fall back to localStorage/seed.
        const hasSupabaseData =
          supabaseBatches.length > 0 ||
          supabaseStudents.length > 0 ||
          supabasePayments.length > 0;

        let b, s, p, pr, th, feat, waCfg, uiCfg;

        if (hasSupabaseData && userId) {
          b = supabaseBatches;
          s = supabaseStudents;
          p = supabasePayments;
          pr = supabaseProfile || SEED_PROFILE;
          th = "light";
          feat = supabaseSettings
            ? {
                showPayments: true,
                showStudents: true,
                showReports: true,
                showAttendance: true,
                enableNotifications: true,
                enableDarkMode: true,
                enableWaiveFee: true,
                enableGST: supabaseSettings.enable_gst !== false,
                enableWhatsApp: supabaseSettings.enable_whatsapp !== false,
              }
            : DEFAULT_FEATURES;
          waCfg = DEFAULT_WHATSAPP_CONFIG;
          uiCfg = DEFAULT_UI_SETTINGS;
        } else {
          [b, s, p, pr, th, feat, waCfg, uiCfg] = await Promise.all([
            dbGet(KEYS.batches, SEED_BATCHES),
            dbGet(KEYS.students, SEED_STUDENTS),
            dbGet(KEYS.payments, SEED_PAYMENTS),
            dbGet(KEYS.profile, SEED_PROFILE),
            dbGet(KEYS.theme, "light"),
            dbGet(KEYS.features, DEFAULT_FEATURES),
            dbGet(KEYS.whatsappConfig, DEFAULT_WHATSAPP_CONFIG),
            dbGet(KEYS.uiSettings, DEFAULT_UI_SETTINGS),
          ]);

          // Best-effort migration only (never block app if any insert fails).
          if (userId && (b.length > 0 || s.length > 0 || p.length > 0)) {
            Promise.allSettled([
              ...b.map((batch) => createBatch(userId, batch)),
              ...s.map((student) => createStudent(userId, student)),
              ...p.map((payment) => createPayment(userId, payment)),
              ...(pr ? [saveProfile(userId, pr)] : []),
            ]).catch(() => {});
          }
        }

        if (cancelled) return;

        const normalizedStudents = (s || []).map((st) => ({
          rollNumber: st.rollNumber || "",
          status: st.status || "Active",
          ...st,
        }));

        setBatches(b || []);
        setStudents(normalizedStudents);
        setPayments(p || []);
        setProfile(normalizeInstituteProfile(pr));
        setTheme(th || "light");
        setFeatures({ ...DEFAULT_FEATURES, ...(feat || {}) });
        setWhatsappConfig(normalizeWhatsAppConfig(waCfg || DEFAULT_WHATSAPP_CONFIG));
        setUiSettings({ ...DEFAULT_UI_SETTINGS, ...(uiCfg || {}) });
      } catch (err) {
        console.error("Dashboard bootstrap failed, using safe defaults:", err);
        if (cancelled) return;

        // Last-resort fallback: never keep user stuck on loading screen.
        setBatches(SEED_BATCHES);
        setStudents(SEED_STUDENTS);
        setPayments(SEED_PAYMENTS);
        setProfile(SEED_PROFILE);
        setTheme("light");
        setFeatures(DEFAULT_FEATURES);
        setWhatsappConfig(DEFAULT_WHATSAPP_CONFIG);
        setUiSettings(DEFAULT_UI_SETTINGS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    dbSet(KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    dbSet(KEYS.profile, profile);
    // Also save to Supabase if user is logged in
    if (user?.id && profile) {
      saveProfile(user.id, profile).catch(console.error);
    }
  }, [profile, user?.id]);

  useEffect(() => {
    dbSet(KEYS.features, features);
    // Also save to Supabase if user is logged in
    if (user?.id) {
      saveSettings(user.id, {
        enable_gst: features.enableGST,
        enable_discounts: features.enableGST,
        enable_late_fees: features.enableGST,
        enable_whatsapp: features.enableWhatsApp,
        csv_export: features.showReports,
        compact_mode: features.compactMode,
      }).catch(console.error);
    }
  }, [features, user?.id]);

  useEffect(() => {
    dbSet(KEYS.whatsappConfig, whatsappConfig);
  }, [whatsappConfig]);

  useEffect(() => {
    dbSet(KEYS.uiSettings, uiSettings);
  }, [uiSettings]);

  useEffect(() => {
    const palette = UI_THEME_PALETTE[uiSettings?.colorTheme] || UI_THEME_PALETTE[DEFAULT_UI_SETTINGS.colorTheme];
    const baseFont = UI_FONT_SIZE[uiSettings?.fontSize] || UI_FONT_SIZE[DEFAULT_UI_SETTINGS.fontSize];
    const scale = UI_FONT_SCALE[uiSettings?.fontSize] || UI_FONT_SCALE[DEFAULT_UI_SETTINGS.fontSize];
    const root = document.documentElement;

    root.style.setProperty("--accent", palette.accent);
    root.style.setProperty("--accent-dark", palette.accentDark);
    root.style.setProperty("--accent-light", palette.accentLight);
    root.style.setProperty("--global-font-size", baseFont);
    root.style.setProperty("--global-scale", String(scale));
  }, [uiSettings]);

  useEffect(() => {
    if (
      (tab === "fees" && !features.showPayments) ||
      (tab === "batches" && !features.showStudents) ||
      (tab === "reports" && !features.showReports)
    ) {
      setTab("dashboard");
    }
  }, [features, tab]);

  const closeModal = () => setModal(null);

  const openModal = useCallback((type, data) => setModal({ type, data }), []);

  // Batch CRUD
  const saveBatch = async (b) => {
    const nb = batches.find(x => x.id === b.id)
      ? batches.map(x => x.id === b.id ? b : x)
      : [...batches, b];
    setBatches(nb); await dbSet(KEYS.batches, nb);
    
    // Also save to Supabase if user is logged in
    if (user?.id) {
      if (batches.find(x => x.id === b.id)) {
        await updateBatch(user.id, b).catch(console.error);
      } else {
        await createBatch(user.id, b).catch(console.error);
      }
    }
    
    toast(batches.find(x => x.id === b.id) ? "Batch updated!" : "Batch created!", { icon: "✅" });
  };

  // Student CRUD
  const saveStudent = async (s) => {
    // Student data stays as-is (includes dueDatePreference)
    const studentToSave = { ...s };
    
    const isEdit = students.find(x => x.id === studentToSave.id);
    const ns = isEdit ? students.map(x => x.id === studentToSave.id ? studentToSave : x) : [...students, studentToSave];
    setStudents(ns); await dbSet(KEYS.students, ns);
    
    // Also save to Supabase if user is logged in
    if (user?.id) {
      if (isEdit) {
        await updateStudent(user.id, studentToSave).catch(console.error);
      } else {
        await createStudent(user.id, studentToSave).catch(console.error);
      }
    }
    
    if (!isEdit) {
      // New student - create first payment with their due date preference or custom date
      const b = batches.find(b => b.id === studentToSave.batchId);
      if (b) {
        const base = b.fee - (studentToSave.discount || 0);
        const total = base + Math.round(base * b.gstRate / 100);
        
        // Determine due date based on mode
        let dueDate;
        if (studentToSave.dueDateMode === 'custom' && studentToSave.customDueDate) {
          // Use custom date directly
          dueDate = studentToSave.customDueDate;
        } else {
          // Calculate from preset preference
          dueDate = calculateDueDateFromPreference(
            studentToSave.dueDatePreference || 'lastDay',
            new Date()
          );
        }
        
        // Create payment with calculated/custom due date
        let newPayment = { 
          id: uid(), 
          studentId: studentToSave.id, 
          month: curMonth, 
          status: "unpaid", 
          amount: total, 
          lateFee: 0, 
          notes: "", 
          reminders: [],
          dueDate: dueDate
        };
        
        // Apply reminders based on the due date
        newPayment = applyAutoPaymentSetup(newPayment, {
          autoDueDate: false, // Don't recalculate, we already set it
          autoReminders: true, // Create WhatsApp reminders
        });
        
        const np = [...payments, newPayment];
        setPayments(np); await dbSet(KEYS.payments, np);
        
        // Also save payment to Supabase if user is logged in
        if (user?.id) {
          await createPayment(user.id, newPayment).catch(console.error);
        }
      }
    } else {
      // Edit student - update amount on unpaid payments (keep their due dates)
      const b = batches.find(b => b.id === studentToSave.batchId);
      if (b) {
        const base = b.fee - (studentToSave.discount || 0);
        const newAmt = base + Math.round(base * b.gstRate / 100);
        const np = payments.map(p => p.studentId === studentToSave.id && p.status === "unpaid" ? { ...p, amount: newAmt } : p);
        setPayments(np); await dbSet(KEYS.payments, np);
        
        // Also update payments in Supabase
        if (user?.id) {
          for (const p of np) {
            if (p.studentId === studentToSave.id && p.status === "unpaid") {
              await updatePayment(user.id, p).catch(console.error);
            }
          }
        }
      }
    }
    toast(isEdit ? "Student updated!" : "✨ Student added with auto due date & reminders!", { icon: "✅" });
  };

  const deleteStudent = async (student) => {
    const prev = { students: [...students], payments: [...payments] };
    const ns = students.filter((s) => s.id !== student.id);
    const np = payments.filter((p) => p.studentId !== student.id);

    setStudents(ns);
    setPayments(np);
    await dbSet(KEYS.students, ns);
    await dbSet(KEYS.payments, np);
    
    // Also delete from Supabase if user is logged in
    if (user?.id) {
      await deleteStudentFromDb(user.id, student.id).catch(console.error);
      // Delete associated payments from Supabase
      for (const p of prev.payments.filter(p => p.studentId === student.id)) {
        await deletePaymentFromDb(user.id, p.id).catch(console.error);
      }
    }

    toast("Student removed", {
      icon: "🗑️",
      onUndo: async () => {
        setStudents(prev.students);
        setPayments(prev.payments);
        await dbSet(KEYS.students, prev.students);
        await dbSet(KEYS.payments, prev.payments);
      },
    });
  };

  // Mark paid handler
  const handleMarkPaid = async (payment, { paidOn, lateFee, notes, amount }) => {
    const prev = [...payments];
    // When payment is marked as paid, clear all reminders (no need to send them)
    const updatedPayment = { 
      ...payment, 
      status: "paid", 
      paidOn, 
      paidAt: new Date().toISOString(), 
      lateFee, 
      notes, 
      amount,
      reminders: [], // Clear reminders when paid
      reminderScheduledAt: null // Clear scheduled time
    };
    const np = payments.map(p => p.id === payment.id ? updatedPayment : p);
    setPayments(np); await dbSet(KEYS.payments, np);
    
    // Also update in Supabase if user is logged in
    if (user?.id) {
      await updatePayment(user.id, updatedPayment).catch(console.error);
    }
    
    toast("✅ Fee marked as paid! Reminders cancelled.", { icon: "✅", onUndo: async () => { setPayments(prev); await dbSet(KEYS.payments, prev); } });
  };

  // Set due date handler
  const handleSetDueDate = async (payment) => {
    const prev = [...payments];
    const np = payments.map(p => p.id === payment.id ? payment : p);
    setPayments(np); await dbSet(KEYS.payments, np);

    // Also update in Supabase if user is logged in
    if (user?.id) {
      await updatePayment(user.id, payment).catch(console.error);
    }

    toast("Due date set!", { icon: "📅", onUndo: async () => { setPayments(prev); await dbSet(KEYS.payments, prev); } });
  };

  // Bulk mark paid handler
  const handleBulkMarkPaid = async (selectedPayments, paidDate) => {
    const prevPayments = [...payments];
    const paidAt = new Date().toISOString();
    const np = payments.map(p =>
      selectedPayments.some(sp => sp.id === p.id)
        ? { 
            ...p, 
            status: "paid", 
            paidOn: paidDate, 
            paidAt,
            reminders: [], // Clear reminders when paid
            reminderScheduledAt: null // Clear scheduled time
          }
        : p
    );

    setPayments(np);
    await dbSet(KEYS.payments, np);

    // Also update in Supabase if user is logged in
    if (user?.id) {
      for (const payment of selectedPayments) {
        const updated = { 
          ...payment, 
          status: "paid", 
          paidOn: paidDate, 
          paidAt,
          reminders: [],
          reminderScheduledAt: null
        };
        await updatePayment(user.id, updated).catch(console.error);
      }
    }

    toast(`✅ ${selectedPayments.length} payment${selectedPayments.length !== 1 ? 's' : ''} marked as paid! Reminders cancelled.`, {
      icon: "✅",
      onUndo: async () => { setPayments(prevPayments); await dbSet(KEYS.payments, prevPayments); }
    });
  };

  // Reminder scheduler handler
  const handleReminderScheduled = async (payment, reminderConfig) => {
    const prevPayments = [...payments];
    const updatedPayment = {
      ...payment,
      reminderScheduledAt: reminderConfig.enabled ? new Date().toISOString() : null,
      reminders: reminderConfig.reminders || []
    };
    const np = payments.map(p => p.id === payment.id ? updatedPayment : p);
    setPayments(np);
    await dbSet(KEYS.payments, np);

    // Also update in Supabase if user is logged in
    if (user?.id) {
      await updatePayment(user.id, updatedPayment).catch(console.error);
    }

    toast(reminderConfig.enabled ? "Reminders scheduled!" : "Reminders disabled!", {
      icon: reminderConfig.enabled ? "🔔" : "🔕",
      onUndo: async () => { setPayments(prevPayments); await dbSet(KEYS.payments, prevPayments); }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const unpaidCount = payments.filter(p => p.month === curMonth && p.status === "unpaid").length;

  const NAV = [
    ["dashboard", "Dashboard", <I.Dashboard />, 0],
    ...(features.showPayments ? [["fees", "Fee Tracking", <I.Fees />, unpaidCount]] : []),
    ...(features.showStudents ? [["batches", "Batches & Students", <I.Batches />, 0]] : []),
    ...(features.showReports ? [["reports", "Reports", <I.Reports />, 0]] : []),
    ["settings", "Settings", <I.Settings />, 0],
  ];

  const PAGE_TITLES = { dashboard: "Dashboard", fees: "Fee Tracking", batches: "Batches & Students", reports: "Reports & Analytics", settings: "Settings" };
  const safeProfileName = String(profile?.name || SEED_PROFILE.name || "FeeSync").trim() || "FeeSync";

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "var(--font-display)", color: "var(--accent)", background: "var(--bg)", flexDirection: "column", gap: 16 }}>
      <style>{CSS}</style>
      <div style={{ fontSize: 40 }}>🪔</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>FeeSync</div>
      <div style={{ fontSize: 13, color: "var(--text4)" }}>Loading your dashboard...</div>
    </div>
  );

  const commonProps = { batches, students, payments, selectedMonth, setSelectedMonth, toast, openModal, profile };

  return (
    <>
      <style>{CSS}</style>

      {/* Modals */}
      {modal?.type === "wa" && <WaModal student={modal.data.student} batch={modal.data.batch} month={selectedMonth} whatsappConfig={whatsappConfig} onSaveWhatsAppConfig={setWhatsappConfig} onClose={closeModal} />}
      {modal?.type === "receipt" && <ReceiptModal {...modal.data} profile={profile} toast={toast} onClose={closeModal} />}
      {modal?.type === "addStudent" && <StudentModal batches={batches} defaultBatchId={modal.data?.batchId} onSave={saveStudent} onClose={closeModal} />}
      {modal?.type === "editStudent" && <StudentModal student={modal.data} batches={batches} onSave={saveStudent} onClose={closeModal} />}
      {modal?.type === "addBatch" && <BatchModal onSave={saveBatch} onClose={closeModal} />}
      {modal?.type === "editBatch" && <BatchModal batch={modal.data} onSave={saveBatch} onClose={closeModal} />}
      {modal?.type === "confirm" && <ConfirmModal {...modal.data} onClose={closeModal} />}
      {modal?.type === "generateFees" && <GenerateFeesModal user={user} batches={batches} students={students} payments={payments} setPayments={setPayments} selectedMonth={selectedMonth} toast={toast} onClose={closeModal} />}
      {modal?.type === "bulkReminder" && <BulkReminderModal unpaid={modal.data} students={students} batches={batches} selectedMonth={selectedMonth} whatsappConfig={whatsappConfig} onClose={closeModal} />}
      {modal?.type === "markPaid" && <MarkPaidModal {...modal.data} onSave={(opts) => handleMarkPaid(modal.data.payment || { id: uid(), studentId: modal.data.student.id, month: selectedMonth, status: "unpaid" }, opts)} onClose={closeModal} />}
      {modal?.type === "waive" && <WaiveModal student={modal.data.student} batch={modal.data.batch} onSave={async (reason) => {
        const p = modal.data.payment || payments.find(pm => pm.studentId === modal.data.student.id && pm.month === selectedMonth);
        if (p) { const np = payments.map(pm => pm.id === p.id ? { ...pm, status: "waived", notes: reason, paidAt: pm.paidAt || new Date().toISOString(), reminders: [], reminderScheduledAt: null } : pm); setPayments(np); await dbSet(KEYS.payments, np); toast("✅ Fee waived! Reminders cancelled.", { icon: "🔵" }); }
      }} onClose={closeModal} />}
      {modal?.type === "setDueDate" && <SetPaymentDueDateModal payment={modal.data.payment} onSave={handleSetDueDate} onClose={closeModal} />}
      {modal?.type === "bulkMarkPaid" && <BulkMarkPaidModal payments={modal.data.payments || []} students={students} batches={batches} selectedMonth={selectedMonth} onSave={handleBulkMarkPaid} onClose={closeModal} />}
      {modal?.type === "reminderScheduler" && <ReminderSchedulerModal payment={modal.data.payment} student={modal.data.student} batch={modal.data.batch} onSave={handleReminderScheduled} onClose={closeModal} />}

      <ToastStack toasts={toasts} dismiss={dismiss} />

      <div className="app">
        {/* Sidebar Overlay for Mobile */}
        <div className={`sidebar-overlay ${sidebarOpen ? "mobile-open" : ""}`} onClick={() => setSidebarOpen(false)} />

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
          <div className="sidebar-logo">
            <img src="/feesync-logo.png" alt="FeeSync" height="36" />
          </div>
          <nav className="nav">
            {NAV.map(([id, label, icon, badge]) => (
              <button
                key={id}
                className={`nav-btn ${tab === id ? "active" : ""}`}
                onClick={() => {
                  setTab(id);
                  setSidebarOpen(false);
                }}
              >
                {icon} <span>{label}</span>
                {badge > 0 && <span className="nav-badge">{badge}</span>}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="profile-card" style={{ marginBottom: 8 }}>
              <div className="avatar">{safeProfileName[0]?.toUpperCase()}</div>
              <div>
                <div className="profile-name">{safeProfileName.split(" ").slice(0, 2).join(" ")}</div>
                <div className="profile-plan">PRO{authProfile?.phone ? ` • ${authProfile.phone}` : ""}</div>
              </div>
            </div>
            </div>
        </aside>

        {/* Main */}
        <div className="main">
          <div className="topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button className={`hamburger-btn ${sidebarOpen ? "is-active" : ""}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
                <span></span>
                <span></span>
                <span></span>
              </button>
              <div>
                <div className="topbar-title">{PAGE_TITLES[tab]}</div>
              </div>
            </div>
            <div className="topbar-right">
              <button className="theme-btn" onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>
                {theme === "light" ? <I.Moon /> : <I.Sun />}
              </button>
              {tab === "batches" && features.showStudents && (
                <>
                  {!selectedBatch && (
                    <button className="btn btn-secondary btn-sm" onClick={() => openModal("addStudent", { batchId: selectedBatch?.id })}><I.Plus /> Student</button>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={() => openModal("addBatch")}><I.Plus /> Batch</button>
                </>
              )}
            </div>
          </div>

          <div className="content">
            {tab === "dashboard" && <DashboardTab {...commonProps} />}
            {tab === "fees" && <FeesTab {...commonProps} setPayments={setPayments} deleteStudent={deleteStudent} />}
            {tab === "batches" && <BatchesTab user={user} batches={batches} setBatches={setBatches} students={students} setStudents={setStudents} payments={payments} setPayments={setPayments} toast={toast} openModal={openModal} selectedBatch={selectedBatch} setSelectedBatch={setSelectedBatch} profile={profile} />}
            {tab === "reports" && <ReportsTab batches={batches} students={students} payments={payments} />}
            {tab === "settings" && <FeeSyncSettings embedded={true} profile={profile} setProfile={setProfile} features={features} setFeatures={setFeatures} theme={theme} setTheme={setTheme} uiSettings={uiSettings} setUiSettings={setUiSettings} batches={batches} students={students} payments={payments} toast={toast} user={user} onSignOut={handleSignOut} />}
          </div>

          {/* Bottom Navigation for Mobile */}
          <nav className="bottom-nav">
            {NAV.map(([id, label, icon, badge]) => (
              <button
                key={id}
                className={`bottom-nav-item ${tab === id ? "active" : ""}`}
                onClick={() => setTab(id)}
              >
                {icon}
                <span>{label.split(" ")[0]}</span>
                {badge > 0 && <span style={{ position: "absolute", top: 4, right: 4, background: "var(--red)", color: "white", fontSize: 8, fontWeight: 700, padding: "1px 3px", borderRadius: "100px", minWidth: 14, textAlign: "center" }}>{badge}</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
