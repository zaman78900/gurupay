/**
 * Audit Log Model
 * Tracks payment history and changes
 */

export const createAuditLog = (data = {}) => ({
  id: data.id || "",
  paymentId: data.paymentId || "",
  studentId: data.studentId || "",
  action: data.action || "", // paid, marked_late, discount_applied, late_fee_added, refund, etc.
  previousValue: data.previousValue || null,
  newValue: data.newValue || null,
  amount: data.amount || 0,
  changedBy: data.changedBy || "",
  remarks: data.remarks || "",
  timestamp: data.timestamp || new Date().toISOString(),
  createdAt: data.createdAt || new Date().toISOString(),
});

export const validateAuditLog = (log) => {
  const errors = [];

  if (!log.paymentId || log.paymentId.trim() === "") {
    errors.push("Payment ID is required");
  }

  if (!log.action || log.action.trim() === "") {
    errors.push("Action is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getActionDisplay = (action) => {
  const actionConfig = {
    paid: { label: "Payment Received", icon: "✓", color: "#10B981" }, // Green
    marked_late: { label: "Marked Late", icon: "⏱", color: "#F59E0B" }, // Amber
    discount_applied: { label: "Discount Applied", icon: "🏷️", color: "#3B82F6" }, // Blue
    late_fee_added: { label: "Late Fee Added", icon: "!", color: "#EF4444" }, // Red
    refund: { label: "Refund Issued", icon: "↩️", color: "#8B5CF6" }, // Purple
    payment_scheduled: { label: "Payment Scheduled", icon: "📅", color: "#10B981" }, // Green
    reminder_sent: { label: "Reminder Sent", icon: "💬", color: "#3B82F6" }, // Blue
    status_changed: { label: "Status Changed", icon: "↔️", color: "#6B7280" }, // Gray
  };

  return actionConfig[action] || { label: action, icon: "•", color: "#6B7280" };
};

export const getPaymentHistory = (payments, auditLogs) => {
  const history = [];

  payments.forEach((payment) => {
    // Add payment creation event
    history.push({
      type: "payment_created",
      action: "Payment Created",
      paymentId: payment.id,
      studentId: payment.studentId,
      amount: payment.amount,
      timestamp: payment.createdAt,
      icon: "📋",
      color: "#6B7280",
      details: `Payment of ₹${payment.amount} created for ${payment.month}`,
    });

    // Add status change event
    if (payment.status === "paid" && payment.paidOn) {
      history.push({
        type: "payment_marked_paid",
        action: "Payment Marked Paid",
        paymentId: payment.id,
        studentId: payment.studentId,
        amount: payment.amount,
        timestamp: payment.paidAt || payment.createdAt,
        icon: "✓",
        color: "#10B981",
        details: `Payment marked as paid on ${payment.paidOn}`,
      });
    }

    // Add late fee event
    if (payment.lateFee > 0) {
      history.push({
        type: "late_fee_added",
        action: "Late Fee Added",
        paymentId: payment.id,
        studentId: payment.studentId,
        amount: payment.lateFee,
        timestamp: payment.updatedAt,
        icon: "!",
        color: "#EF4444",
        details: `Late fee of ₹${payment.lateFee} added`,
      });
    }

    // Add reminder event
    if (payment.reminderSent && payment.reminderSentAt) {
      history.push({
        type: "reminder_sent",
        action: "Reminder Sent",
        paymentId: payment.id,
        studentId: payment.studentId,
        timestamp: payment.reminderSentAt,
        icon: "💬",
        color: "#3B82F6",
        details: "Reminder sent to student/parent",
      });
    }
  });

  // Add audit log entries
  auditLogs.forEach((log) => {
    history.push({
      type: log.action,
      action: getActionDisplay(log.action).label,
      paymentId: log.paymentId,
      studentId: log.studentId,
      amount: log.amount,
      timestamp: log.timestamp,
      icon: getActionDisplay(log.action).icon,
      color: getActionDisplay(log.action).color,
      details: log.remarks || "",
    });
  });

  // Sort by timestamp, newest first
  return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

export const filterHistoryByStudent = (history, studentId) => {
  return history.filter((entry) => entry.studentId === studentId);
};

export const filterHistoryByPayment = (history, paymentId) => {
  return history.filter((entry) => entry.paymentId === paymentId);
};

export const filterHistoryByDateRange = (history, startDate, endDate) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return history.filter((entry) => {
    const timestamp = new Date(entry.timestamp).getTime();
    return timestamp >= start && timestamp <= end;
  });
};

export const getHistorySummary = (history) => {
  const summary = {
    total: history.length,
    byAction: {},
    byStudent: {},
    totalAmountProcessed: 0,
  };

  history.forEach((entry) => {
    // Count by action
    summary.byAction[entry.type] = (summary.byAction[entry.type] || 0) + 1;

    // Count by student
    summary.byStudent[entry.studentId] =
      (summary.byStudent[entry.studentId] || 0) + 1;

    // Total amount
    if (entry.amount) {
      summary.totalAmountProcessed += entry.amount;
    }
  });

  return summary;
};

export const AuditLog = {
  create: createAuditLog,
  validate: validateAuditLog,
  getActionDisplay,
  getPaymentHistory,
  filterByStudent: filterHistoryByStudent,
  filterByPayment: filterHistoryByPayment,
  filterByDateRange: filterHistoryByDateRange,
  getSummary: getHistorySummary,
};
