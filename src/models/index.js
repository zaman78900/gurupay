/**
 * Models Index
 * Centralized exports for all data models
 */

// Core Models
export { Batch, createBatch, validateBatch, calculateBatchAmount } from "./Batch";
export {
  Student,
  createStudent,
  validateStudent,
  getStudentStatus,
} from "./Student";
export {
  Payment,
  createPayment,
  validatePayment,
  getPaymentStatus,
  calculateDaysUntilDue,
  getDueDateDisplay,
  calculateTotalAmount,
} from "./Payment";
export {
  Installment,
  createInstallment,
  validateInstallment,
  getInstallmentStatus,
  calculateInstallmentProgress,
  getRemainingAmount,
} from "./Installment";
export {
  Profile,
  createProfile,
  validateProfile,
  getProfileDisplay,
  isProfileComplete,
} from "./Profile";
export {
  Settings,
  createSettings,
  validateSettings,
  getSettingsDisplay,
  toggleSetting,
  updateSettings,
  resetSettingsToDefaults,
} from "./Settings";

// Feature Models
export {
  Attendance,
  createAttendance,
  validateAttendance,
  getAttendanceStatus,
  calculateAttendancePercentage,
  getAttendanceStats,
  getAttendanceSummary,
} from "./Attendance";
export {
  RevenueReport,
  calculateMonthlyRevenue,
  calculateBatchRevenue,
  calculateTotalRevenue,
  getRevenueStats,
  getYearlyTrend,
  getRevenueGrowthRate,
} from "./RevenueReport";
export {
  AuditLog,
  createAuditLog,
  validateAuditLog,
  getActionDisplay,
  getPaymentHistory,
  filterHistoryByStudent,
  filterHistoryByPayment,
  filterHistoryByDateRange,
  getHistorySummary,
} from "./AuditLog";
