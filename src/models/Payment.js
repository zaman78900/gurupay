/**
 * Payment Model
 * Represents a payment/fee record
 */

export const createPayment = (data = {}) => ({
  id: data.id || "",
  studentId: data.studentId || "",
  month: data.month || "", // e.g., "January 2024"
  status: data.status || "unpaid", // unpaid, paid, partial, overdue
  amount: data.amount || 0,
  paidOn: data.paidOn || null,
  paidAt: data.paidAt || null,
  lateFee: data.lateFee || 0,
  notes: data.notes || "",
  dueDate: data.dueDate || null,
  parentPaymentId: data.parentPaymentId || null, // For installment parent reference
  reminderScheduledAt: data.reminderScheduledAt || null,
  reminderSent: data.reminderSent || false,
  reminderSentAt: data.reminderSentAt || null,
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString(),
});

export const validatePayment = (payment) => {
  const errors = [];

  if (!payment.studentId || payment.studentId.trim() === "") {
    errors.push("Student ID is required");
  }

  if (!payment.month || payment.month.trim() === "") {
    errors.push("Month/Period is required");
  }

  if (payment.amount < 0) {
    errors.push("Amount must be non-negative");
  }

  if (payment.lateFee < 0) {
    errors.push("Late fee must be non-negative");
  }

  if (payment.dueDate && new Date(payment.dueDate) < new Date()) {
    // Note: This is just a warning, not an error
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getPaymentStatus = (payment) => {
  const statusConfig = {
    paid: { label: "Paid", color: "#10B981", icon: "✓" }, // Green
    unpaid: { label: "Unpaid", color: "#EF4444", icon: "✕" }, // Red
    partial: { label: "Partial", color: "#F59E0B", icon: "◐" }, // Amber
    overdue: { label: "Overdue", color: "#DC2626", icon: "!" }, // Dark Red
  };

  return statusConfig[payment.status] || statusConfig.unpaid;
};

export const calculateDaysUntilDue = (payment) => {
  if (!payment.dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(payment.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const diff = dueDate - today;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return days;
};

export const getDueDateDisplay = (payment) => {
  const days = calculateDaysUntilDue(payment);

  if (days === null) return null;
  if (days === 0) return { label: "Today", color: "#F59E0B" }; // Amber
  if (days > 0)
    return { label: `${days} days until`, color: "#10B981" }; // Green
  if (days === -0) return { label: "Today", color: "#F59E0B" }; // Amber
  return { label: `${Math.abs(days)} days overdue`, color: "#EF4444" }; // Red
};

export const calculateTotalAmount = (payment, includeLateFee = true) => {
  return payment.amount + (includeLateFee ? payment.lateFee : 0);
};

export const Payment = {
  create: createPayment,
  validate: validatePayment,
  getStatus: getPaymentStatus,
  calculateDaysUntilDue,
  getDueDateDisplay,
  calculateTotalAmount,
};
