/**
 * Database Enhancement Layer with Model Integration
 * Provides validation and model-based operations
 */

import {
  Batch,
  Student,
  Payment,
  Installment,
  Profile,
  Settings,
} from "../models";

/**
 * Validates and saves a batch with model validation
 */
export async function safeCreateBatch(userId, batchData, dbCreateFn) {
  try {
    const batch = Batch.create(batchData);
    const validation = Batch.validate(batch);

    if (!validation.isValid) {
      return {
        success: false,
        error: {
          message: "Batch validation failed",
          errors: validation.errors,
        },
      };
    }

    const result = await dbCreateFn(userId, batch);
    return {
      success: !result.error,
      data: result.data,
      error: result.error,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err.message },
    };
  }
}

/**
 * Validates and saves a student with model validation
 */
export async function safeCreateStudent(userId, studentData, dbCreateFn) {
  try {
    const student = Student.create(studentData);
    const validation = Student.validate(student);

    if (!validation.isValid) {
      return {
        success: false,
        error: {
          message: "Student validation failed",
          errors: validation.errors,
        },
      };
    }

    const result = await dbCreateFn(userId, student);
    return {
      success: !result.error,
      data: result.data,
      error: result.error,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err.message },
    };
  }
}

/**
 * Validates and saves a payment with model validation
 */
export async function safeCreatePayment(userId, paymentData, dbCreateFn) {
  try {
    const payment = Payment.create(paymentData);
    const validation = Payment.validate(payment);

    if (!validation.isValid) {
      return {
        success: false,
        error: {
          message: "Payment validation failed",
          errors: validation.errors,
        },
      };
    }

    const result = await dbCreateFn(userId, payment);
    return {
      success: !result.error,
      data: result.data,
      error: result.error,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err.message },
    };
  }
}

/**
 * Validates and saves an installment with model validation
 */
export async function safeCreateInstallment(
  userId,
  installmentData,
  dbCreateFn
) {
  try {
    const installment = Installment.create(installmentData);
    const validation = Installment.validate(installment);

    if (!validation.isValid) {
      return {
        success: false,
        error: {
          message: "Installment validation failed",
          errors: validation.errors,
        },
      };
    }

    const result = await dbCreateFn(userId, installment);
    return {
      success: !result.error,
      data: result.data,
      error: result.error,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err.message },
    };
  }
}

/**
 * Validates and saves a profile with model validation
 */
export async function safeCreateProfile(profileData, dbSaveFn) {
  try {
    const profile = Profile.create(profileData);
    const validation = Profile.validate(profile);

    if (!validation.isValid) {
      return {
        success: false,
        error: {
          message: "Profile validation failed",
          errors: validation.errors,
        },
      };
    }

    const result = await dbSaveFn(profile);
    return {
      success: !result.error,
      data: result.data,
      error: result.error,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err.message },
    };
  }
}

/**
 * Validates and saves settings with model validation
 */
export async function safeCreateSettings(settingsData, dbSaveFn) {
  try {
    const settings = Settings.create(settingsData);
    const validation = Settings.validate(settings);

    if (!validation.isValid) {
      return {
        success: false,
        error: {
          message: "Settings validation failed",
          errors: validation.errors,
        },
      };
    }

    const result = await dbSaveFn(settings);
    return {
      success: !result.error,
      data: result.data,
      error: result.error,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err.message },
    };
  }
}

/**
 * Enriches database records with model display data
 */
export function enrichPayments(payments) {
  return payments.map((p) => ({
    ...p,
    statusDisplay: Payment.getStatus(p),
    daysUntilDue: Payment.calculateDaysUntilDue(p),
    dueDateDisplay: Payment.getDueDateDisplay(p),
    totalAmount: Payment.calculateTotalAmount(p, true),
  }));
}

export function enrichStudents(students) {
  return students.map((s) => ({
    ...s,
    statusDisplay: Student.getStatus(s),
  }));
}

export function enrichInstallments(installments) {
  return installments.map((i) => ({
    ...i,
    statusDisplay: Installment.getStatus(i),
    progress: Installment.calculateProgress(i),
    remaining: Installment.getRemainingAmount(i),
    daysUntilDue: Installment.calculateDaysUntilDue(i),
  }));
}

export function enrichBatches(batches) {
  return batches.map((b) => ({
    ...b,
    amounts: Batch.calculateAmount(b),
  }));
}

/**
 * Bulk validation before batch operations
 */
export function validateBatchCreation(batches) {
  const results = { valid: [], errors: {} };

  batches.forEach((batch, idx) => {
    const validation = Batch.validate(batch);
    if (validation.isValid) {
      results.valid.push(batch);
    } else {
      results.errors[idx] = validation.errors;
    }
  });

  return results;
}

export function validateBatchStudents(students) {
  const results = { valid: [], errors: {} };

  students.forEach((student, idx) => {
    const validation = Student.validate(student);
    if (validation.isValid) {
      results.valid.push(student);
    } else {
      results.errors[idx] = validation.errors;
    }
  });

  return results;
}

export function validateBatchPayments(payments) {
  const results = { valid: [], errors: {} };

  payments.forEach((payment, idx) => {
    const validation = Payment.validate(payment);
    if (validation.isValid) {
      results.valid.push(payment);
    } else {
      results.errors[idx] = validation.errors;
    }
  });

  return results;
}

/**
 * Helper to handle database errors with context
 */
export function handleDbError(dbError, operation = "Database operation") {
  const errorMsg = String(dbError?.message || "").toLowerCase();

  if (errorMsg.includes("not authenticated")) {
    return {
      success: false,
      error: { message: "Not authenticated", code: "AUTH_ERROR" },
    };
  }

  if (errorMsg.includes("unique violation")) {
    return {
      success: false,
      error: {
        message: "Duplicate record",
        code: "DUPLICATE_ERROR",
      },
    };
  }

  if (errorMsg.includes("foreign key")) {
    return {
      success: false,
      error: {
        message: "Invalid reference",
        code: "REF_ERROR",
      },
    };
  }

  return {
    success: false,
    error: {
      message: `${operation} failed: ${dbError?.message}`,
      code: "DB_ERROR",
    },
  };
}

export default {
  // Safe Creation Functions
  safeCreateBatch,
  safeCreateStudent,
  safeCreatePayment,
  safeCreateInstallment,
  safeCreateProfile,
  safeCreateSettings,

  // Enrichment Functions
  enrichPayments,
  enrichStudents,
  enrichInstallments,
  enrichBatches,

  // Validation Functions
  validateBatchCreation,
  validateBatchStudents,
  validateBatchPayments,

  // Error Handling
  handleDbError,
};
