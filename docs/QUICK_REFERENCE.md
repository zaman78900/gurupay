# Quick Reference Guide - GuruPay Models

## 🚀 Import Everything

```javascript
// All core models
import {
  Batch, Student, Payment, Installment, Profile, Settings,
  Attendance, RevenueReport, AuditLog
} from '@/models';

// API utilities
import ModelApi from '@/lib/modelApi';

// Database enhancements
import DbEnhancements from '@/lib/dbEnhancements';
```

---

## Core Models Usage

### 1. Batch Model
```javascript
const batch = Batch.create({ name: "Class 10A", fee: 10000 });
const { isValid, errors } = Batch.validate(batch);
const { base, gst, total } = Batch.calculateAmount(batch);
```

### 2. Student Model
```javascript
const student = Student.create({ name: "John", phone: "98765..." });
const validation = Student.validate(student);
const { label, color } = Student.getStatus(student);
```

### 3. Payment Model
```javascript
const payment = Payment.create({ studentId, month, amount });
const validation = Payment.validate(payment);
const status = Payment.getStatus(payment);
const days = Payment.calculateDaysUntilDue(payment);
const display = Payment.getDueDateDisplay(payment);
const total = Payment.calculateTotalAmount(payment, true);
```

### 4. Installment Model
```javascript
const inst = Installment.create({ paymentId, amount, installmentNumber });
const validation = Installment.validate(inst);
const progress = Installment.calculateProgress(inst); // 0-100%
const remaining = Installment.getRemainingAmount(inst);
```

### 5. Attendance Model
```javascript
const att = Attendance.create({ studentId, date, status: "present" });
const stats = Attendance.getStats(records);
const summary = Attendance.getSummary(records, 75); // 75% min
```

### 6. Revenue Report Model
```javascript
const stats = RevenueReport.getStats(payments, batches, students);
const monthly = RevenueReport.calculateMonthlyRevenue(payments, batches, students);
const byBatch = RevenueReport.calculateBatchRevenue(payments, batches, students);
const yearly = RevenueReport.getYearlyTrend(payments);
```

### 7. Audit Log Model
```javascript
const history = AuditLog.getPaymentHistory(payments, auditLogs);
const filtered = AuditLog.filterByStudent(history, studentId);
const summary = AuditLog.getSummary(history);
```

---

## API Utilities (modelApi.js)

### Safe Creation
```javascript
const result = ModelApi.validateAndCreatePayment(data);
// Returns: { success, data, error, timestamp }

if (result.success) {
  // Use result.data
} else {
  console.error(result.error.errors);
}
```

### Get Details with Calculations
```javascript
const payment = ModelApi.getPaymentWithDetails(payment);
// Adds: statusDisplay, daysUntilDue, dueDateDisplay, totalAmount

const student = ModelApi.getStudentWithStatus(student);
// Adds: statusDisplay
```

### Analytics
```javascript
const analytics = ModelApi.getRevenueAnalytics(payments, batches, students);
// Returns: { stats, monthlyRevenue, batchRevenue, yearlyTrend }
```

### Payment History
```javascript
const history = ModelApi.getPaymentHistoryForStudent(studentId, payments);
// Returns filtered history timeline
```

---

## Database Enhancements (dbEnhancements.js)

### Safe Create with Validation
```javascript
const result = await DbEnhancements.safeCreatePayment(
  userId,
  paymentData,
  createPayment  // db function
);
```

### Enrich Records with Display Data
```javascript
const enriched = DbEnhancements.enrichPayments(payments);
// Adds for each payment: statusDisplay, daysUntilDue, dueDateDisplay, totalAmount

const enriched = DbEnhancements.enrichInstallments(installments);
// Adds: statusDisplay, progress, remaining, daysUntilDue
```

### Batch Validation
```javascript
const result = DbEnhancements.validateBatchPayments(payments);
// Returns: { valid: [], errors: { 0: ["error1"], 1: ["error2"] } }
```

---

## Page Components

### Attendance Page
```jsx
import AttendancePage from '@/pages/Attendance';

<AttendancePage
  batches={batches}
  students={students}
  attendanceData={attendanceData}
  onAddAttendance={(record) => {}}
/>
```

### Reports Page
```jsx
import ReportsPage from '@/pages/Reports';

<ReportsPage
  payments={payments}
  batches={batches}
  students={students}
/>
```

### Payment History Page
```jsx
import PaymentHistoryPage from '@/pages/PaymentHistory';

<PaymentHistoryPage
  payments={payments}
  students={students}
  auditLogs={auditLogs}
/>
```

---

## Common Patterns

### Create and Validate (One-Liner)
```javascript
const { success, data, error } = ModelApi.validateAndCreatePayment(form);
```

### Bulk Operations
```javascript
const result = ModelApi.bulkValidatePayments(payments);
console.log(`Valid: ${result.data.valid.length}, Invalid: ${result.data.invalid.length}`);
```

### Filter History
```javascript
const history = AuditLog.getPaymentHistory(payments, logs);
const studentHistory = AuditLog.filterByStudent(history, id);
const byDate = AuditLog.filterByDateRange(studentHistory, start, end);
```

### Get Statistics
```javascript
const { stats, summary } = await ModelApi.getStudentAttendanceStats(
  studentId,
  attendanceRecords
);
console.log(`Attendance: ${summary.percentage}%, Status: ${summary.status}`);
```

---

## Validation Patterns

### Check Single Field
```javascript
const payment = Payment.create(data);
const { isValid, errors } = Payment.validate(payment);
if (!isValid) errors.forEach(e => console.error(e));
```

### Check Multiple Records
```javascript
const result = ModelApi.bulkValidateStudents(studentList);
console.log(`${result.data.valid.length} valid, ${result.data.invalid.length} invalid`);
result.data.invalid.forEach(({ student, errors }) => {
  console.error(`Student ${student.name}:`, errors);
});
```

---

## Response Format

All API utilities return consistent response:
```javascript
{
  success: boolean,
  data: { /* enriched objects */ },
  error: {
    message: string,
    errors: string[] // from validation
  },
  timestamp: "2024-04-11T..."
}
```

---

## File Locations

```
src/models/
  - Batch.js, Student.js, Payment.js
  - Installment.js, Profile.js, Settings.js
  - Attendance.js, RevenueReport.js, AuditLog.js
  - index.js, README.md, models.test.js

src/lib/
  - modelApi.js (30+ utilities)
  - dbEnhancements.js (safe DB ops)

src/pages/
  - Attendance.jsx
  - Reports.jsx
  - PaymentHistory.jsx
```

---

## Testing

Run tests:
```bash
npm test src/models/models.test.js
```

Tests include:
- Model creation with defaults
- Validation (positive & negative cases)
- Calculations (amounts, percentages, days)
- Helper methods
- Display formatting

---

That's it! Start building with confidence. 🚀
