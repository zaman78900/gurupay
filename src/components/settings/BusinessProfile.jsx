import { useState } from "react";

export default function BusinessProfile({ state, dispatch }) {
  const [form, setForm] = useState(state.businessProfile);

  const save = () => dispatch({ type: "SET_PROFILE", payload: form });

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🏢 Business Profile</div>
      </div>
      <div className="input-row">
        <input className="input" placeholder="Business name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="GSTIN" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
      </div>
      <div className="input-row" style={{ marginTop: 10 }}>
        <input className="input" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <button className="btn btn-primary" onClick={save} style={{ marginTop: 10 }}>Save Profile</button>
    </div>
  );
}