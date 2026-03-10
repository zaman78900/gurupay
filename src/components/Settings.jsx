import { useState, useRef } from "react";

const Icon = ({ d, color = "currentColor", size = 18, stroke = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  business:  "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  features:  "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  appearance:"M12 2a10 10 0 100 20A10 10 0 0012 2z M12 8v4l3 3",
  auth:      "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  data:      "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  about:     "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8h.01 M11 12h1v4h1",
  chevron:   "M9 18l6-6-6-6",
  moon:      "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  sun:       "M12 2v2 M12 20v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M2 12h2 M20 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42 M12 6a6 6 0 100 12A6 6 0 0012 6z",
  dashboard: "M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v6H3z",
  fee:       "M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  batches:   "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100 8 4 4 0 000-8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  reports:   "M18 20V10 M12 20V4 M6 20v-6",
  settings:  "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
};

const SECTIONS = [
  { id:"business",   label:"Business Profile",   sub:"Name, address, GSTIN",         color:"#10a34a", bg:"rgba(16,163,74,0.15)"   },
  { id:"features",   label:"Feature Settings",   sub:"Controls and modules",          color:"#3B9EFF", bg:"rgba(59,158,255,0.15)"  },
  { id:"appearance", label:"Appearance",          sub:"Theme and visual behaviour",    color:"#2DD4BF", bg:"rgba(45,212,191,0.15)"  },
  { id:"auth",       label:"Authentication",      sub:"Security and access controls",  color:"#7C6FFF", bg:"rgba(124,111,255,0.15)" },
  { id:"data",       label:"Data Management",     sub:"Backups and exports",           color:"#FF8C42", bg:"rgba(255,140,66,0.15)"  },
  { id:"about",      label:"About",               sub:"Version and legal information", color:"#8B8FA8", bg:"rgba(139,143,168,0.15)" },
];

const NAV = [
  { id:"dashboard", label:"Dashboard" },
  { id:"fee",       label:"Fee", badge:3 },
  { id:"batches",   label:"Batches" },
  { id:"reports",   label:"Reports" },
  { id:"settings",  label:"Settings" },
];

// Theme colour map
const THEME_COLORS = {
  "Default Green":  "#10a34a",
  "Ocean Blue":     "#3B9EFF",
  "Royal Purple":   "#7C6FFF",
  "Sunset Orange":  "#FF8C42",
};

// Font size map
const FONT_SIZE_MAP = { Small: 12, Medium: 14, Large: 16 };

// ── Toggle ───────────────────────────────────────────────────────────
function Toggle({ on, onToggle, accentColor = "#10a34a" }) {
  return (
    <div onClick={onToggle} style={{ width:46,height:26,borderRadius:999,cursor:"pointer",flexShrink:0,
      background:on?accentColor:"rgba(150,150,170,0.3)", position:"relative", transition:"background 0.25s" }}>
      <div style={{ position:"absolute",top:3,left:on?22:3,width:20,height:20,borderRadius:"50%",background:"#fff",
        boxShadow:"0 1px 6px rgba(0,0,0,0.35)", transition:"left 0.25s cubic-bezier(0.34,1.56,0.64,1)" }} />
    </div>
  );
}

// ── Panels ───────────────────────────────────────────────────────────
function FeaturesPanel({ D, accentColor }) {
  const [features, setFeatures] = useState({
    "Late Fee Tracking":    true,
    "WhatsApp Reminders":   true,
    "CSV Export":           false,
    "Attendance Tracking":  true,   // ← replaced Revenue Analytics
    "Bulk Operations":      false,
    "Dark Mode Default":    false,
  });
  return (
    <div>
      {Object.entries(features).map(([k,v],i,a)=>(
        <div key={k} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"13px 0", borderBottom:i<a.length-1?`1px solid ${D.border}`:"none" }}>
          <p style={{ fontSize:14,fontWeight:500,color:D.textPri }}>{k}</p>
          <Toggle on={v} accentColor={accentColor} onToggle={()=>setFeatures(p=>({...p,[k]:!p[k]}))} />
        </div>
      ))}
    </div>
  );
}

