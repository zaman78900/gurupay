import Toggle from "../ui/Toggle";
import { useTheme } from "../../context/ThemeContext";

export default function Appearance() {
  const { dark, setDark } = useTheme();

  return (
    <div className="card">
      <div className="card-header"><div className="card-title">🎨 Appearance</div></div>
      <div className="settings-item">
        <div className="settings-item-label">Dark Mode</div>
        <Toggle on={dark} onToggle={() => setDark(!dark)} />
      </div>
      <div className="settings-item">
        <div className="settings-item-label">Accent Color</div>
        <input type="color" className="input" defaultValue="#1B8A5A" style={{ width: 80, padding: 4 }} />
      </div>
    </div>
  );
}