/**
 * Batch Model
 * Represents a batch/class entity
 */

export const createBatch = (data = {}) => ({
  id: data.id || "",
  name: data.name || "",
  subject: data.subject || "",
  timing: data.timing || "", // e.g., "10:00 AM - 12:00 PM"
  fee: data.fee || 0,
  gstRate: data.gstRate || 0,
  capacity: data.capacity || 0,
  color: data.color || "#3B82F6", // Default blue color
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString(),
});

export const validateBatch = (batch) => {
  const errors = [];

  if (!batch.name || batch.name.trim() === "") {
    errors.push("Batch name is required");
  }

  if (batch.fee < 0) {
    errors.push("Fee must be non-negative");
  }

  if (batch.gstRate < 0 || batch.gstRate > 100) {
    errors.push("GST rate must be between 0 and 100");
  }

  if (batch.capacity < 0) {
    errors.push("Capacity must be non-negative");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const calculateBatchAmount = (batch) => {
  const baseAmount = batch.fee;
  const gstAmount = (baseAmount * batch.gstRate) / 100;
  return {
    base: baseAmount,
    gst: Math.round(gstAmount),
    total: Math.round(baseAmount + gstAmount),
  };
};

export const Batch = {
  create: createBatch,
  validate: validateBatch,
  calculateAmount: calculateBatchAmount,
};
