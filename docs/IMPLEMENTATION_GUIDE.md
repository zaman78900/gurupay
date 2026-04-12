# GuruPay Implementation Checklist & Guide

## Phase 1: Core Fixes ✅ COMPLETED

### Error Handling & Safety
- [x] Created ErrorBoundary component
- [x] Wrapped app with ErrorBoundary
- [x] Created Toast notification system
- [x] Created Confirmation dialog system
- [x] Improved loading screens
- [x] Improved error screens
- [x] Removed eslint-disable comments
- [x] Fixed import issues

### Code Organization
- [x] Centralized utility functions (commonHelpers.js)
- [x] Centralized icon definitions (Icons.jsx)
- [x] Eliminated duplicate code
- [x] Created skeleton loader components

### Updated Pages
- [x] Batches.jsx - Toast + Confirm integration
- [ ] Fees.jsx - Toast + Confirm integration (Ready to implement)
- [ ] Reports.jsx - Toast + Confirm integration (Ready to implement)
- [ ] Settings.jsx - Toast + Confirm integration (Ready to implement)
- [ ] Dashboard.jsx - Toast + Confirm integration (Ready to implement)

---

## Phase 2: Form Validation & Error Handling

### Form Validation Tasks
```
Location: src/pages/*.jsx

Required validations:
- [ ] Batch creation form (name, subject, timing, fee, gstRate, capacity)
- [ ] Student creation form (name, phone, email, batchId, joiningDate)
- [ ] Payment form (amount, studentId, month, status)
- [ ] Profile form (name, email, phone, gstin, address)

Use helpers from utils/commonHelpers.js:
- isValidEmail()
- isValidPhone()
- isValidGSTIN()

Pattern:
const validate = () => {
  if (!isValidEmail(email)) {
    showError('Invalid email address');
    return false;
  }
  // ... more validation
  return true;
};

if (!validate()) return; // Don't submit
```

### Database Error Handling
```
Location: All database operations in src/pages/*.jsx

Pattern:
try {
  const result = await dbFunction(data);
  if (result.error) {
    showError(result.error.message || 'Database error');
    return;
  }
  showSuccess('Operation successful');
  // ... update state
} catch (error) {
  showError('Operation failed');
  console.error('Error:', error);
}

All files to update:
- [ ] Fees.jsx
- [ ] Reports.jsx
- [ ] Settings.jsx
- [ ] Dashboard.jsx
- [ ] BatchDetails.jsx
- [ ] ReceiptButton.jsx
- [ ] generateReceipt.js (PDF generation)
```

### WhatsApp validation
- [ ] Add isValidPhone() check before sending WhatsApp message
- [ ] Show toast "Invalid phone number" if validation fails
- [ ] File: src/components/fees/ReceiptButton.jsx

---

## Phase 3: UI/UX Polish

### Loading States
- [ ] Add loading state to form submission buttons
- [ ] Add SkeletonLoader while fetching data
- [ ] Add proper disabled state during async operations

### Empty States
- [ ] Dashboard: "No data yet" when no batches/students
- [ ] Batches: "No batches created" (already done)
- [ ] Fees: "No fees to display" when no students
- [ ] Reports: "No data available" when no payments

### Accessibility Improvements
- [ ] Add ARIA labels to buttons
- [ ] Add role="alert" to toast notifications
- [ ] Test keyboard navigation
- [ ] Add color + icon for colorblind accessibility

### Mobile Responsiveness
- [ ] Test on mobile devices
- [ ] Ensure buttons are large enough (44x44px minimum)
- [ ] Check table overflow handling
- [ ] Test touch interactions

---

## Phase 4: Performance & Code Quality

### AppContext Optimization
```javascript
// BEFORE: 5 separate useEffect hooks
useEffect(() => { localStorage.setItem('batches', ...); }, [state.batches]);
useEffect(() => { localStorage.setItem('students', ...); }, [state.students]);
// ... etc

// AFTER: Single effect
useEffect(() => {
  localStorage.setItem('batches', JSON.stringify(state.batches));
  localStorage.setItem('students', JSON.stringify(state.students));
  localStorage.setItem('payments', JSON.stringify(state.payments));
  localStorage.setItem('profile', JSON.stringify(state.businessProfile));
  localStorage.setItem('settings', JSON.stringify(state.settings));
}, [state]); // All state in dependency
```

Tasks:
- [ ] Optimize AppContext localStorage writes
- [ ] Add useMemo to expensive calculations
- [ ] Debounce search inputs (already done in Batches)
- [ ] Add virtualization for 1000+ row tables

### PropTypes Addition
```javascript
import PropTypes from 'prop-types';

ComponentName.propTypes = {
  student: PropTypes.shape({
    id: PropTypes.string.required,
    name: PropTypes.string.required,
    phone: PropTypes.string.required,
  }),
  onDelete: PropTypes.func.required,
};
```

- [ ] Add PropTypes to all components
- [ ] Or migrate to TypeScript (more complex)

---

## Phase 5: Testing & Verification

### Manual Testing Checklist
- [ ] Error boundary catches errors
- [ ] Toast notifications appear and auto-dismiss
- [ ] Confirmation dialogs work for all destructive actions
- [ ] Form validation prevents invalid submissions
- [ ] Database errors show user-friendly messages
- [ ] Empty states display correctly
- [ ] Loading states show during async operations
- [ ] Loading screen on app startup
- [ ] Works on mobile devices
- [ ] Works in multiple browsers

