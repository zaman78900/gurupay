/**
 * Attendance Model
 * Represents student attendance records
 */

export const createAttendance = (data = {}) => ({
  id: data.id || "",
  studentId: data.studentId || "",
  batchId: data.batchId || "",
  date: data.date || new Date().toISOString().split("T")[0],
  status: data.status || "present", // present, absent, late, excused
  remarks: data.remarks || "",
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString(),
});

export const validateAttendance = (attendance) => {
  const errors = [];

  if (!attendance.studentId || attendance.studentId.trim() === "") {
    errors.push("Student ID is required");
  }

  if (!attendance.batchId || attendance.batchId.trim() === "") {
    errors.push("Batch ID is required");
  }

  if (!attendance.date) {
    errors.push("Date is required");
  }

  const validStatuses = ["present", "absent", "late", "excused"];
  if (!validStatuses.includes(attendance.status)) {
    errors.push("Invalid attendance status");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getAttendanceStatus = (attendance) => {
  const statusConfig = {
    present: { label: "Present", color: "#10B981", icon: "✓" }, // Green
    absent: { label: "Absent", color: "#EF4444", icon: "✕" }, // Red
    late: { label: "Late", color: "#F59E0B", icon: "⏱" }, // Amber
    excused: { label: "Excused", color: "#8B5CF6", icon: "●" }, // Purple
  };

  return statusConfig[attendance.status] || statusConfig.present;
};

export const calculateAttendancePercentage = (
  totalClasses,
  presentClasses
) => {
  if (totalClasses === 0) return 0;
  return Math.round((presentClasses / totalClasses) * 100);
};

export const getAttendanceStats = (attendanceRecords) => {
  const stats = {
    total: attendanceRecords.length,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    percentage: 0,
  };

  attendanceRecords.forEach((record) => {
    switch (record.status) {
      case "present":
        stats.present++;
        break;
      case "absent":
        stats.absent++;
        break;
      case "late":
        stats.late++;
        break;
      case "excused":
        stats.excused++;
        break;
      default:
        break;
    }
  });

  stats.percentage = calculateAttendancePercentage(
    stats.total,
    stats.present + stats.late
  );
  return stats;
};

export const getAttendanceSummary = (attendanceRecords, minRequired = 75) => {
  const stats = getAttendanceStats(attendanceRecords);
  const isGood = stats.percentage >= minRequired;

  return {
    ...stats,
    isGood,
    status: isGood ? "Good" : "Poor",
    statusColor: isGood ? "#10B981" : "#EF4444",
    warningMessage: !isGood
      ? `Attendance is ${stats.percentage}%. Minimum ${minRequired}% required.`
      : `Great attendance! ${stats.percentage}% achieved.`,
  };
};

export const Attendance = {
  create: createAttendance,
  validate: validateAttendance,
  getStatus: getAttendanceStatus,
  calculatePercentage: calculateAttendancePercentage,
  getStats: getAttendanceStats,
  getSummary: getAttendanceSummary,
};