function AppearancePanel({ dark, setDark, D, theme, setTheme, fontSize, setFontSize, accentColor }) {
  const themes = ["Default Green","Ocean Blue","Royal Purple","Sunset Orange"];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
      {/* Color Theme */}
      <div>
        <p style={{ fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:D.textMuted,marginBottom:10 }}>Color Theme</p>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
          {themes.map(t=>(
            <div key={t} onClick={()=>setTheme(t)} style={{ padding:"10px 12px",borderRadius:12,cursor:"pointer",
              border:`1.5px solid ${theme===t?accentColor:D.border}`,
              background:theme===t?`${THEME_COLORS[t]}14`:D.elevated,
              display:"flex",alignItems:"center",gap:8,transition:"all 0.2s" }}>
              <div style={{ width:13,height:13,borderRadius:"50%",background:THEME_COLORS[t],flexShrink:0,
                boxShadow:theme===t?`0 0 0 3px ${THEME_COLORS[t]}44`:"none",transition:"box-shadow 0.2s" }}/>
              <span style={{ fontSize:12,fontWeight:theme===t?700:500,color:theme===t?THEME_COLORS[t]:D.textPri }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Font Size */}
      <div>
        <p style={{ fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:D.textMuted,marginBottom:10 }}>Font Size</p>
        <div style={{ display:"flex",gap:8 }}>
          {["Small","Medium","Large"].map(s=>(
            <div key={s} onClick={()=>setFontSize(s)} style={{ flex:1,padding:"9px 0",textAlign:"center",borderRadius:10,cursor:"pointer",
              border:`1.5px solid ${fontSize===s?accentColor:D.border}`,
              background:fontSize===s?`${accentColor}14`:D.elevated,
              fontSize:FONT_SIZE_MAP[s],fontWeight:fontSize===s?700:500,
              color:fontSize===s?accentColor:D.textPri,transition:"all 0.2s" }}>{s}</div>
          ))}
        </div>
        {/* Live preview */}
        <div style={{ marginTop:10,padding:"10px 13px",borderRadius:10,
          background:D.elevated,border:`1px solid ${D.border}` }}>
          <p style={{ fontSize:FONT_SIZE_MAP[fontSize],color:D.textSec,fontWeight:500 }}>
            Preview — Student fee of <span style={{ color:accentColor,fontWeight:700 }}>₹4,500</span> is due.
          </p>
        </div>
      </div>
      {/* Dark Mode */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <p style={{ fontSize:14,fontWeight:500,color:D.textPri }}>Dark Mode</p>
          <p style={{ fontSize:11,color:D.textSec,marginTop:2 }}>Switch display theme</p>
        </div>
        <Toggle on={dark} accentColor={accentColor} onToggle={()=>setDark(v=>!v)} />
      </div>
    </div>
  );
}

function AuthPanel({ D, accentColor }) {
  const [pin, setPin]       = useState(["","","","",""]);
  const [savedPin, setSavedPin] = useState(["","","","",""]);
  const [pinStatus, setPinStatus] = useState(""); // "saved" | "reset" | ""
  const [bio, setBio]       = useState(true);
  const [lock, setLock]     = useState("5 min");
  const pinRefs = useRef([]);

  const handleSavePin = () => {
    if (pin.every(v => v !== "")) {
      setSavedPin([...pin]);
      setPinStatus("saved");
      setTimeout(() => setPinStatus(""), 2500);
    }
  };

  const handleResetPin = () => {
    setPin(["","","","",""]);
    setSavedPin(["","","","",""]);
    setPinStatus("reset");
    setTimeout(() => setPinStatus(""), 2500);
    pinRefs.current[0]?.focus();
  };

  const pinFilled = pin.every(v => v !== "");

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
      {/* PIN Section */}
      <div>
        <p style={{ fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:D.textMuted,marginBottom:10 }}>App PIN</p>
        <div style={{ display:"flex",gap:8,marginBottom:12 }}>
          {pin.map((v,i)=>(
            <input key={i} type="password" inputMode="numeric" maxLength={1} value={v}
              ref={el => pinRefs.current[i] = el}
              onChange={e=>{
                const val = e.target.value.slice(-1);
                const p=[...pin];
                p[i]=val;
                setPin(p);
                if (val && i < 4) {
                  pinRefs.current[i+1]?.focus();
                }
              }}
              onKeyDown={e=>{
                if (e.key==="Backspace" && !pin[i] && i > 0) {
                  pinRefs.current[i-1]?.focus();
                }
              }}
              style={{ width:48,height:52,textAlign:"center",fontSize:20,
                background:D.elevated,
                border:`1.5px solid ${v?accentColor:D.border}`,
                borderRadius:12,color:D.textPri,outline:"none",fontFamily:"inherit",
                transition:"border-color 0.2s",
                boxShadow:v?`0 0 0 3px ${accentColor}22`:"none" }}/>
          ))}
        </div>

        {/* Status message */}
        {pinStatus && (
          <div style={{ marginBottom:10,padding:"9px 13px",borderRadius:10,
            background:pinStatus==="saved"?"rgba(16,163,74,0.12)":"rgba(255,140,66,0.12)",
            border:`1px solid ${pinStatus==="saved"?"rgba(16,163,74,0.3)":"rgba(255,140,66,0.3)"}` }}>
            <p style={{ fontSize:13,fontWeight:600,color:pinStatus==="saved"?accentColor:"#FF8C42" }}>
              {pinStatus==="saved" ? "✓ PIN saved successfully!" : "↺ PIN has been reset."}
            </p>
          </div>
        )}

        {/* Save / Reset buttons */}
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={handleSavePin} disabled={!pinFilled}
            style={{ flex:1,height:40,borderRadius:10,border:"none",cursor:pinFilled?"pointer":"not-allowed",
              background:pinFilled?`linear-gradient(135deg,${accentColor},${accentColor}cc)`:"rgba(150,150,170,0.2)",
              color:pinFilled?"#fff":D.textMuted,fontSize:13,fontWeight:700,fontFamily:"inherit",
              opacity:pinFilled?1:0.6,transition:"all 0.2s",
              boxShadow:pinFilled?`0 4px 14px ${accentColor}44`:"none" }}>
            Save PIN
          </button>
          <button onClick={handleResetPin}
            style={{ flex:1,height:40,borderRadius:10,cursor:"pointer",
              border:`1.5px solid ${D.border}`,background:D.elevated,
              color:D.textSec,fontSize:13,fontWeight:700,fontFamily:"inherit",transition:"all 0.2s" }}>
            Reset PIN
          </button>
        </div>
      </div>

      {/* Biometric / 2FA */}
      {[["Biometric Login","Use fingerprint",bio,()=>setBio(v=>!v)],
        ["Two-Factor Auth","SMS verification",false,()=>{}]
      ].map(([l,s,on,fn])=>(
        <div key={l} style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <p style={{ fontSize:14,fontWeight:500,color:D.textPri }}>{l}</p>
            <p style={{ fontSize:11,color:D.textSec,marginTop:2 }}>{s}</p>
          </div>
          <Toggle on={on} accentColor={accentColor} onToggle={fn} />
        </div>
      ))}

      {/* Auto-Lock */}
      <div>
        <p style={{ fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:D.textMuted,marginBottom:10 }}>Auto-Lock</p>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          {["1 min","5 min","15 min","Never"].map(o=>(
            <div key={o} onClick={()=>setLock(o)} style={{ padding:"8px 14px",borderRadius:20,cursor:"pointer",
              border:`1.5px solid ${lock===o?accentColor:D.border}`,
              background:lock===o?`${accentColor}1a`:D.elevated,
              fontSize:12,fontWeight:500,color:lock===o?accentColor:D.textPri,transition:"all 0.2s" }}>{o}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataPanel({ D, accentColor }) {
  const [msg,setMsg]=useState("");
  const btns=[
    {label:"Export CSV",  sub:"Download all student data",  color:"#3B9EFF"},
    {label:"Backup Data", sub:"Save to cloud storage",      color:accentColor},
    {label:"Import Data", sub:"Restore from backup file",   color:"#FF8C42"},
    {label:"Clear Cache", sub:"Free up app storage",        color:"#7C6FFF"},
  ];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
      <div style={{ padding:"10px 14px",borderRadius:10,background:`${accentColor}1a`,border:`1px solid ${accentColor}33` }}>
        <p style={{ fontSize:12,color:accentColor,fontWeight:600 }}>Last backup: Today, 9:00 AM</p>
      </div>
      {btns.map(b=>(
        <div key={b.label} onClick={()=>{setMsg(`${b.label} started...`);setTimeout(()=>setMsg(""),2500);}}
          style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:12,cursor:"pointer",background:D.elevated,border:`1px solid ${D.border}` }}>
          <div style={{ width:36,height:36,borderRadius:9,flexShrink:0,background:`${b.color}22`,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div style={{ width:10,height:10,borderRadius:3,background:b.color }}/>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14,fontWeight:600,color:D.textPri }}>{b.label}</p>
            <p style={{ fontSize:11,color:D.textSec,marginTop:2 }}>{b.sub}</p>
          </div>
          <Icon d={ICONS.chevron} color={D.textMuted} size={14}/>
        </div>
      ))}
      {msg&&<div style={{ textAlign:"center",padding:10,borderRadius:10,background:`${accentColor}1a`,color:accentColor,fontSize:13,fontWeight:600 }}>{msg}</div>}
    </div>
  );
}

function AboutPanel({ D }) {
  // ← "Developer" row removed
  const rows=[
    ["App Version","2.4.1 (Build 241)"],
    ["Support","support@gurupay.in"],
    ["Privacy Policy","gurupay.in/privacy"],
    ["Terms","gurupay.in/terms"],
  ];
  return (
    <div>
      {rows.map(([k,v],i)=>(
        <div key={k} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"12px 0",borderBottom:i<rows.length-1?`1px solid ${D.border}`:"none" }}>
          <p style={{ fontSize:13,color:D.textSec,fontWeight:500 }}>{k}</p>
          <p style={{ fontSize:13,color:D.textPri,fontWeight:600,textAlign:"right" }}>{v}</p>
        </div>
      ))}
      <div style={{ marginTop:16,padding:14,borderRadius:12,textAlign:"center",background:"rgba(255,94,94,0.08)",border:"1px solid rgba(255,94,94,0.2)",cursor:"pointer" }}>
        <p style={{ fontSize:14,fontWeight:700,color:"#FF5E5E" }}>Sign Out</p>
      </div>
    </div>
  );
}

function BusinessPanel({ D, accentColor }) {
  const [edit,setEdit]=useState(false);
  const [saved,setSaved]=useState(false);
  const [p,setP]=useState({ businessName:"Sri Balaji Coaching Academy",gstin:"29ABCDE1234F1Z5",
    address:"12, MG Road, Bengaluru – 560001",phone:"9876543210",email:"balaji@coaching.in",upiId:"balaji@okaxis" });
  const save=()=>{setSaved(true);setEdit(false);setTimeout(()=>setSaved(false),2500);};
  const inp=(mono=false)=>({ width:"100%",padding:"11px 13px",
    background:edit?(D.isDark?"#252847":"#fff"):D.elevated,
    border:`1.5px solid ${edit?accentColor:D.border}`,
    borderRadius:11,fontSize:13,outline:"none",
    fontFamily:mono?"'JetBrains Mono','Courier New',monospace":"inherit",
    color:D.textPri,cursor:edit?"text":"default",
    transition:"border 0.2s, background 0.2s",boxSizing:"border-box" });
  const Lbl=({t,req})=>(
    <label style={{ display:"block",fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:D.textMuted,marginBottom:6 }}>
      {t}{req&&<span style={{ color:"#ef4444",marginLeft:3 }}>*</span>}
    </label>
  );
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <div>
          <p style={{ fontSize:15,fontWeight:700,color:D.textPri }}>Business Profile</p>
          <p style={{ fontSize:11,color:D.textSec,marginTop:2 }}>Coaching center details</p>
        </div>
        <button onClick={()=>edit?save():setEdit(true)} style={{ padding:"8px 15px",borderRadius:10,
          border:`1px solid ${edit?"transparent":D.border}`,cursor:"pointer",
          background:edit?`linear-gradient(135deg,${accentColor},${accentColor}cc)`:D.elevated,
          color:edit?"#fff":D.textSec,fontSize:13,fontWeight:700,
          boxShadow:edit?`0 4px 16px ${accentColor}55`:"none",
          display:"flex",alignItems:"center",gap:6,transition:"all 0.2s",fontFamily:"inherit" }}>
          {edit
            ?<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Save</>
            :<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit</>
          }
        </button>
      </div>
      {saved&&<div style={{ padding:"9px 13px",borderRadius:10,marginBottom:14,background:`${accentColor}1e`,border:`1px solid ${accentColor}4d` }}>
        <p style={{ fontSize:13,fontWeight:600,color:accentColor }}>✓ Profile saved successfully!</p>
      </div>}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
        <div><Lbl t="Business Name" req/><input style={inp()} value={p.businessName} disabled={!edit} onChange={e=>setP({...p,businessName:e.target.value})}/></div>
        <div><Lbl t="GSTIN"/><input style={inp(true)} value={p.gstin} disabled={!edit} onChange={e=>setP({...p,gstin:e.target.value})}/></div>
      </div>
      <div style={{ marginBottom:10 }}>
        <Lbl t="Address"/>
        <textarea style={{...inp(),resize:"none",lineHeight:1.6,height:66}} value={p.address} disabled={!edit} onChange={e=>setP({...p,address:e.target.value})}/>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
        <div><Lbl t="Phone"/><input style={inp()} value={p.phone} disabled={!edit} onChange={e=>setP({...p,phone:e.target.value})}/></div>
        <div><Lbl t="Email"/><input style={inp()} value={p.email} disabled={!edit} onChange={e=>setP({...p,email:e.target.value})}/></div>
      </div>
      <div style={{ marginBottom:edit?14:0 }}>
        <Lbl t="UPI ID"/>
        <input style={inp(true)} value={p.upiId} disabled={!edit} onChange={e=>setP({...p,upiId:e.target.value})}/>
      </div>
      {edit&&<button onClick={save} style={{ width:"100%",height:50,borderRadius:12,border:"none",
        background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,color:"#fff",fontSize:15,fontWeight:700,
        cursor:"pointer",boxShadow:`0 6px 24px ${accentColor}55`,fontFamily:"inherit" }}>Save Changes</button>}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────
export default function GuruPaySettings() {
  const [dark, setDark]       = useState(true);
  const [sec, setSec]         = useState("business");
  const [nav, setNav]         = useState("settings");

  // ── Appearance state lifted here so it applies globally ──
  const [theme, setTheme]     = useState("Default Green");
  const [fontSize, setFontSize] = useState("Medium");
  const accentColor = THEME_COLORS[theme];
  const baseFontSize = FONT_SIZE_MAP[fontSize];

  const D = {
    isDark:   dark,
    base:     dark?"#0E0F17":"#F0F2F8",
    surface:  dark?"#16182A":"#FFFFFF",
    elevated: dark?"#1E2038":"#F4F5FA",
    border:   dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)",
    textPri:  dark?"#F0F1FA":"#111827",
    textSec:  dark?"#8B8FA8":"#6b7280",
    textMuted:dark?"#4B4F6B":"#9ca3af",
  };

  const PANELS = {
    business:  <BusinessPanel D={D} accentColor={accentColor}/>,
    features:  <FeaturesPanel D={D} accentColor={accentColor}/>,
    appearance:<AppearancePanel dark={dark} setDark={setDark} D={D}
                  theme={theme} setTheme={setTheme}
                  fontSize={fontSize} setFontSize={setFontSize}
                  accentColor={accentColor}/>,
    auth:      <AuthPanel D={D} accentColor={accentColor}/>,
    data:      <DataPanel D={D} accentColor={accentColor}/>,
    about:     <AboutPanel D={D}/>,
  };

  const activeSec = SECTIONS.find(s=>s.id===sec);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${D.base};height:100%;font-size:${baseFontSize}px;}
        ::-webkit-scrollbar{width:0;}
        input,textarea,button{font-family:'Plus Jakarta Sans',sans-serif;}
        .sec-row{cursor:pointer;transition:background 0.15s;}
        .sec-row:active{opacity:0.8;}
        .nav-btn{transition:transform 0.1s;}
        .nav-btn:active{transform:scale(0.88);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes mesh{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
        .a1{animation:fadeUp 0.35s 0.00s ease both;}
        .a2{animation:fadeUp 0.35s 0.07s ease both;}
        .a3{animation:fadeUp 0.35s 0.14s ease both;}
      `}</style>

      {/* Root: full height flex column */}
      <div style={{ display:"flex",flexDirection:"column",height:"100vh",
        background:D.base,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:baseFontSize,
        maxWidth:480,margin:"0 auto",position:"relative",
        boxShadow:"0 0 60px rgba(0,0,0,0.5)" }}>

        {/* ── HEADER ── single bar, no duplicate */}
        <div style={{ flexShrink:0,zIndex:50,
          background:dark?"rgba(14,15,23,0.95)":"rgba(240,242,248,0.95)",
          backdropFilter:"blur(20px)",
          borderBottom:`1px solid ${D.border}` }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div>
                {/* ← Fixed: use color instead of gradient text-fill so it always renders */}
                <h1 style={{ fontFamily:"'Outfit',sans-serif",fontSize:22,fontWeight:900,
                  letterSpacing:"-0.8px",lineHeight:1.1,
                  color:dark?"#FFFFFF":D.textPri }}>
                  Settings
                </h1>
                <p style={{ fontSize:10,color:D.textMuted,fontWeight:500,letterSpacing:0.4 }}>GuruPay Pro</p>
              </div>
            </div>
            <button onClick={()=>setDark(v=>!v)} style={{ width:38,height:38,borderRadius:999,
              border:`1px solid ${D.border}`,background:D.elevated,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:dark?"0 2px 10px rgba(0,0,0,0.4)":"0 2px 8px rgba(0,0,0,0.08)" }}>
              <Icon d={dark?ICONS.sun:ICONS.moon} color={D.textSec} size={16}/>
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div style={{ flex:1,overflowY:"auto",padding:"14px 14px 0" }}>

          {/* Account hero */}
          <div className="a1" style={{ marginBottom:14,
            backgroundImage:dark
              ?"linear-gradient(135deg,rgba(16,163,74,0.18),rgba(124,111,255,0.10))"
              :"linear-gradient(135deg,rgba(16,163,74,0.10),rgba(59,158,255,0.07))",
            backgroundSize:"200% 200%",
            animation:"mesh 8s ease infinite, fadeUp 0.35s ease both",
            border:`1px solid ${dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)"}`,
            borderRadius:18,padding:16,
            boxShadow:dark?"0 6px 30px rgba(0,0,0,0.4)":"0 4px 18px rgba(0,0,0,0.07)",
            position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",top:-20,right:-20,width:90,height:90,
              borderRadius:"50%",background:`${accentColor}12`,pointerEvents:"none" }}/>
            <div style={{ display:"flex",alignItems:"center",gap:12 }}>
              <div style={{ width:44,height:44,borderRadius:13,flexShrink:0,
                background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:`0 4px 14px ${accentColor}70` }}>
                <span style={{ fontFamily:"'Outfit',sans-serif",fontSize:20,fontWeight:900,color:"#fff" }}>B</span>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13,fontWeight:600,color:D.textPri }}>baraktea01@gmail.com</p>
                <p style={{ fontSize:11,color:D.textSec,marginTop:2 }}>Signed in</p>
              </div>
              <div style={{ background:`${accentColor}33`,border:`1px solid ${accentColor}66`,borderRadius:999,padding:"4px 10px" }}>
                <span style={{ fontSize:11,fontWeight:800,color:accentColor,letterSpacing:0.5 }}>PRO ✦</span>
              </div>
            </div>
            {/* ← Revenue replaced with Active Students */}
            <div style={{ display:"flex",gap:6,marginTop:12,paddingTop:12,
              borderTop:`1px solid ${dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)"}` }}>
              {[["12","Batches"],["340","Students"],["94%","Active"]].map(([val,lab])=>(
                <div key={lab} style={{ flex:1,textAlign:"center",
                  background:dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)",
                  borderRadius:10,padding:"8px 4px",border:`1px solid ${D.border}` }}>
                  <p style={{ fontSize:15,fontWeight:800,color:D.textPri,fontFamily:"'Outfit',sans-serif" }}>{val}</p>
                  <p style={{ fontSize:10,color:D.textSec,marginTop:2,fontWeight:500 }}>{lab}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section nav */}
          <div className="a2" style={{ marginBottom:14 }}>
            <p style={{ fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",
              color:D.textMuted,marginBottom:8,paddingLeft:2 }}>Preferences</p>
            <div style={{ background:D.surface,borderRadius:18,border:`1px solid ${D.border}`,
              overflow:"hidden",boxShadow:dark?"0 4px 20px rgba(0,0,0,0.3)":"0 2px 14px rgba(0,0,0,0.06)" }}>
              {SECTIONS.map((s,i)=>{
                const active=sec===s.id;
                return (
                  <div key={s.id} className="sec-row" onClick={()=>setSec(s.id)} style={{
                    display:"flex",alignItems:"center",gap:12,padding:"11px 13px",
                    background:active?(dark?"rgba(255,255,255,0.025)":"rgba(16,163,74,0.04)"):"transparent",
                    borderLeft:`3px solid ${active?s.color:"transparent"}`,
                    borderBottom:i<SECTIONS.length-1?`1px solid ${D.border}`:"none" }}>
                    <div style={{ width:34,height:34,borderRadius:9,flexShrink:0,background:s.bg,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      boxShadow:active?`0 3px 10px ${s.color}44`:"none",transition:"box-shadow 0.2s" }}>
                      <Icon d={ICONS[s.id]} color={s.color} size={15} stroke={1.8}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13,fontWeight:active?700:500,
                        color:active?s.color:D.textPri,transition:"color 0.15s" }}>{s.label}</p>
                      <p style={{ fontSize:11,color:D.textSec,marginTop:1 }}>{s.sub}</p>
                    </div>
                    <Icon d={ICONS.chevron} color={active?s.color:D.textMuted} size={13}/>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active panel */}
          <div className="a3" key={sec} style={{ marginBottom:16 }}>
            <div style={{ background:D.surface,borderRadius:18,border:`1px solid ${D.border}`,
              padding:"16px 14px",
              boxShadow:dark?"0 4px 20px rgba(0,0,0,0.3)":"0 2px 14px rgba(0,0,0,0.06)" }}>
              {/* Panel header */}
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16,
                paddingBottom:13,borderBottom:`1px solid ${D.border}` }}>
                <div style={{ width:32,height:32,borderRadius:8,background:activeSec.bg,
                  display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Icon d={ICONS[sec]} color={activeSec.color} size={14}/>
                </div>
                <div>
                  <p style={{ fontSize:14,fontWeight:700,color:D.textPri }}>{activeSec.label}</p>
                  <p style={{ fontSize:11,color:D.textSec }}>{activeSec.sub}</p>
                </div>
              </div>
              {PANELS[sec]}
            </div>
          </div>

        </div>{/* end scroll body */}

        {/* ── BOTTOM NAV ── */}
        <div style={{ flexShrink:0,
          background:dark?"rgba(14,15,23,0.97)":"rgba(255,255,255,0.97)",
          backdropFilter:"blur(20px)",
          borderTop:`1px solid ${D.border}`,
          padding:"8px 8px 10px",
          display:"flex",justifyContent:"space-around",alignItems:"center",
          boxShadow:dark?"0 -6px 30px rgba(0,0,0,0.5)":"0 -4px 20px rgba(0,0,0,0.08)" }}>
          {NAV.map(item=>{
            const active=nav===item.id;
            return (
              <button key={item.id} className="nav-btn" onClick={()=>setNav(item.id)}
                style={{ background:"none",border:"none",cursor:"pointer",outline:"none",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                  padding:"4px 10px",borderRadius:12,position:"relative" }}>
                {item.badge&&(
                  <div style={{ position:"absolute",top:0,right:4,background:"#FF5E5E",
                    borderRadius:999,width:15,height:15,display:"flex",alignItems:"center",
                    justifyContent:"center",fontSize:8,color:"#fff",fontWeight:800,
                    border:`2px solid ${dark?"#0E0F17":"#fff"}`,zIndex:1 }}>{item.badge}</div>
                )}
                <div style={{ width:active?40:26,height:24,borderRadius:999,
                  background:active?`${accentColor}2e`:"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
                  <Icon d={ICONS[item.id]} color={active?accentColor:D.textMuted}
                    size={active?17:16} stroke={active?2.2:1.7}/>
                </div>
                <span style={{ fontSize:9,fontWeight:active?700:500,
                  color:active?accentColor:D.textMuted,transition:"color 0.2s" }}>{item.label}</span>
                {active&&<div style={{ width:4,height:4,borderRadius:"50%",
                  background:accentColor,marginTop:-1 }}/>}
              </button>
            );
          })}
        </div>

      </div>
    </>
  );
}