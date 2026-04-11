# Data Models Documentation

Complete data models for GuruPay fee management application.

## Models Overview

### 1. Batch Model (`Batch.js`)
Represents a class/batch entity.

**Export:**
```javascript
import { createBatch, validateBatch, calculateBatchAmount } from '@/models';
```

**Methods:**
- `createBatch(data)` - Create batch instance
- `validateBatch(batch)` - Validate batch (returns { isValid, errors })
- `calculateBatchAmount(batch)` - Returns { base, gst, total }

**Fields:**
```javascript
{
  id: string,
  name: string,           // Required
  subject: string,
  timing: string,         // e.g., "10:00 AM - 12:00 PM"
  fee: number,           // Required, must be >= 0
  gstRate: number,       // 0-100
  capacity: number,      // >= 0
  color: string,         // Hex color, default: #3B82F6
  createdAt: ISO string,
  updatedAt: ISO string
}
```

---

### 2. Student Model (`Student.js`)
Represents a student entity.

**Export:**
```javascript
import { createStudent, validateStudent, getStudentStatus } from '@/models';
```

**Methods:**
- `createStudent(data)` - Create student instance
- `validateStudent(student)` - Validate student data
- `getStudentStatus(student)` - Returns { label, color }

**Fields:**
```javascript
{
  id: string,
  rollNumber: string,
  status: string,         // Active, Inactive, Graduated, Suspended
  name: string,          // Required
  phone: string,         // Required, 10+ digits
  email: string,         // Optional, must be valid format
  batchId: string,
  joiningDate: date string,
  notes: string,
  discount: number,      // 0-100
  createdAt: ISO string,
  updatedAt: ISO string
}
```