### Testing by Feature
```
Dashboard:
- [ ] Loads without errors
- [ ] Shows stats correctly
- [ ] Handles no data gracefully

Batches:
- [ ] Add batch works
  - [ ] Shows success toast
  - [ ] Validates inputs
  - [ ] Updates UI
- [ ] Delete batch confirmation works
- [ ] Add student works
- [ ] Delete student confirmation works
- [ ] Search filters students
- [ ] Sort works if implemented

Fees:
- [ ] Generate fees works
  - [ ] Shows success toast
  - [ ] Displays in table
- [ ] Mark paid works
  - [ ] Shows success toast
  - [ ] Updates status
- [ ] Undo paid works
- [ ] Export CSV works
  - [ ] File downloads correctly
  - [ ] No errors in console
- [ ] Send WhatsApp works
  - [ ] Validates phone number
  - [ ] Opens WhatsApp link

Reports:
- [ ] Generate reports works
- [ ] Charts display correctly
- [ ] Export works
```

### Error Scenarios to Test
- [ ] Network error during fetch
- [ ] Invalid form submission
- [ ] Deleting item with dependencies
- [ ] Timeout during long operation
- [ ] LocalStorage full/unavailable
- [ ] Multiple rapid submissions
- [ ] Invalid user credentials

---

## Code Patterns to Follow

### Adding Toast Notifications
```jsx
import { useToast } from '../context/ToastContext';

export default function MyComponent() {
  const { showSuccess, showError, showWarning } = useToast();
  
  const handleDelete = async (item) => {
    try {
      // ... delete operation
      showSuccess(`${item.name} deleted successfully`);
    } catch (error) {
      showError(`Failed to delete: ${error.message}`);
      console.error('Delete error:', error);
    }
  };
}
```

### Adding Confirmation Dialogs
```jsx
import { useConfirm } from '../context/ConfirmContext';

export default function MyComponent() {
  const confirm = useConfirm();
  
  const handleDelete = async (item) => {
    const confirmed = await confirm(
      `Delete "${item.name}"? This cannot be undone.`,
      'Delete Item'
    );
    if (!confirmed) return;
    
    try {
      // ... delete operation
      showSuccess('Deleted successfully');
    } catch (error) {
      showError('Delete failed');
    }
  };
}
```

### Adding Form Validation
```jsx
const validate = () => {
  const errors = {};
  
  if (!name.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!isValidEmail(email)) {
    errors.email = 'Invalid email address';
  }
  
  if (!isValidPhone(phone)) {
    errors.phone = 'Invalid phone number (10 digits, starting with 6-9)';
  }
  
  return Object.keys(errors).length === 0 ? null : errors;
};

const handleSubmit = (e) => {
  e.preventDefault();
  const errors = validate();
  
  if (errors) {
    Object.entries(errors).forEach(([field, msg]) => {
      showError(msg);
    });
    return;
  }
  
  // ... submit form
};
```

---

## Quick Reference

### Import statements you'll need:
```jsx
// Notifications
import { useToast } from '../context/ToastContext';

// Confirmation
import { useConfirm } from '../context/ConfirmContext';

// Utilities
import { 
  fmtINR, fmtDate, monthKey, monthLabel,
  isValidEmail, isValidPhone, isValidGSTIN,
  debounce, calculateFeeWithTax
} from '../utils/commonHelpers';

// Icons
import { I } from '../utils/Icons';

// Components
import EmptyState from '../components/ui/EmptyState';
import { SkeletonLoader, TableSkeleton } from '../components/SkeletonLoader';
```

### Available Toast Methods:
```jsx
showToast(message, type, duration) // 'info' | 'success' | 'error' | 'warning'
showSuccess(message, duration)      // duration default: 3000ms
showError(message, duration)        // duration default: 4000ms
showWarning(message, duration)      // duration default: 3500ms
```

### Available Confirm Options:
```jsx
const confirmed = await confirm(
  message,           // Required: confirmation message
  title,             // Required: dialog title
  {
    okText: 'Delete',  // Optional: confirm button text
    cancelText: 'Keep' // Optional: cancel button text
  }
);
// Returns: true if confirmed, false if cancelled
```

---

## Testing Commands

```bash
# Install dependencies if not done
npm install

# Run dev server
npm start

# Build for production
npm run build

# Run tests (when configured)
npm test
```

---

## Git Workflow

```bash
# Create a branch for Phase 2
git checkout -b features/form-validation

# Make improvements
# ... edit files ...

# Commit changes
git add .
git commit -m "feat: Add form validation and error handling"

# Push and create PR
git push origin features/form-validation
```

---

## Commit Message Template

```
type: subject

description

Examples:
- feat: Add form validation to Fees page
- fix: Handle database errors in Batches delete
- refactor: Extract form validation into utility
- test: Add tests for ErrorBoundary
```

---

## Need Help?

1. **Toast not working?** Check if ToastProvider is wrapping your component
2. **Confirm dialog not opening?** Check if ConfirmProvider is wrapping your component
3. **Validation not triggering?** Make sure to call validate() before submission
4. **Icon not showing?** Check it's imported from utils/Icons, not App

---

**Last Updated:** 2026-04-11
**Phase Status:** Phase 1 ✅ | Phase 2 🔄 | Phase 3 🔜 | Phase 4 🔜 | Phase 5 🔜
