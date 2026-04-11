/**
 * Student Model
 * Represents a student entity
 */

export const createStudent = (data = {}) => ({
  id: data.id || "",
  rollNumber: data.rollNumber || "",
  status: data.status || "Active", // Active, Inactive, Graduated, etc.
  name: data.name || "",
  phone: data.phone || "",
  email: data.email || "",
  batchId: data.batchId || null,
  joiningDate: data.joiningDate || new Date().toISOString().split("T")[0],
  notes: data.notes || "",
  discount: data.discount || 0,
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString(),
});

export const validateStudent = (student) => {
  const errors = [];

  if (!student.name || student.name.trim() === "") {
    errors.push("Student name is required");
  }

  if (!student.phone || student.phone.trim() === "") {
    errors.push("Phone number is required");
  }

  // Basic phone validation (at least 10 digits)
  if (student.phone && !/\d{10}/.test(student.phone.replace(/\D/g, ""))) {
    errors.push("Phone number must have at least 10 digits");
  }

  if (student.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    errors.push("Invalid email format");
  }

  if (student.discount < 0 || student.discount > 100) {
    errors.push("Discount must be between 0 and 100");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getStudentStatus = (student) => {
  const statusColors = {
    Active: "#10B981", // Green
    Inactive: "#6B7280", // Gray
    Graduated: "#8B5CF6", // Purple
    Suspended: "#EF4444", // Red
  };

  return {
    label: student.status,
    color: statusColors[student.status] || "#6B7280",
  };
};

export const Student = {
  create: createStudent,
  validate: validateStudent,
  getStatus: getStudentStatus,
};
