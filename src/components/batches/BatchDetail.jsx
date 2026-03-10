import React, { useState, useMemo } from 'react';
import { I } from '../../App';
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
            <div className="card-subtitle">Manage students in {batch.name}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  {mode === 'list' ? 'List View' : 'Grid View'}
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={onAddStudent}>
              <I.Plus /> Add Student
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: '1 1 300px' }}>
            <I.Search />
            <input 
              className="input" 
              style={{ paddingLeft: '34px' }}
              placeholder="Search students by name or phone..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="month-sel" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Sort by Name</option>
            <option value="phone">Sort by Phone</option>
            <option value="joiningDate">Sort by Joining Date</option>
            <option value="status">Sort by Status</option>
          </select>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>

        {/* Students List/Grid */}
        {viewMode === 'list' ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll #</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Joining Date</th>
                  <th>Discount</th>
                  <th>Student Status</th>
                  <th>Fee Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batchStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7">
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
                    
                    return (
                      <tr key={student.id}>
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
                        <td>
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
          <div className="grid-3">
            {batchStudents.map(student => {
              const payment = getPaymentStatus(student.id);
              
              return (
                <div key={student.id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text4)', marginBottom: '4px' }}>
                        Roll #: {student.rollNumber || '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text4)' }}>
                        📱 {student.phone}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text4)' }}>
                        Status: {student.status || 'Active'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="btn btn-ghost btn-icon btn-sm" 
                        onClick={() => onEditStudent(student)}
                      >
                        <I.Edit />
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => onDeleteStudent(student)}
                      >
                        <I.Trash />
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text4)', marginBottom: '4px' }}>
                      Joining Date: {fmtDate(student.joiningDate)}
                    </div>
                    {student.email && (
                      <div style={{ fontSize: '12px', color: 'var(--text4)', marginBottom: '4px' }}>
                        📧 {student.email}
                      </div>
                    )}
                    {student.discount > 0 && (
                      <div className="badge badge-discount" style={{ marginBottom: '4px' }}>
                        Discount: – {fmtINR(student.discount)}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    {payment ? (
                      <span className={`badge ${getStatusBadge(payment.status)}`}>
                        {payment.status === 'paid' ? '✓ Paid' : 
                         payment.status === 'waived' ? '🔵 Waived' : 
                         '⏳ Unpaid'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text4)' }}>Not Generated</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {!payment || payment.status === 'unpaid' ? (
                      <>
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => onMarkPaid(student, payment)}
                        >
                          <I.Check /> Mark Paid
                        </button>
                        <button 
                          className="btn btn-wa btn-sm" 
                          onClick={() => onSendReminder(student)}
                        >
                          <I.WA /> Reminder
                        </button>
                        <button 
                          className="btn btn-amber btn-sm" 
                          onClick={() => onWaiveFee(student, payment)}
                        >
                          <I.Waive /> Waive
                        </button>
                      </>
                    ) : (
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => onSendReminder(student)}
                      >
                        <I.WA /> Send Message
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchDetails;