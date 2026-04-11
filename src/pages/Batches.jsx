import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import { monthKey, fmtINR, fmtDate } from "../utils/commonHelpers";

const curMonth = monthKey();

const I = {
  Search: () => <span>🔎</span>,
  Plus: () => <span>＋</span>,
  Edit: () => <span>✎</span>,
  Trash: () => <span>🗑</span>,
  History: () => <span>🕘</span>,
};

export default function Batches() {
  const { state, dispatch } = useApp();
  const { batches, students, payments } = state;
  const { showToast, showError, showSuccess } = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);

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
        showSuccess("Student deleted");
      } catch (error) {
        showError("Failed to delete student");
      }
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

  return (
    <div>
      <div className="toolbar" style={{ gap: 8, flexWrap: "wrap" }}>
        <div className="search-wrap" style={{ flex: "1 1 200px", maxWidth: 300 }}>
          <I.Search />
          <input 
            className="input" 
            style={{ paddingLeft: 34 }} 
            placeholder="Search students..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <select className="input" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} style={{ flex: "0 0 160px" }}>
          <option value="">All Batches</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn btn-secondary"><I.Plus /> New Batch</button>
          <button className="btn btn-primary"><I.Plus /> Add Student</button>
        </div>
      </div>

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
                    <button className="btn btn-ghost btn-icon btn-sm"><I.Edit /></button>
                    <button 
                      className="btn btn-ghost btn-icon btn-sm" 
                      style={{ color: "var(--red)" }} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        deleteBatch(b); 
                      }}
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

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">All Students</div>
            <div className="card-subtitle">{filteredStudents.length} students</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Phone</th>
                <th>Batch</th>
                <th>Joined</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const b = getBatch(s.batchId);
                  const p = getCurPayment(s.id);
                  return (
                    <tr key={s.id}>
                      <td><div className="td-primary">{s.name}</div></td>
                      <td className="td-mono" style={{ fontSize: 12 }}>{s.phone}</td>
                      <td>{b?.name}</td>
                      <td style={{ fontSize: 12, color: "var(--text4)" }}>{fmtDate(s.joiningDate)}</td>
                      <td>{p?.status || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost btn-icon btn-sm"><I.History /></button>
                          <button className="btn btn-ghost btn-icon btn-sm"><I.Edit /></button>
                          <button 
                            className="btn btn-ghost btn-icon btn-sm" 
                            style={{ color: "var(--red)" }} 
                            onClick={() => deleteStudent(s)}
                          >
                            <I.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
