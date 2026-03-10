import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import Toggle from "../components/ui/Toggle";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Authentication from "../components/settings/Authentication";
import BusinessProfile from "../components/settings/BusinessProfile";
import FeatureSettings from "../components/settings/FeatureSettings";
import Appearance from "../components/settings/Appearance";
import DataManagement from "../components/settings/DataManagement";
import About from "../components/settings/About";

export default function Settings({ user }) {
  const { state, dispatch } = useApp();
  const { dark, setDark } = useTheme();
  const [showThemeInfo, setShowThemeInfo] = useState(false);

  return (
    <div className="grid-2">
      <BusinessProfile state={state} dispatch={dispatch} />
      <FeatureSettings state={state} dispatch={dispatch} />
      <Appearance state={state} dispatch={dispatch} />
      <div className="card">
        <div className="card-header"><div className="card-title">Quick Appearance</div></div>
        <div className="settings-item">
          <div className="settings-item-label">Dark Theme</div>
          <Toggle on={dark} onToggle={() => setDark(!dark)} />
        </div>
        <Button size="sm" onClick={() => setShowThemeInfo(true)}>Theme info</Button>
      </div>
      <Authentication user={user} />
      <DataManagement state={state} dispatch={dispatch} />
      <About state={state} dispatch={dispatch} />

      <Modal isOpen={showThemeInfo} onClose={() => setShowThemeInfo(false)} title="Theme">
        <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 10 }}>
          Current theme: <b>{dark ? "Dark" : "Light"}</b>
        </p>
        <Button size="sm" onClick={() => setShowThemeInfo(false)}>Close</Button>
      </Modal>
    </div>
  );
}