**Status Colors:**
- Active: Green (#10B981)
- Inactive: Gray (#6B7280)
- Graduated: Purple (#8B5CF6)
- Suspended: Red (#EF4444)

---

### 3. Payment Model (`Payment.js`)
Represents a payment/fee record.

**Export:**
```javascript
import {
  createPayment,
  validatePayment,
  getPaymentStatus,
  calculateDaysUntilDue,
  getDueDateDisplay,
  calculateTotalAmount
} from '@/models';
```

**Methods:**
- `createPayment(data)` - Create payment instance
- `validatePayment(payment)` - Validate payment
- `getPaymentStatus(payment)` - Returns { label, color, icon }
- `calculateDaysUntilDue(payment)` - Returns number or null
- `getDueDateDisplay(payment)` - Returns { label, color }
- `calculateTotalAmount(payment, includeLateFee)` - Returns total

**Fields:**
```javascript
{
  id: string,
  studentId: string,     // Required
  month: string,         // Required, e.g., "January 2024"
  status: string,        // unpaid, paid, partial, overdue
  amount: number,        // >= 0
  paidOn: date,
  paidAt: ISO string,
  lateFee: number,       // >= 0
  notes: string,
  dueDate: date,
  parentPaymentId: string, // For installment references
  reminderScheduledAt: ISO string,
  reminderSent: boolean,
  reminderSentAt: ISO string,
  createdAt: ISO string,
  updatedAt: ISO string
}
```

**Status Display:**
- paid: Green checkmark (✓)
- unpaid: Red cross (✕)
- partial: Amber circle (◐)
- overdue: Dark Red (!)

---

### 4. Installment Model (`Installment.js`)
Represents split payment installment.

**Export:**
```javascript
import {
  createInstallment,
  validateInstallment,
  getInstallmentStatus,
  calculateInstallmentProgress,
  calculateDaysUntilDue,
  getDueDateDisplay,
  getRemainingAmount
} from '@/models';
```

**Methods:**
- `createInstallment(data)` - Create installment
- `validateInstallment(installment)` - Validate installment
- `getInstallmentStatus(installment)` - Returns { label, color, icon }
- `calculateInstallmentProgress(installment)` - Returns 0-100 percentage
- `calculateDaysUntilDue(installment)` - Returns days or null
- `getDueDateDisplay(installment)` - Returns { label, color }
- `getRemainingAmount(installment)` - Returns unpaid amount

**Fields:**
```javascript
{
  id: string,
  paymentId: string,        // Required
  installmentNumber: number, // >= 1
  amount: number,           // >= 0
  dueDate: date,
  status: string,           // unpaid, paid, partial, overdue
  paidAmount: number,       // 0 to amount
  paidOn: date,
  paidAt: ISO string,
  notes: string,
  createdAt: ISO string,
  updatedAt: ISO string
}
```

---

### 5. Profile Model (`Profile.js`)
Represents business profile information.

**Export:**
```javascript
import {
  createProfile,
  validateProfile,
  getProfileDisplay,
  isProfileComplete
} from '@/models';
```

**Methods:**
- `createProfile(data)` - Create profile
- `validateProfile(profile)` - Validate business details
- `getProfileDisplay(profile)` - Returns formatted profile object
- `isProfileComplete(profile)` - Returns boolean

**Fields:**
```javascript
{
  id: string,            // User UUID
  name: string,          // Required
  gstin: string,         // 15 chars, alphanumeric (optional)
  address: string,
  phone: string,         // 10+ digits (optional)
  email: string,         // Valid format (optional)
  upiId: string,         // Format: user@upi (optional)
  createdAt: ISO string,
  updatedAt: ISO string
}
```

**Validation Rules:**
- Name: Required, non-empty
- Phone: Must have 10+ digits (if provided)
- Email: Valid email format (if provided)
- GSTIN: 15 alphanumeric characters (if provided)
- UPI ID: username@provider format (if provided)

---

### 6. Settings Model (`Settings.js`)
Represents application settings.

**Export:**
```javascript
import {
  createSettings,
  validateSettings,
  getSettingsDisplay,
  toggleSetting,
  updateSettings,
  resetSettingsToDefaults
} from '@/models';
```

**Methods:**
- `createSettings(data)` - Create settings
- `validateSettings(settings)` - Validate all booleans
- `getSettingsDisplay(settings)` - Returns { key: "Yes/No" }
- `toggleSetting(settings, fieldName)` - Toggle one setting
- `updateSettings(settings, updates)` - Update multiple
- `resetSettingsToDefaults()` - Reset all to defaults

**Fields:**
```javascript
{
  id: string,
  enableGst: boolean,        // Default: true
  enableDiscounts: boolean,  // Default: true
  enableLateFees: boolean,   // Default: true
  enableWhatsApp: boolean,   // Default: true
  csvExport: boolean,        // Default: true
  compactMode: boolean,      // Default: false
  createdAt: ISO string,
  updatedAt: ISO string
}
```

---

## Usage Examples

### Creating and Validating Data

```javascript
import { createBatch, validateBatch, createStudent, validateStudent } from '@/models';

// Batch
const batch = createBatch({
  name: "Class 10A",
  subject: "Mathematics",
  fee: 10000,
  gstRate: 5,
  capacity: 30
});

const { isValid, errors } = validateBatch(batch);
if (!isValid) {
  console.error("Validation errors:", errors);
}

// Student
const student = createStudent({
  name: "John Doe",
  phone: "9876543210",
  email: "john@example.com",
  batchId: batch.id,
  discount: 10
});

const validation = validateStudent(student);
if (!validation.isValid) {
  console.error(validation.errors);
}
```

### Using Helper Methods

```javascript
import { Payment, Installment } from '@/models';

// Payment
const payment = Payment.create({
  studentId: "s1",
  month: "January 2024",
  amount: 10000,
  dueDate: "2024-01-31"
});

const status = Payment.getStatus(payment);     // { label, color, icon }
const daysUntil = Payment.calculateDaysUntilDue(payment); // number
const display = Payment.getDueDateDisplay(payment);       // { label, color }
const total = Payment.calculateTotalAmount(payment, true); // includes lateFee

// Installment
const installment = Installment.create({
  paymentId: "p1",
  installmentNumber: 1,
  amount: 3334
});

const progress = Installment.calculateProgress(installment);     // 0-100
const remaining = Installment.getRemainingAmount(installment);   // unpaid amount
const dueDisplay = Installment.getDueDateDisplay(installment);   // { label, color }
```

### Settings Management

```javascript
import { Settings } from '@/models';

const settings = Settings.create({
  enableGst: true,
  compactMode: false
});

// Toggle a setting
const updated = Settings.toggle(settings, 'compactMode');

// Update multiple settings
const newSettings = Settings.update(settings, {
  enableWhatsApp: false,
  csvExport: true
});

// Reset to defaults
const defaults = Settings.resetToDefaults();

// Get display format
const display = Settings.getDisplay(settings);
// Returns: { "GST Enabled": "Yes", "Compact Mode": "Off", ... }
```

---

## Integration with App Context

Models work seamlessly with the AppContext reducer:

```javascript
// In App.jsx
const batch = createBatch({ name: "Class 10A", fee: 10000 });
const { isValid, errors } = validateBatch(batch);

if (isValid) {
  dispatch({ type: 'ADD_BATCH', payload: batch });
}
```

---

## Notes

- All models are **pure functions** (no side effects)
- All create methods provide sensible defaults
- All validate methods return `{ isValid: boolean, errors: string[] }`
- All display methods return UI-friendly objects
- Date fields use ISO format (YYYY-MM-DD) for dates
- Timestamps use ISO 8601 format
- Models don't interact with Supabase (use `src/lib/database.js` for that)
