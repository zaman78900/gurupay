import React, { useState, useMemo } from 'react';
import { I } from '../../utils/Icons';
import { fmtINR, fmtDate, monthLabel, curMonth } from '../../utils';

const BatchDetails = ({ 
  batch, 
  students, 
  payments, 
  onEditBatch, 
  onDeleteBatch, 
  onAddStudent, 
  onEditStudent, 
  onDeleteStudent, 
  onMarkPaid, 
  onWaiveFee, 
  onSendReminder, 
  toast 
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedMonth, setSelectedMonth] = useState(curMonth);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [selected, setSelected] = useState(new Set()); // Bulk selection

  const batchStudents = useMemo(() => {
    return students
      .filter(s => s.batchId === batch.id)
      .filter(s => !search || 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.phone.includes(search) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
          case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
          case 'phone': aVal = a.phone; bVal = b.phone; break;
          case 'joiningDate': aVal = a.joiningDate; bVal = b.joiningDate; break;
          case 'status': {
            const aPayment = payments.find(p => p.studentId === a.id && p.month === selectedMonth);
            const bPayment = payments.find(p => p.studentId === b.id && p.month === selectedMonth);
            aVal = aPayment?.status || 'not_generated';
            bVal = bPayment?.status || 'not_generated';
            break;
          }
          default: aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase();
        }
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [students, batch.id, search, sortBy, sortOrder, selectedMonth, payments]);

  const getPaymentStatus = (studentId) => {
    const payment = payments.find(p => p.studentId === studentId && p.month === selectedMonth);
    return payment || null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'var(--accent)';
      case 'waived': return 'var(--blue)';
      case 'unpaid': return 'var(--red)';
      default: return 'var(--text4)';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid': return 'badge-paid';
      case 'waived': return 'badge-waived';
      case 'unpaid': return 'badge-unpaid';
      default: return '';
    }
  };

  const calculateBatchStats = () => {
    const totalStudents = batchStudents.length;
    const activeStudents = batchStudents.filter(s => {
      const payment = getPaymentStatus(s.id);
      return payment?.status === 'paid' || payment?.status === 'unpaid';
    }).length;
    
    const thisMonthPayments = payments.filter(p => 
      p.month === selectedMonth && 
      batchStudents.some(s => s.id === p.studentId)
    );
    
    const paidCount = thisMonthPayments.filter(p => p.status === 'paid').length;
    const unpaidCount = thisMonthPayments.filter(p => p.status === 'unpaid').length;
    const waivedCount = thisMonthPayments.filter(p => p.status === 'waived').length;
    
    const collectedAmount = thisMonthPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount + (p.lateFee || 0), 0);
    
    const pendingAmount = thisMonthPayments
      .filter(p => p.status === 'unpaid')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalStudents,
      activeStudents,
      paidCount,
      unpaidCount,
      waivedCount,
      collectedAmount,
      pendingAmount,
      collectionRate: thisMonthPayments.length > 0 
        ? Math.round((paidCount / thisMonthPayments.length) * 100) 
        : 0
    };
  };

  const stats = calculateBatchStats();

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
    if (selected.size === batchStudents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(batchStudents.map(s => s.id)));
    }
  };

  return (
    <div className="batch-details">
      {/* Batch Header */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div 
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  background: batch.color,
                  boxShadow: `0 0 0 3px ${batch.color}33`
                }} 
              />
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--text)' }}>
                  {batch.name}
                </h2>
                <p style={{ margin: 0, color: 'var(--text4)', fontSize: '12px' }}>
                  {batch.subject} • {batch.timing}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text4)' }}>
              <span>Capacity: {batch.capacity} students</span>
              <span>Fee: {fmtINR(batch.fee)}{batch.gstRate > 0 ? ` + ${batch.gstRate}% GST` : ''}</span>
              <span>GST Rate: {batch.gstRate}%</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onEditBatch(batch)}>
              <I.Edit /> Edit Batch
            </button>
            <button 
              className="btn btn-danger btn-sm" 
              onClick={() => onDeleteBatch(batch)}
              disabled={batchStudents.length > 0}
            >
              <I.Trash /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Batch Stats */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        {[
          { label: 'Total Students', value: stats.totalStudents, icon: '🎓', color: 'var(--text)' },
          { label: 'Active This Month', value: stats.activeStudents, icon: '✅', color: 'var(--accent)' },
          { label: 'Collection Rate', value: `${stats.collectionRate}%`, icon: '📊', color: stats.collectionRate >= 80 ? 'var(--accent)' : stats.collectionRate >= 50 ? 'var(--amber)' : 'var(--red)' },
          { label: 'Revenue', value: fmtINR(stats.collectedAmount), icon: '💰', color: 'var(--accent)' }
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div className="stat-icon-wrap" style={{ background: stat.color + '15' }}>
              {stat.icon}
            </div>
            <div className="stat-val" style={{ color: stat.color }}>{stat.value}</div>
            <div className="stat-lbl">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Student Management Toolbar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Student Management</div>
            <div className="card-subtitle">Manage students in {batch.name} • {selected.size > 0 ? `${selected.size} selected` : `${batchStudents.length} students`}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select 
              className="month-sel" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {Array.from({ length: 6 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                return <option key={key} value={key}>{monthLabel(key)}</option>;
              })}
            </select>
            <div className="filter-tabs">
              {['list', 'grid'].map(mode => (
                <div 
                  key={mode} 
                  className={`filter-tab ${viewMode === mode ? 'active' : ''}`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === 'list' ? 'List' : 'Grid'}
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={onAddStudent}>
              <I.Plus /> Add Student
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: '1 1 300px' }}>
            <I.Search />
            <input 
              className="input" 
              style={{ paddingLeft: '34px', borderRadius: '10px', fontSize: '13px' }}
              placeholder="Search students by name or phone..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ maxWidth: '180px', borderRadius: '8px', fontSize: '12px', padding: '7px 12px' }}>
            <option value="name">Sort by Name</option>
            <option value="phone">Sort by Phone</option>
            <option value="joiningDate">Sort by Joining Date</option>
            <option value="status">Sort by Status</option>
          </select>
          <button 
            className="btn btn-secondary" 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '8px' }}
          >
            {sortOrder === 'asc' ? '↑' : '↓'} 
          </button>
        </div>

        {/* Bulk Selection Toolbar */}
        {batchStudents.length > 0 && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg2)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="checkbox"
              checked={selected.size === batchStudents.length && batchStudents.length > 0}
              onChange={selectAll}
              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent)' }}
              title={selected.size === batchStudents.length ? 'Deselect all' : 'Select all'}
            />
            <span style={{ fontSize: '12px', color: 'var(--text4)', fontWeight: '500' }}>
              {selected.size > 0 ? `${selected.size} selected` : 'No selection'}
            </span>
            {selected.size > 0 && (
              <>
                <div style={{ width: '1px', height: '20px', background: 'var(--border)' }}></div>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setSelected(new Set())}
                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                  title="Clear selection"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        )}

        {/* Students List/Grid */}
        {viewMode === 'list' ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '36px', paddingLeft: '16px', paddingRight: '8px' }}>
                    <input 
                      type="checkbox"
                      checked={selected.size === batchStudents.length && batchStudents.length > 0}
                      onChange={selectAll}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                      title={selected.size === batchStudents.length ? 'Deselect all' : 'Select all'}
                    />
                  </th>
                  <th>Student Name</th>
                  <th>Roll #</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Joining Date</th>
                  <th>Discount</th>
                  <th>Student Status</th>
                  <th>Fee Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batchStudents.length === 0 ? (
                  <tr>
                    <td colSpan="10">
                      <div className="empty">
                        <div className="empty-icon">👥</div>
                        <div className="empty-title">No students in this batch</div>
                        <div className="empty-desc">Add your first student to get started</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  batchStudents.map(student => {
                    const payment = getPaymentStatus(student.id);
                    const isSelected = selected.has(student.id);
                    
                    return (
                      <tr key={student.id} style={isSelected ? {
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)',
                        borderLeft: '3px solid var(--accent)'
                      } : {}}>
                        <td style={{ width: '36px', paddingLeft: '16px', paddingRight: '8px' }}>
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(student.id)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{student.name}</div>
                          {student.notes && (
                            <div style={{ fontSize: '11px', color: 'var(--amber)', marginTop: '2px' }}>
                              📝 {student.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '12px' }}>{student.rollNumber || '—'}</td>
                        <td className="td-mono" style={{ fontSize: '12px' }}>{student.phone}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text4)' }}>
                          {student.email || 'No email'}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text4)' }}>
                          {fmtDate(student.joiningDate)}
                        </td>
                        <td>
                          {student.discount > 0 ? (
                            <span className="badge badge-discount">
                              – {fmtINR(student.discount)}
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text4)' }}>None</span>
                          )}
                        </td>
                        <td>{student.status || 'Active'}</td>
                        <td>
                          {payment ? (
                            <span 
                              className={`badge ${getStatusBadge(payment.status)}`}
                              style={{ color: getStatusColor(payment.status) }}
                            >
                              {payment.status === 'paid' ? '✓ Paid' : 
                               payment.status === 'waived' ? '🔵 Waived' : 
                               '⏳ Unpaid'}
                              {payment.lateFee > 0 && ` (+₹${payment.lateFee})`}
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text4)' }}>Not Generated</span>
                          )}
                        </td>
                        <td style={{ paddingRight: '16px' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-ghost btn-icon btn-sm" 
                              onClick={() => onEditStudent(student)}
                              title="Edit Student"
                            >
                              <I.Edit />
                            </button>
                            <button 
                              className="btn btn-wa btn-sm" 
                              onClick={() => onSendReminder(student)}
                              disabled={!payment || payment.status === 'paid'}
                              title="Send WhatsApp Reminder"
                            >
                              <I.WA />
                            </button>
                            {(!payment || payment.status === 'unpaid') && (
                              <>
                                <button 
                                  className="btn btn-primary btn-sm" 
                                  onClick={() => onMarkPaid(student, payment)}
                                  title="Mark as Paid"
                                >
                                  <I.Check /> Paid
                                </button>
                                <button 
                                  className="btn btn-amber btn-sm" 
                                  onClick={() => onWaiveFee(student, payment)}
                                  title="Waive Fee"
                                >
                                  <I.Waive />
                                </button>
                              </>
                            )}
                            <button 
                              className="btn btn-danger btn-sm" 
                              onClick={() => onDeleteStudent(student)}
                              title="Remove Student"
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
        ) : (
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {batchStudents.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--text4)' }}>
                📭 No students found
              </div>
            ) : (
              batchStudents.map(student => {
                const payment = getPaymentStatus(student.id);
                const isSelected = selected.has(student.id);
                
                return (
                  <div 
                    key={student.id} 
                    className="card" 
                    style={{ 
                      padding: '16px', 
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: isSelected ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)' : 'var(--bg2)',
                      boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.08)'
                    }}
                    onClick={() => toggleSelect(student.id)}
                  >
                    {/* Selection Checkbox */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(student.id)}
                        style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--accent)', marginTop: '2px', flex: '0 0 auto' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)', marginBottom: '2px' }}>
                          {student.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text4)' }}>
                          {student.rollNumber ? `Roll #${student.rollNumber}` : '—'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Student Info */}
                    <div style={{ padding: '10px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text4)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '3px', letterSpacing: '0.4px' }}>Contact</div>
                      <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '8px' }}>📱 {student.phone}</div>
                      {student.email && (
                        <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '8px' }}>📧 {student.email}</div>
                      )}
                      <div style={{ fontSize: '11px', color: 'var(--text4)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '3px', letterSpacing: '0.4px', marginTop: '8px' }}>Status</div>
                      <div style={{ fontSize: '12px', color: 'var(--text)' }}>{student.status || 'Active'}</div>
                    </div>

                    {/* Fee & Discount Info */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text4)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.4px' }}>Fee Status</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        {payment ? (
                          <span 
                            className={`badge ${getStatusBadge(payment.status)}`}
                            style={{ color: getStatusColor(payment.status) }}
                          >
                            {payment.status === 'paid' ? '✓ Paid' : 
                             payment.status === 'waived' ? '🔵 Waived' : 
                             '⏳ Unpaid'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text4)', background: 'rgba(100, 116, 139, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>Not Generated</span>
                        )}
                      </div>
                      {student.discount > 0 && (
                        <div className="badge" style={{ background: 'rgba(251, 146, 60, 0.15)', color: 'var(--amber)', fontSize: '11px', fontWeight: '600' }}>
                          💰 Discount: {fmtINR(student.discount)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-ghost btn-icon btn-sm" 
                        onClick={(e) => { e.stopPropagation(); onEditStudent(student); }}
                        title="Edit Student"
                        style={{ flex: '1 1 auto' }}
                      >
                        <I.Edit /> Edit
                      </button>
                      {!payment || payment.status === 'unpaid' ? (
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={(e) => { e.stopPropagation(); onMarkPaid(student, payment); }}
                          title="Mark as Paid"
                          style={{ flex: '1 1 auto', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                        >
                          ✓ Paid
                        </button>
                      ) : (
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={(e) => { e.stopPropagation(); onSendReminder(student); }}
                          title="Send Message"
                          style={{ flex: '1 1 auto' }}
                        >
                          💬 Message
                        </button>
                      )}
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={(e) => { e.stopPropagation(); onDeleteStudent(student); }}
                        title="Remove Student"
                        style={{ padding: '6px 8px' }}
                      >
                        <I.Trash />
                      </button>
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
};

export default BatchDetails;