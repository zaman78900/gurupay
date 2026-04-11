/**
 * Installment Model
 * Represents an installment for split payments
 */

export const createInstallment = (data = {}) => ({
  id: data.id || "",
  paymentId: data.paymentId || "",
  installmentNumber: data.installmentNumber || 1,
  amount: data.amount || 0,
  dueDate: data.dueDate || null,
  status: data.status || "unpaid", // unpaid, paid, partial, overdue
  paidAmount: data.paidAmount || 0,
  paidOn: data.paidOn || null,
  paidAt: data.paidAt || null,
  notes: data.notes || "",
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString(),
});

export const validateInstallment = (installment) => {
  const errors = [];

  if (!installment.paymentId || installment.paymentId.trim() === "") {
    errors.push("Payment ID is required");
  }

  if (installment.installmentNumber < 1) {
    errors.push("Installment number must be at least 1");
  }

  if (installment.amount < 0) {
    errors.push("Amount must be non-negative");
  }

  if (installment.paidAmount < 0) {
    errors.push("Paid amount must be non-negative");
  }

  if (installment.paidAmount > installment.amount) {
    errors.push("Paid amount cannot exceed total amount");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getInstallmentStatus = (installment) => {
  const statusConfig = {
    paid: { label: "Paid", color: "#10B981", icon: "✓" }, // Green
    unpaid: { label: "Unpaid", color: "#EF4444", icon: "✕" }, // Red
    partial: { label: "Partial", color: "#F59E0B", icon: "◐" }, // Amber
    overdue: { label: "Overdue", color: "#DC2626", icon: "!" }, // Dark Red
  };

  return statusConfig[installment.status] || statusConfig.unpaid;
};

export const calculateInstallmentProgress = (installment) => {
  const percentage =
    installment.amount > 0
      ? (installment.paidAmount / installment.amount) * 100
      : 0;
  return Math.min(100, Math.round(percentage));
};

export const calculateDaysUntilDue = (installment) => {
  if (!installment.dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(installment.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const diff = dueDate - today;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return days;
};

export const getDueDateDisplay = (installment) => {
  const days = calculateDaysUntilDue(installment);

  if (days === null) return null;
  if (days === 0) return { label: "Today", color: "#F59E0B" }; // Amber
  if (days > 0)
    return { label: `${days} days until`, color: "#10B981" }; // Green
  if (days === -0) return { label: "Today", color: "#F59E0B" }; // Amber
  return { label: `${Math.abs(days)} days overdue`, color: "#EF4444" }; // Red
};

export const getRemainingAmount = (installment) => {
  return Math.max(0, installment.amount - installment.paidAmount);
};

export const Installment = {
  create: createInstallment,
  validate: validateInstallment,
  getStatus: getInstallmentStatus,
  calculateProgress: calculateInstallmentProgress,
  calculateDaysUntilDue,
  getDueDateDisplay,
  getRemainingAmount,
};
