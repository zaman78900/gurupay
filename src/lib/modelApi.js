/**
 * API Utilities for Model Operations
 * Provides validation, transformation, and error handling for API calls
 */

import {
  Batch,
  Student,
  Payment,
  Installment,
  Profile,
  Settings,
  Attendance,
  RevenueReport,
  AuditLog,
} from "../models";

/**
 * Response wrapper for API operations
 */
export const createResponse = (success, data = null, error = null) => ({
  success,
  data,
  error,
  timestamp: new Date().toISOString(),
});

// ═══════════════════════════════════════════════════════════════════════════
// BATCH API UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const validateAndCreateBatch = (batchData) => {
  try {
    const batch = Batch.create(batchData);
    const validation = Batch.validate(batch);

    if (!validation.isValid) {
      return createResponse(false, null, {
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    return createResponse(true, batch);
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

export const calculateBatchDetails = (batch) => {
  try {
    const amount = Batch.calculateAmount(batch);
    return createResponse(true, {
      batch,
      ...amount,
    });
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT API UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const validateAndCreateStudent = (studentData) => {
  try {
    const student = Student.create(studentData);
    const validation = Student.validate(student);

    if (!validation.isValid) {
      return createResponse(false, null, {
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    return createResponse(true, student);
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

export const getStudentWithStatus = (student) => {
  try {
    const status = Student.getStatus(student);
    return createResponse(true, { ...student, statusDisplay: status });
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT API UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const validateAndCreatePayment = (paymentData) => {
  try {
    const payment = Payment.create(paymentData);
    const validation = Payment.validate(payment);

    if (!validation.isValid) {
      return createResponse(false, null, {
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    return createResponse(true, payment);
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

export const getPaymentWithDetails = (payment) => {
  try {
    const status = Payment.getStatus(payment);
    const daysUntilDue = Payment.calculateDaysUntilDue(payment);
    const dueDateDisplay = Payment.getDueDateDisplay(payment);
    const totalAmount = Payment.calculateTotalAmount(payment, true);

    return createResponse(true, {
      ...payment,
      statusDisplay: status,
      daysUntilDue,
      dueDateDisplay,
      totalAmount,
    });
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

export const getPaymentsList = (payments) => {
  try {
    const enhanced = payments.map((p) => {
      const status = Payment.getStatus(p);
      const daysUntilDue = Payment.calculateDaysUntilDue(p);
      const dueDateDisplay = Payment.getDueDateDisplay(p);
      return {
        ...p,
        statusDisplay: status,
        daysUntilDue,
        dueDateDisplay,
      };
    });
    return createResponse(true, enhanced);
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// INSTALLMENT API UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const validateAndCreateInstallment = (installmentData) => {
  try {
    const installment = Installment.create(installmentData);
    const validation = Installment.validate(installment);

    if (!validation.isValid) {
      return createResponse(false, null, {
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    return createResponse(true, installment);
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

export const getInstallmentWithDetails = (installment) => {
  try {
    const status = Installment.getStatus(installment);
    const progress = Installment.calculateProgress(installment);
    const remaining = Installment.getRemainingAmount(installment);
    const daysUntilDue = Installment.calculateDaysUntilDue(installment);

    return createResponse(true, {
      ...installment,
      statusDisplay: status,
      progress,
      remaining,
      daysUntilDue,
    });
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ATTENDANCE API UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const validateAndCreateAttendance = (attendanceData) => {
  try {
    const attendance = Attendance.create(attendanceData);
    const validation = Attendance.validate(attendance);

    if (!validation.isValid) {
      return createResponse(false, null, {
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    return createResponse(true, attendance);
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

export const getStudentAttendanceStats = (
  studentId,
  attendanceRecords,
  minRequired = 75
) => {
  try {
    const studentRecords = attendanceRecords.filter(
      (a) => a.studentId === studentId
    );
    const stats = Attendance.getStats(studentRecords);
    const summary = Attendance.getSummary(studentRecords, minRequired);

    return createResponse(true, { stats, summary });
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// REVENUE REPORT API UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const getRevenueAnalytics = (payments, batches, students) => {
  try {
    const stats = RevenueReport.getStats(payments, batches, students);
    const monthlyRevenue = RevenueReport.calculateMonthlyRevenue(
      payments,
      batches,
      students
    );
    const batchRevenue = RevenueReport.calculateBatchRevenue(
      payments,
      batches,
      students
    );
    const yearlyTrend = RevenueReport.getYearlyTrend(payments);

    return createResponse(true, {
      stats,
      monthlyRevenue,
      batchRevenue,
      yearlyTrend,
    });
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT HISTORY API UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const getPaymentHistoryForStudent = (
  studentId,
  payments,
  auditLogs = []
) => {
  try {
    const history = AuditLog.getPaymentHistory(payments, auditLogs);
    const studentHistory = AuditLog.filterByStudent(history, studentId);

    return createResponse(true, studentHistory);
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

export const getPaymentHistoryForPayment = (
  paymentId,
  payments,
  auditLogs = []
) => {
  try {
    const history = AuditLog.getPaymentHistory(payments, auditLogs);
    const paymentHistory = AuditLog.filterByPayment(history, paymentId);

    return createResponse(true, paymentHistory);
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE API UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const validateAndCreateProfile = (profileData) => {
  try {
    const profile = Profile.create(profileData);
    const validation = Profile.validate(profile);

    if (!validation.isValid) {
      return createResponse(false, null, {
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    return createResponse(true, profile);
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

export const getProfileStatus = (profile) => {
  try {
    const isComplete = Profile.isComplete(profile);
    const display = Profile.getDisplay(profile);

    return createResponse(true, {
      isComplete,
      display,
      completionPercentage: Object.values(display).filter(
        (v) => v && v !== "Not provided"
      ).length / Object.keys(display).length * 100,
    });
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS API UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const validateAndCreateSettings = (settingsData) => {
  try {
    const settings = Settings.create(settingsData);
    const validation = Settings.validate(settings);

    if (!validation.isValid) {
      return createResponse(false, null, {
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    return createResponse(true, settings);
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

export const updateSettingsSafely = (currentSettings, updates) => {
  try {
    const updated = Settings.update(currentSettings, updates);
    const validation = Settings.validate(updated);

    if (!validation.isValid) {
      return createResponse(false, null, {
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    return createResponse(true, updated);
  } catch (err) {
    return createResponse(false, null, { message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// BULK OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const bulkValidatePayments = (payments) => {
  const results = {
    valid: [],
    invalid: [],
  };

  payments.forEach((payment) => {
    const validation = Payment.validate(payment);
    if (validation.isValid) {
      results.valid.push(payment);
    } else {
      results.invalid.push({
        payment,
        errors: validation.errors,
      });
    }
  });

  return createResponse(true, results);
};

export const bulkValidateStudents = (students) => {
  const results = {
    valid: [],
    invalid: [],
  };

  students.forEach((student) => {
    const validation = Student.validate(student);
    if (validation.isValid) {
      results.valid.push(student);
    } else {
      results.invalid.push({
        student,
        errors: validation.errors,
      });
    }
  });

  return createResponse(true, results);
};

export default {
  // Response
  createResponse,

  // Batch
  validateAndCreateBatch,
  calculateBatchDetails,

  // Student
  validateAndCreateStudent,
  getStudentWithStatus,

  // Payment
  validateAndCreatePayment,
  getPaymentWithDetails,
  getPaymentsList,

  // Installment
  validateAndCreateInstallment,
  getInstallmentWithDetails,

  // Attendance
  validateAndCreateAttendance,
  getStudentAttendanceStats,

  // Revenue
  getRevenueAnalytics,

  // History
  getPaymentHistoryForStudent,
  getPaymentHistoryForPayment,

  // Profile
  validateAndCreateProfile,
  getProfileStatus,

  // Settings
  validateAndCreateSettings,
  updateSettingsSafely,

  // Bulk
  bulkValidatePayments,
  bulkValidateStudents,
};
