import Toggle from "../ui/Toggle";

const items = [
  ["enableGST", "Enable GST"],
  ["enableDiscounts", "Enable Discounts"],
  ["enableLateFees", "Enable Late Fees"],
  ["enableWhatsApp", "Enable WhatsApp"],
  ["csvExport", "Enable CSV Export"],
];

export default function FeatureSettings({ state, dispatch }) {
  return (
    <div className="card">
      <div className="card-header"><div className="card-title">⚙️ Feature Settings</div></div>
      {items.map(([key, label]) => (
        <div key={key} className="settings-item">
          <div className="settings-item-label">{label}</div>
          <Toggle
            on={!!state.settings[key]}
            onToggle={() => dispatch({ type: "SET_SETTINGS", payload: { [key]: !state.settings[key] } })}
          />
        </div>
      ))}
    </div>
  );
}