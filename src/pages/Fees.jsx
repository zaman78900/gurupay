import { useState } from "react";
import { useApp } from "../context/AppContext";
import ReceiptButton from "../components/fees/ReceiptButton";
import SetPaymentDueDateModal from "../components/modals/SetPaymentDueDateModal";
import BulkMarkPaidModal from "../components/modals/BulkMarkPaidModal";

const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (k) => {
  if (!k) return "";
  const [y, m] = k.split("-");
  return new Date(+y, +m - 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
};
const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const months6 = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return monthKey(d);
});

const daysUntilDue = (dueDate) => {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
};

const I = {
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Download: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Check: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  WA: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>,
  Waive: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  Receipt: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Undo: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,
};


// ─── Mark Paid Modal Component ────────────────────────────────────
function MarkPaidModalContent({ student, batch, payment, onSave, onClose }) {
  const [lateFee, setLateFee] = useState(payment?.lateFee || 0);
  const [paidOn, setPaidOn] = useState(payment?.paidOn || new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState(payment?.notes || "");
  const base = batch.fee - (student.discount || 0);
  const gst = Math.round(base * batch.gstRate / 100);
  const amount = payment?.amount || (base + gst);
  const total = amount + (+lateFee || 0);

  const handleSave = () => {
    if (!paidOn) {
      alert("Please select a payment date");
      return;
    }
    onSave(payment || { id: Math.random().toString(36).slice(2, 9), studentId: student.id }, {
      paidOn,
      lateFee: +lateFee || 0,
      notes,
      amount,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div className="modal-header" style={{ background: "var(--gradient-success)", borderRadius: "16px 16px 0 0", paddingBottom: 20, color: "white" }}>
          <div style={{flex: 1}}>
            <div className="modal-title" style={{color: "white", fontSize: 18, marginBottom: 4}}>✅ Mark as Paid</div>
            <div className="modal-subtitle" style={{color: "rgba(255,255,255,0.85)"}}>{student.name} · {batch.name}</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{color: "white", fontSize: 24}}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)", borderRadius: "14px", padding: "16px", marginBottom: 20, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Base Fee</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>₹{base.toLocaleString("en-IN")}</div>
              </div>
              {gst > 0 && <div>
                <div style={{ fontSize: 11, color: "var(--text4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>GST ({batch.gstRate}%)</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>₹{gst.toLocaleString("en-IN")}</div>
              </div>}
            </div>
            {lateFee > 0 && <div style={{ padding: "10px 0", borderTop: "1px solid rgba(220,38,38,.15)", marginBottom: 8, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
              <div style={{fontSize: 12, color: "var(--red)", fontWeight: 600}}>⚠️ Late Fee</div>
              <div style={{color: "var(--red)", fontWeight: 700, fontSize: 14}}>₹{(+lateFee).toLocaleString("en-IN")}</div>
            </div>}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid rgba(5,150,105,.25)", paddingTop: 14, marginTop: 8 }}>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>Total Amount</span>
              <span style={{ fontWeight: 800, color: "var(--accent)", fontFamily: "var(--font-display)", fontSize: 18 }}>₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)"}}>📅 Payment Date</label>
            <input type="date" className="input" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} style={{borderRadius: "10px"}} />
          </div>
          
          <div className="input-group">
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)"}}>⚠️ Late Fee (if any)</label>
            <input type="number" className="input" value={lateFee} onChange={(e) => setLateFee(e.target.value)} placeholder="0" min="0" style={{borderRadius: "10px"}} />
          </div>
          
          <div className="input-group">
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)"}}>📝 Notes</label>
            <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Cheque #1234, Online transfer..." style={{borderRadius: "10px"}} />
          </div>
        </div>
        <div className="modal-footer" style={{paddingTop: 16}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} style={{background: "var(--gradient-success)", boxShadow: "0 6px 20px rgba(16, 185, 129, 0.3)"}}>Mark Paid</button>
        </div>
      </div>
    </div>
  );
}

export default function Fees() {
  const { state, dispatch } = useApp();
  const { batches, students, payments, businessProfile: profile, settings } = state;
  const setPayments = (np) => dispatch({ type: "SET_PAYMENTS", payload: np });
  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  const [filterBatch, setFilterBatch] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [modal, setModal] = useState(null);

  const _getStudent = (id) => students.find((s) => s.id === id);
  const getBatch = (id) => batches.find((b) => b.id === id);
  const getPayment = (sId, m) => payments.find((p) => p.studentId === sId && p.month === m);

  const filtered = students.filter((s) => {
    if (filterBatch !== "all" && s.batchId !== filterBatch) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.phone.includes(search)) return false;
    const p = getPayment(s.id, selectedMonth);
    if (filterStatus === "paid" && p?.status !== "paid") return false;
    if (filterStatus === "unpaid" && p?.status !== "unpaid") return false;
    if (filterStatus === "none" && p) return false;
    return true;
  });

  const mPayments = payments.filter((p) => p.month === selectedMonth);
  const paid = mPayments.filter((p) => p.status === "paid");
  const unpaid = mPayments.filter((p) => p.status === "unpaid");
  const collected = paid.reduce((a, p) => a + p.amount + (p.lateFee || 0), 0);
  const pending = unpaid.reduce((a, p) => a + p.amount, 0);
  const rate = mPayments.length ? Math.round((paid.length / mPayments.length) * 100) : 0;

  const handleUndo = async (payment) => {
    const np = payments.map((p) => p.id === payment.id ? { ...p, status: "unpaid", paidOn: null, lateFee: 0 } : p);
    setPayments(np);
  };

  const handleGenerateFees = () => {
    setModal({ type: "generateFees" });
  };

  const handleGenerateFeesConfirm = () => {
    const toGenerate = students.filter((s) => {
      const p = getPayment(s.id, selectedMonth);
      return !p;
    });

    if (toGenerate.length === 0) {
      alert("All students already have fees generated for this month");
      setModal(null);
      return;
    }

    const newPayments = toGenerate.map((s) => {
      const b = getBatch(s.batchId);
      const base = b.fee - (s.discount || 0);
      const gstAmount = Math.round(base * (b.gstRate / 100));
      return {
        id: Math.random().toString(36).slice(2, 9),
        studentId: s.id,
        month: selectedMonth,
        status: "unpaid",
        amount: base + gstAmount,
        lateFee: 0,
        notes: "",
      };
    });

    const updatedPayments = [...payments, ...newPayments];
    setPayments(updatedPayments);
    setModal(null);
  };

  const handleMarkPaidClick = (student, payment) => {
    const b = getBatch(student.batchId);
    setModal({ type: "markPaid", data: { student, batch: b, payment } });
  };

  const handleMarkPaidSave = (payment, { paidOn, lateFee, notes, amount }) => {
    const updatedPayment = {
      ...payment,
      status: "paid",
      paidOn,
      paidAt: new Date().toISOString(),
      lateFee,
      notes,
      amount,
    };
    const np = payments.map((p) => p.id === payment.id ? updatedPayment : p);
    setPayments(np);
    setModal(null);
  };

  const handleBulkMarkPaid = () => {
    if (selected.size === 0) {
      alert("Please select payments to mark as paid");
      return;
    }
    const selectedPayments = unpaid.filter((p) => selected.has(p.id));
    setModal({ type: "bulkMarkPaid", data: { payments: selectedPayments } });
  };

  const handleBulkMarkPaidConfirm = (selectedPayments, paidDate) => {
    const np = payments.map((p) =>
      selectedPayments.some((sp) => sp.id === p.id)
        ? { ...p, status: "paid", paidOn: paidDate, paidAt: new Date().toISOString() }
        : p
    );
    setPayments(np);
    setSelected(new Set());
    setModal(null);
  };

  const handleSetDueDate = (payment) => {
    setModal({ type: "setDueDate", data: { payment } });
  };

  const handleSetDueDateSave = (updatedPayment) => {
    const np = payments.map((p) => p.id === updatedPayment.id ? updatedPayment : p);
    setPayments(np);
    setModal(null);
  };

  const closeModal = () => {
    setModal(null);
  };

  const toggleSelect = (paymentId) => {
    const newSelected = new Set(selected);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === unpaid.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unpaid.map((p) => p.id)));
    }
  };

  const exportCSV = () => {
    const rows = [["Name", "Phone", "Batch", "Month", "Amount", "Status", "Paid On", "Due Date", "Days Until", "Late Fee", "Notes"]];
    filtered.forEach((s) => {
      const b = getBatch(s.batchId);
      const p = getPayment(s.id, selectedMonth);
      const days = daysUntilDue(p?.dueDate);
      rows.push([s.name, s.phone, b?.name, monthLabel(selectedMonth), p ? fmtINR(p.amount) : "—", p?.status || "not generated", p?.paidOn || "—", p?.dueDate || "—", days !== null ? days : "—", p?.lateFee || 0, p?.notes || ""]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `FeeSync_${selectedMonth}.csv`; a.click();
  };

  return (
    <div>
      {/* Modals */}
      {modal?.type === "generateFees" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-backdrop" onClick={closeModal}></div>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header" style={{background: "var(--gradient-warning)", borderRadius: "16px 16px 0 0", paddingBottom: 20, color: "white"}}>
              <div style={{flex: 1}}>
                <div className="modal-title" style={{color: "white", fontSize: 18, marginBottom: 4}}>⚡ Generate Fees</div>
                <div className="modal-subtitle" style={{color: "rgba(255,255,255,0.8)"}}>For {monthLabel(selectedMonth)}</div>
              </div>
              <button className="modal-close" onClick={closeModal} style={{color: "white", fontWeight: "bold"}}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 16, animation: "pulse 2s infinite" }}>⚡</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "var(--text)" }}>Ready to Generate</div>
                <div style={{ fontSize: 14, color: "var(--text3)", lineHeight: 1.8 }}>
                  <strong style={{color: "var(--text)", fontSize: 18}}>{students.filter(s => !getPayment(s.id, selectedMonth)).length}</strong>
                  <div style={{marginTop: 4}}>students need fees for {monthLabel(selectedMonth)}</div>
                </div>
              </div>
              <div style={{background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)", borderRadius: "12px", padding: "14px", marginBottom: 0, borderLeft: "4px solid var(--amber)"}}>
                <div style={{fontSize: 12, color: "var(--text2)", fontWeight: 600}}>💡 This will create fee records for all selected students</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGenerateFeesConfirm} style={{background: "var(--gradient-warning)", boxShadow: "0 6px 20px rgba(245, 158, 11, 0.3)"}}>
                Generate {students.filter(s => !getPayment(s.id, selectedMonth)).length} Fees
              </button>
            </div>
          </div>
        </div>
      )}
      
      {modal?.type === "markPaid" && (
        <MarkPaidModalContent
          student={modal.data.student}
          batch={modal.data.batch}
          payment={modal.data.payment}
          onSave={handleMarkPaidSave}
          onClose={closeModal}
        />
      )}
      
      {modal?.type === "setDueDate" && (
        <SetPaymentDueDateModal
          payment={modal.data.payment}
          onSave={handleSetDueDateSave}
          onClose={closeModal}
        />
      )}
      
      {modal?.type === "bulkMarkPaid" && (
        <BulkMarkPaidModal
          payments={modal.data.payments || []}
          students={students}
          batches={batches}
          selectedMonth={selectedMonth}
          onSave={handleBulkMarkPaidConfirm}
          onClose={closeModal}
        />
      )}

      <div style={{display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap", alignItems: "center"}}>
        <div className="stat-card" style={{flex: "1 1 140px", minHeight: "auto", cursor: "default"}}>
          <div style={{fontSize: 22, marginBottom: 8}}>💰</div>
          <div style={{fontSize: 11, color: "var(--text4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4}}>Collected</div>
          <div style={{fontSize: 18, fontWeight: 800, color: "var(--accent)", fontFamily: "var(--font-display)"}}>₹{collected.toLocaleString("en-IN")}</div>
          <div style={{fontSize: 10, color: "var(--text4)", marginTop: 4}}>{paid.length} payments</div>
        </div>
        
        <div className="stat-card" style={{flex: "1 1 140px", minHeight: "auto", cursor: "default"}}>
          <div style={{fontSize: 22, marginBottom: 8}}>⏳</div>
          <div style={{fontSize: 11, color: "var(--text4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4}}>Pending</div>
          <div style={{fontSize: 18, fontWeight: 800, color: "var(--red)", fontFamily: "var(--font-display)"}}>₹{pending.toLocaleString("en-IN")}</div>
          <div style={{fontSize: 10, color: "var(--text4)", marginTop: 4}}>{unpaid.length} payments</div>
        </div>
        
        <div className="stat-card" style={{flex: "1 1 140px", minHeight: "auto", cursor: "default"}}>
          <div style={{fontSize: 22, marginBottom: 8}}>📊</div>
          <div style={{fontSize: 11, color: "var(--text4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4}}>Collection Rate</div>
          <div style={{fontSize: 18, fontWeight: 800, color: "var(--blue)", fontFamily: "var(--font-display)"}}>{rate}%</div>
          <div style={{fontSize: 10, color: "var(--text4)", marginTop: 4}}>of {mPayments.length} total</div>
        </div>
      </div>
      
      <div className="toolbar" style={{background: "var(--bg2)", padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--border)"}}>
        <select className="month-sel" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{padding: "8px 12px", fontWeight: 600}}>
          {months6.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={handleGenerateFees} style={{borderRadius: "8px"}}>⚡ Generate</button>
        {selected.size > 0 && (
          <button className="btn btn-primary btn-sm" onClick={handleBulkMarkPaid} style={{background: "var(--gradient-success)", color: "white", borderRadius: "8px", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)"}} title={`Mark ${selected.size} payments as paid`}>
            ✓ Mark {selected.size} as Paid
          </button>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV} style={{borderRadius: "8px"}}><I.Download /> Export CSV</button>
        </div>
      </div>
      <div className="card" style={{borderRadius: "14px", border: "1px solid var(--border)", boxShadow: "0 4px 6px rgba(0,0,0,.05)"}}>
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <div className="search-wrap" style={{ flex: "1 1 200px", position: "relative" }}><I.Search /><input className="input" style={{ paddingLeft: 34, borderRadius: "10px" }} placeholder="🔍 Search student or phone..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <div className="table-wrap" style={{borderRadius: "12px", border: "none", overflow: "hidden"}}>
          <table>
            <thead style={{background: "linear-gradient(135deg, rgba(15, 23, 42, 0.02) 0%, rgba(15, 23, 42, 0.04) 100%)"}}><tr><th style={{width: 40, paddingLeft: 16}}>
              <input type="checkbox" checked={selected.size === unpaid.length && unpaid.length > 0} onChange={selectAll} style={{cursor: "pointer", width: 18, height: 18, accentColor: "var(--accent)"}} />
            </th><th>Name</th><th>Batch</th><th style={{textAlign: "right", paddingRight: 16}}>Amount</th><th>Status</th><th>Due Date</th><th>Paid On</th><th style={{ textAlign: "right", paddingRight: 16 }}>Actions</th></tr></thead>
            <tbody>
              {filtered.map((s) => {
                const b = getBatch(s.batchId);
                if (!b) return null;
                const p = getPayment(s.id, selectedMonth);
                const amt = p ? p.amount : b.fee - (s.discount || 0) + Math.round((b.fee - (s.discount || 0)) * b.gstRate / 100);
                const days = daysUntilDue(p?.dueDate);
                const isSelected = p && selected.has(p.id);
                const isUnpaid = p?.status === "unpaid";
                const isPaid = p?.status === "paid";
                const isOverdue = days !== null && days < 0;
                const isDueToday = days === 0;
                const isDueSoon = days !== null && days > 0 && days <= 3;

                return (
                  <tr key={s.id} style={
                    isSelected ? {
                      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)",
                      borderLeft: "3px solid var(--accent)"
                    } : isPaid ? {
                      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(5, 150, 105, 0.02) 100%)",
                    } : isOverdue ? {
                      background: "linear-gradient(135deg, rgba(220, 38, 38, 0.04) 0%, rgba(220, 38, 38, 0.02) 100%)",
                    } : {}
                  }>
                    <td style={{width: 40, paddingLeft: 16}}>
                      {isUnpaid && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          style={{cursor: "pointer", width: 18, height: 18, accentColor: "var(--accent)"}}
                        />
                      )}
                    </td>
                    <td><div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", letterSpacing: "-0.3px" }}>{s.name}</div></td>
                    <td><span className="badge badge-batch" style={{fontWeight: 600}}>{b.name}</span></td>
                    <td style={{textAlign: "right", paddingRight: 16, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: isPaid ? "var(--accent)" : "var(--text)"}}>₹{(amt + (p?.lateFee || 0)).toLocaleString("en-IN")}</td>
                    <td>
                      {!p ? (
                        <span className="badge" style={{background: "rgba(100, 116, 139, 0.1)", color: "var(--text4)", fontSize: 11, fontWeight: 600}}>Not Generated</span>
                      ) : p.status === "paid" ? (
                        <span className="badge badge-paid" style={{fontWeight: 700, fontSize: 11}}>✓ Paid</span>
                      ) : (
                        <span className="badge badge-unpaid" style={{fontWeight: 700, fontSize: 11}}>⏳ Unpaid</span>
                      )}
                    </td>
                    <td>
                      <div style={{fontSize: 12}}>
                        {p?.dueDate ? fmtDate(p.dueDate) : "—"}
                        {p?.dueDate && days !== null && (
                          <div style={{fontSize: 11, fontWeight: 600, marginTop: 2, color: isOverdue ? "var(--red)" : isDueToday ? "var(--amber)" : isDueSoon ? "var(--amber)" : "var(--text4)"}}>
                            {isOverdue ? `⚠️ ${Math.abs(days)}d overdue` : isDueToday ? "🔔 Due today" : isDueSoon ? `📅 ${days}d left` : `✓ ${days}d left`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{isPaid ? fmtDate(p.paidOn) : "—"}</td>
                    <td style={{paddingRight: 16}}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                        {isPaid && (
                          <>
                            <ReceiptButton
                              student={{
                                ...s,
                                dueAmount: s?.dueAmount ?? Math.max((b?.fee || 0) - (p?.amount || 0), 0),
                              }}
                              batch={b}
                              payment={p}
                              settingsData={{
                                ...settings,
                                ...profile,
                                instituteName: profile?.name || settings?.instituteName,
                              }}
                            />
                            <button className="btn btn-danger btn-sm" onClick={() => handleUndo(p)} title="Undo payment"><I.Undo /></button>
                          </>
                        )}
                        {isUnpaid && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleSetDueDate(p)} title="Set due date" style={{borderRadius: "7px"}}>📅</button>
                            <button className="btn btn-primary btn-sm" onClick={() => handleMarkPaidClick(s, p)} style={{background: "var(--gradient-success)", borderRadius: "7px", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)", color: "white"}}>✓ Paid</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty" style={{padding: "40px 20px"}}>
            <div className="empty-icon">📭</div>
            <div className="empty-title">No payments found</div>
            <div className="empty-desc">Try adjusting your filters or generate fees for the selected month</div>
          </div>
        )}
      </div>
    </div>
  );
}
