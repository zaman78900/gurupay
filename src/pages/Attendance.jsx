import { useState, useEffect } from "react";
import { Attendance } from "../models/Attendance";

export default function AttendancePage({ batches, students, attendanceData, onAddAttendance, onUpdateAttendance }) {
  const [selectedBatch, setSelectedBatch] = useState(batches[0]?.id || "");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [summaries, setSummaries] = useState({});

  const batchStudents = students.filter((s) => s.batchId === selectedBatch);

  useEffect(() => {
    // Initialize attendance records for the day
    const records = {};
    batchStudents.forEach((student) => {
      const key = `${student.id}-${selectedDate}`;
      records[student.id] =
        attendanceData.find((a) => a.studentId === student.id && a.date === selectedDate)?.status || "present";
    });
    setAttendanceRecords(records);

    // Calculate summaries for each student
    const newSummaries = {};
    batchStudents.forEach((student) => {
      const studentRecords = attendanceData.filter((a) => a.studentId === student.id);
      const summary = Attendance.getSummary(studentRecords);
      newSummaries[student.id] = summary;
    });
    setSummaries(newSummaries);
  }, [selectedBatch, selectedDate, attendanceData, batchStudents]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = () => {
    batchStudents.forEach((student) => {
      const record = Attendance.create({
        studentId: student.id,
        batchId: selectedBatch,
        date: selectedDate,
        status: attendanceRecords[student.id],
      });

      const validation = Attendance.validate(record);
      if (validation.isValid) {
        onAddAttendance(record);
      }
    });

    alert("Attendance saved successfully!");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 1.5rem 0", color: "#111" }}>📋 Attendance Tracking</h1>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
              Select Batch
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              style={{
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "1rem",
                fontFamily: "inherit",
              }}
            >
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "1rem",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {batchStudents.map((student) => {
          const summary = summaries[student.id] || {};
          return (
            <div
              key={student.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "1.5rem",
                backgroundColor: "#fff",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ margin: "0 0 0.5rem 0", color: "#111" }}>{student.name}</h3>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#6B7280" }}>Roll: {student.rollNumber}</p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.875rem", color: "#374151" }}>
                  Status
                </label>
                <select
                  value={attendanceRecords[student.id] || "present"}
                  onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                  }}
                >
                  <option value="present">✓ Present</option>
                  <option value="absent">✕ Absent</option>
                  <option value="late">⏱ Late</option>
                  <option value="excused">● Excused</option>
                </select>
              </div>

              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "6px",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "0.5rem" }}>
                  Total Classes: {summary.total}
                </div>
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: summary.statusColor,
                  }}
                >
                  {summary.percentage}%
                </div>
                <div style={{ fontSize: "0.750rem", color: "#9CA3AF", marginTop: "0.25rem" }}>
                  {summary.status} Attendance
                </div>
              </div>

              {!summary.isGood && (
                <div
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "#FEF2F2",
                    borderLeft: "3px solid #EF4444",
                    fontSize: "0.75rem",
                    color: "#991B1B",
                  }}
                >
                  ⚠️ {summary.warningMessage}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "right" }}>
        <button
          onClick={handleSaveAttendance}
          style={{
            padding: "0.75rem 2rem",
            backgroundColor: "#059669",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background-color 0.3s",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#047857")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#059669")}
        >
          💾 Save Attendance
        </button>
      </div>
    </div>
  );
}
