import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import { monthKey, fmtINR, fmtDate } from "../utils/commonHelpers";
import SetPaymentDueDateModal from "../components/modals/SetPaymentDueDateModal";
import BulkMarkPaidModal from "../components/modals/BulkMarkPaidModal";
import ReminderSchedulerModal from "../components/modals/ReminderSchedulerModal";
import ReceiptButton from "../components/fees/ReceiptButton";

const curMonth = monthKey();

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
  Plus: () => <span style={{fontSize: 16}}>＋</span>,
  Edit: () => <span>✎</span>,
  Trash: () => <span>🗑</span>,
  History: () => <span>🕘</span>,
  Receipt: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Undo: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,
  Download: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
};

export default function Batches() {
  const { state, dispatch } = useApp();
  const { batches, students, payments, businessProfile: profile, settings } = state;
  const { showToast, showError, showSuccess } = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "grid" or "list"
  const [selected, setSelected] = useState(new Set());
  const [modal, setModal] = useState(null);

  const setBatches = (v) => dispatch({ type: "SET_BATCHES", payload: v });
  const setStudents = (v) => dispatch({ type: "SET_STUDENTS", payload: v });
  const setPayments = (v) => dispatch({ type: "SET_PAYMENTS", payload: v });

  const deleteBatch = async (batch) => {
    const hasStu = students.some((s) => s.batchId === batch.id);
    if (hasStu) {
      showError("Cannot delete batch with enrolled students");
      return;
    }
    
    const confirmed = await confirm(`Delete "${batch.name}"?`, "Delete Batch");
    if (confirmed) {
      try {
        const nb = batches.filter((b) => b.id !== batch.id);
        setBatches(nb);
        if (selectedBatch?.id === batch.id) setSelectedBatch(null);
        showSuccess("Batch deleted");
      } catch (error) {
        showError("Failed to delete batch");
      }
    }
  };

  const deleteStudent = async (student) => {
    const confirmed = await confirm(`Delete "${student.name}"?`, "Delete Student");
    if (confirmed) {
      try {
        setStudents(students.filter((s) => s.id !== student.id));
        setPayments(payments.filter((p) => p.studentId !== student.id));
        setSelected(prev => {
          const newSet = new Set(prev);
          newSet.delete(student.id);
          return newSet;
        });
        showSuccess("Student deleted");
      } catch (error) {
        showError("Failed to delete student");
      }
    }
  };

  const toggleSelect = (studentId) => {
    const newSelected = new Set(selected);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === filteredStudents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      (!search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search)) &&
      (!batchFilter || s.batchId === batchFilter)
  );

  const getCurPayment = (sId) => payments.find((p) => p.studentId === sId && p.month === curMonth);
  const getBatch = (id) => batches.find((b) => b.id === id);
  const getPayment = (sId, m) => payments.find((p) => p.studentId === sId && p.month === m);

  // Modal handlers
  const handleSetDueDate = (payment) => {
    setModal({ type: "setDueDate", data: { payment } });
  };

  const handleSetDueDateSave = (updatedPayment) => {
    const np = payments.map((p) => p.id === updatedPayment.id ? updatedPayment : p);
    setPayments(np);
    setModal(null);
  };

  const handleReminderScheduler = (payment, student, batch) => {
    setModal({ type: "reminderScheduler", data: { payment, student, batch } });
  };

  const handleReminderScheduled = () => {
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
    const selectedPayments = [];
    selected.forEach(sId => {
      const p = getCurPayment(sId);
      if (p && p.status === "unpaid") {
        selectedPayments.push(p);
      }
    });
    
    if (selectedPayments.length === 0) {
      showError("No unpaid payments selected");
      return;
    }
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

  const handleUndo = async (payment) => {
    const np = payments.map((p) => p.id === payment.id ? { ...p, status: "unpaid", paidOn: null, lateFee: 0 } : p);
    setPayments(np);
  };

  const closeModal = () => {
    setModal(null);
  };

  return (
    <div>
      {/* Modals */}
      {modal?.type === "setDueDate" && (
        <SetPaymentDueDateModal
          payment={modal.data.payment}
          onSave={handleSetDueDateSave}
          onClose={closeModal}
        />
      )}
      
      {modal?.type === "reminderScheduler" && (
        <ReminderSchedulerModal
          payment={modal.data.payment}
          student={modal.data.student}
          batch={modal.data.batch}
          onSave={handleReminderScheduled}
          onClose={closeModal}
        />
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
      
      {modal?.type === "bulkMarkPaid" && (
        <BulkMarkPaidModal
          payments={modal.data.payments || []}
          students={students}
          batches={batches}
          selectedMonth={curMonth}
          onSave={handleBulkMarkPaidConfirm}
          onClose={closeModal}
        />
      )}

      {/* Batch Cards Grid */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {batches.map((b) => {
          const enrolled = students.filter((s) => s.batchId === b.id).length;
          const capPct = Math.min(100, Math.round((enrolled / (b.capacity || 1)) * 100));
          const mPaid = payments.filter((p) => p.month === curMonth && p.status === "paid" && students.find((s) => s.id === p.studentId && s.batchId === b.id)).length;
          return (
            <div key={b.id} className="batch-card" onClick={() => setSelectedBatch(b)} style={{ cursor: "pointer" }}>
              <div className="batch-strip" style={{ background: b.color }} />
              <div className="batch-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text4)", marginTop: 2 }}>{b.subject}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Edit batch"><I.Edit /></button>
                    <button 
                      className="btn btn-ghost btn-icon btn-sm" 
                      style={{ color: "var(--red)" }} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        deleteBatch(b); 
                      }}
                      title="Delete batch"
                    >
                      <I.Trash />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: b.color, marginBottom: 8 }}>{fmtINR(b.fee)}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text4)", marginBottom: 6 }}>
                  <span>{enrolled}/{b.capacity}</span>
                  <span>{mPaid}/{enrolled} paid</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Student Management Section */}
      <div className="card" style={{ borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
            <div>
              <div className="card-title">Student Management</div>
              <div className="card-subtitle">{filteredStudents.length} students • {selected.size} selected</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button 
                className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setViewMode('list')}
                style={{ padding: "7px 14px", fontSize: 12, borderRadius: "8px" }}
                title="List view"
              >
                ≡ List
              </button>
              <button 
                className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setViewMode('grid')}
                style={{ padding: "7px 14px", fontSize: 12, borderRadius: "8px" }}
                title="Grid view"
              >
                ⊞ Grid
              </button>
            </div>
          </div>
          
          <div className="search-wrap" style={{ flex: "1", position: "relative", marginBottom: 0 }}>
            <I.Search />
            <input 
              className="input" 
              style={{ paddingLeft: 34, borderRadius: "10px" }} 
              placeholder="🔍 Search student or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg2)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select 
            className="input" 
            value={batchFilter} 
            onChange={(e) => setBatchFilter(e.target.value)} 
            style={{ flex: "0 0 auto", maxWidth: 200, borderRadius: "8px", padding: "7px 12px", fontSize: 12 }}
          >
            <option value="">All Batches</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          
          {selected.size > 0 && (
            <button 
              className="btn btn-primary" 
              onClick={handleBulkMarkPaid}
              style={{ background: "var(--gradient-success)", borderRadius: "8px", fontSize: 12, padding: "7px 14px", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)" }}
              title="Mark selected students as paid"
            >
              ✓ Mark {selected.size} Paid
            </button>
          )}
          
          <button 
            className="btn btn-secondary" 
            onClick={() => selectAll()}
            style={{ marginLeft: "auto", borderRadius: "8px", fontSize: 12, padding: "7px 14px" }}
            title={selected.size === filteredStudents.length ? "Deselect all" : "Select all"}
          >
            {selected.size === filteredStudents.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="table-wrap" style={{borderRadius: 0, border: "none"}}>
            <table>
              <thead style={{background: "linear-gradient(135deg, rgba(15, 23, 42, 0.02) 0%, rgba(15, 23, 42, 0.04) 100%)"}}>
                <tr>
                  <th style={{width: 36, paddingLeft: 14, paddingRight: 6}}>
                    <input 
                      type="checkbox" 
                      checked={selected.size === filteredStudents.length && filteredStudents.length > 0} 
                      onChange={selectAll} 
                      style={{cursor: "pointer", width: 16, height: 16, accentColor: "var(--accent)"}} 
                    />
                  </th>
                  <th>Student</th>
                  <th>Phone</th>
                  <th>Batch</th>
                  <th>Joined</th>
                  <th>Fee Status</th>
                  <th style={{textAlign: "right", paddingRight: 14}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--text4)" }}>
                      📭 No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const b = getBatch(s.batchId);
                    const p = getCurPayment(s.id);
                    const isSelected = selected.has(s.id);
                    const isPaid = p?.status === "paid";
                    const days = daysUntilDue(p?.dueDate);
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
                        <td style={{width: 36, paddingLeft: 14, paddingRight: 6}}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(s.id)}
                            style={{cursor: "pointer", width: 16, height: 16, accentColor: "var(--accent)"}}
                          />
                        </td>
                        <td><div className="td-primary">{s.name}</div></td>
                        <td className="td-mono" style={{ fontSize: 12 }}>{s.phone}</td>
                        <td><span className="badge badge-batch" style={{fontWeight: 600, fontSize: 11}}>{b?.name}</span></td>
                        <td style={{ fontSize: 12, color: "var(--text4)" }}>{fmtDate(s.joiningDate)}</td>
                        <td>
                          <div>
                            {!p ? (
                              <span className="badge" style={{background: "rgba(100, 116, 139, 0.1)", color: "var(--text4)", fontSize: 10, fontWeight: 600}}>—</span>
                            ) : p.status === "paid" ? (
                              <span className="badge badge-paid" style={{fontWeight: 700, fontSize: 10}}>✓ Paid</span>
                            ) : (
                              <span className="badge badge-unpaid" style={{fontWeight: 700, fontSize: 10}}>Unpaid</span>
                            )}
                            {p?.dueDate && days !== null && (
                              <div style={{fontSize: 10, fontWeight: 600, marginTop: 4, color: isOverdue ? "var(--red)" : isDueToday ? "var(--amber)" : isDueSoon ? "var(--amber)" : "var(--text4)"}}>
                                {isOverdue ? `⚠️ ${Math.abs(days)}d ago` : isDueToday ? "🔔 Today" : isDueSoon ? `📅 ${days}d` : `✓ ${days}d`}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{paddingRight: 14}}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                            {isPaid && p && (
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
                                <button className="btn btn-danger" onClick={() => handleUndo(p)} title="Undo payment" style={{padding: "5px 8px", fontSize: 11, borderRadius: "6px"}}><I.Undo /></button>
                              </>
                            )}
                            {p?.status === "unpaid" && (
                              <>
                                <button className="btn btn-secondary" onClick={() => handleSetDueDate(p)} title="Set due date" style={{borderRadius: "6px", padding: "5px 8px", fontSize: 11}}>📅</button>
                                <button className="btn btn-secondary" onClick={() => handleReminderScheduler(p, s, b)} title="Send reminder" style={{borderRadius: "6px", padding: "5px 8px", fontSize: 11}}>🔔</button>
                                <button className="btn btn-primary" onClick={() => handleMarkPaidClick(s, p)} style={{background: "var(--gradient-success)", borderRadius: "6px", padding: "5px 10px", fontSize: 11, boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)", color: "white"}}>✓</button>
                              </>
                            )}
                            <button className="btn btn-ghost btn-icon btn-sm" title="History" style={{color: "var(--text3)"}}><I.History /></button>
                            <button className="btn btn-ghost btn-icon btn-sm" title="Edit" style={{color: "var(--text3)"}}><I.Edit /></button>
                            <button className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--red)" }} onClick={() => deleteStudent(s)} title="Delete"><I.Trash /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filteredStudents.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "var(--text4)" }}>
                📭 No students found
              </div>
            ) : (
              filteredStudents.map((s) => {
                const b = getBatch(s.batchId);
                const p = getCurPayment(s.id);
                const isSelected = selected.has(s.id);
                const isPaid = p?.status === "paid";
                const days = daysUntilDue(p?.dueDate);
                const isOverdue = days !== null && days < 0;
                const isDueToday = days === 0;
                const isDueSoon = days !== null && days > 0 && days <= 3;

                return (
                  <div 
                    key={s.id} 
                    className="card" 
                    style={{
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: isSelected ? "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)" : "var(--bg2)"
                    }}
                    onClick={() => toggleSelect(s.id)}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(s.id)}
                          style={{cursor: "pointer", width: 18, height: 18, accentColor: "var(--accent)", marginBottom: 8}}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="td-primary" style={{fontSize: 14, marginBottom: 2}}>{s.name}</div>
                        <div style={{fontSize: 12, color: "var(--text4)"}}>{s.phone}</div>
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--red)" }} onClick={(e) => {e.stopPropagation(); deleteStudent(s);}} title="Delete"><I.Trash /></button>
                    </div>
                    
                    <div style={{ padding: "10px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
                      <div style={{fontSize: 11, color: "var(--text4)", fontWeight: 600, marginBottom: 3}}>Batch</div>
                      <div style={{fontSize: 12, fontWeight: 600, color: "var(--text)"}}>{b?.name}</div>
                      <div style={{fontSize: 11, color: "var(--text4)", marginTop: 6, marginBottom: 3}}>Joined</div>
                      <div style={{fontSize: 12, color: "var(--text)"}}>{fmtDate(s.joiningDate)}</div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{fontSize: 11, color: "var(--text4)", fontWeight: 600, marginBottom: 6}}>Fee Status</div>
                      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8}}>
                        {!p ? (
                          <span className="badge" style={{background: "rgba(100, 116, 139, 0.1)", color: "var(--text4)", fontSize: 10, fontWeight: 600}}>—</span>
                        ) : p.status === "paid" ? (
                          <span className="badge badge-paid" style={{fontWeight: 700, fontSize: 10}}>✓ Paid</span>
                        ) : (
                          <span className="badge badge-unpaid" style={{fontWeight: 700, fontSize: 10}}>Unpaid</span>
                        )}
                        {p?.dueDate && days !== null && (
                          <span style={{fontSize: 10, fontWeight: 600, color: isOverdue ? "var(--red)" : isDueToday ? "var(--amber)" : isDueSoon ? "var(--amber)" : "var(--text4)"}}>
                            {isOverdue ? `⚠️ ${Math.abs(days)}d` : isDueToday ? "🔔 Today" : isDueSoon ? `📅 ${days}d` : `${days}d`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
                      {isPaid && p && (
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
                          <button className="btn btn-danger" onClick={(e) => {e.stopPropagation(); handleUndo(p);}} title="Undo payment" style={{padding: "6px 12px", fontSize: 11, borderRadius: "6px"}}>
                            <I.Undo /> Undo
                          </button>
                        </>
                      )}
                      {p?.status === "unpaid" && (
                        <>
                          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6}}>
                            <button className="btn btn-secondary" onClick={(e) => {e.stopPropagation(); handleSetDueDate(p);}} title="Set due date" style={{borderRadius: "6px", padding: "6px 8px", fontSize: 11}}>📅 Due Date</button>
                            <button className="btn btn-secondary" onClick={(e) => {e.stopPropagation(); handleReminderScheduler(p, s, b);}} title="Send reminder" style={{borderRadius: "6px", padding: "6px 8px", fontSize: 11}}>🔔 Remind</button>
                          </div>
                          <button className="btn btn-primary" onClick={(e) => {e.stopPropagation(); handleMarkPaidClick(s, p);}} style={{background: "var(--gradient-success)", borderRadius: "6px", padding: "7px 12px", fontSize: 12, boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)", color: "white", fontWeight: 600}}>
                            ✓ Mark Paid
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
        <div className="modal-header" style={{ background: "var(--gradient-success)", borderRadius: "16px 16px 0 0", paddingBottom: 18, color: "white" }}>
          <div style={{flex: 1}}>
            <div className="modal-title" style={{color: "white", fontSize: 16, marginBottom: 3}}>✅ Mark as Paid</div>
            <div className="modal-subtitle" style={{color: "rgba(255,255,255,0.85)", fontSize: 12}}>{student.name} · {batch.name}</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{color: "white", fontSize: 22, fontWeight: "bold"}}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)", borderRadius: "12px", padding: "14px", marginBottom: 16, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--text4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Base Fee</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>₹{base.toLocaleString("en-IN")}</div>
              </div>
              {gst > 0 && <div>
                <div style={{ fontSize: 10, color: "var(--text4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>GST ({batch.gstRate}%)</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>₹{gst.toLocaleString("en-IN")}</div>
              </div>}
            </div>
            {lateFee > 0 && <div style={{ padding: "8px 0", borderTop: "1px solid rgba(220,38,38,.15)", marginBottom: 6, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
              <div style={{fontSize: 11, color: "var(--red)", fontWeight: 700}}>⚠️ Late Fee</div>
              <div style={{color: "var(--red)", fontWeight: 700, fontSize: 13}}>₹{(+lateFee).toLocaleString("en-IN")}</div>
            </div>}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid rgba(5,150,105,.25)", paddingTop: 10, marginTop: 6 }}>
              <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 12 }}>Total Amount</span>
              <span style={{ fontWeight: 800, color: "var(--accent)", fontFamily: "var(--font-display)", fontSize: 16 }}>₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 12}}>📅 Payment Date</label>
            <input type="date" className="input" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} style={{borderRadius: "10px", fontSize: 13}} />
          </div>
          
          <div className="input-group">
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 12}}>⚠️ Late Fee (if any)</label>
            <input type="number" className="input" value={lateFee} onChange={(e) => setLateFee(e.target.value)} placeholder="0" min="0" style={{borderRadius: "10px", fontSize: 13}} />
          </div>
          
          <div className="input-group" style={{marginBottom: 0}}>
            <label className="input-label" style={{fontWeight: 700, color: "var(--text)", fontSize: 12}}>📝 Notes</label>
            <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Cheque #1234, Online transfer..." style={{borderRadius: "10px", fontSize: 13}} />
          </div>
        </div>
        <div className="modal-footer" style={{paddingTop: 14}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} style={{background: "var(--gradient-success)", boxShadow: "0 6px 20px rgba(16, 185, 129, 0.3)", padding: "8px 16px", fontSize: 13}}>Mark Paid</button>
        </div>
      </div>
    </div>
  );
}
