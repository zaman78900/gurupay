/**
 * Auto Payment Setup Utilities
 * Automatically configure due dates and reminders for new student payments
 */

/**
 * Calculate due date based on student's preference
 * Used for recurring monthly payments
 * @param {string} preference - Preference type ('lastDay', '15', '20', '25', 'endOfWeek')
 * @param {Date} forDate - Date to calculate due date for (defaults to today)
 * @returns {string} Date in YYYY-MM-DD format
 */
export function calculateDueDateFromPreference(preference = 'lastDay', forDate = new Date()) {
  let dueDate = new Date(forDate);
  
  if (preference === 'lastDay') {
    // Last day of the month
    dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0);
  } else if (preference === 'endOfWeek') {
    // Next Friday (end of week)
    const day = dueDate.getDay();
    const diff = 5 - day; // 5 = Friday
    if (diff <= 0) {
      dueDate.setDate(dueDate.getDate() + (diff + 7));
    } else {
      dueDate.setDate(dueDate.getDate() + diff);
    }
  } else if (!isNaN(preference)) {
    // Fixed day of month (e.g., '15', '20', '25')
    const dayOfMonth = parseInt(preference, 10);
    dueDate.setDate(dayOfMonth);
    // If the date has already passed this month, move to next month
    if (dueDate < new Date()) {
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(dayOfMonth);
    }
  }
  
  const yyyy = dueDate.getFullYear();
  const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
  const dd = String(dueDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculate automatic due date for a payment
 * @param {string} presetType - 'daysFromNow', 'endOfMonth'
 * @param {number} days - Number of days from now (for 'daysFromNow')
 * @returns {string} Date in YYYY-MM-DD format
 */
export function calculateAutoDueDate(presetType = 'endOfMonth', days = 7) {
  const today = new Date();
  let dueDate = new Date(today);

  if (presetType === 'endOfMonth') {
    // Due at end of current month
    dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else if (presetType === 'daysFromNow') {
    // Due in specified number of days
    dueDate.setDate(dueDate.getDate() + days);
  } else if (presetType === 'nextMonth') {
    // Due on same day of next month
    dueDate.setMonth(dueDate.getMonth() + 1);
  }

  const yyyy = dueDate.getFullYear();
  const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
  const dd = String(dueDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Create default reminder configuration
 * @param {string} dueDate - Due date in YYYY-MM-DD format
 * @returns {Object} Reminder configuration
 */
export function createDefaultReminders(dueDate) {
  if (!dueDate) return { enabled: false, reminders: [] };

  const dueDateObj = new Date(dueDate);
  const reminders = [];

  // Reminder 1 day before due date
  const day1Before = new Date(dueDateObj);
  day1Before.setDate(day1Before.getDate() - 1);
  reminders.push({
    id: Date.now().toString(),
    offset: -1,
    scheduledAt: day1Before.toISOString(),
    sent: false,
    type: 'whatsapp',
  });

  // Reminder on due date
  reminders.push({
    id: (Date.now() + 1).toString(),
    offset: 0,
    scheduledAt: dueDateObj.toISOString(),
    sent: false,
    type: 'whatsapp',
  });

  return {
    enabled: true,
    reminders,
  };
}

/**
 * Apply auto setup to a payment
 * @param {Object} payment - Payment object
 * @param {Object} options - Configuration options
 * @returns {Object} Updated payment with auto setup
 */
export function applyAutoPaymentSetup(payment, options = {}) {
  const {
    autoDueDate = true,
    duePreset = 'endOfMonth',
    daysForDueDate = 7,
    autoReminders = true,
  } = options;

  let updatedPayment = { ...payment };

  // Set automatic due date
  if (autoDueDate && !payment.dueDate) {
    updatedPayment.dueDate = calculateAutoDueDate(duePreset, daysForDueDate);
  }

  // Set automatic reminders
  if (autoReminders && updatedPayment.dueDate) {
    const reminderConfig = createDefaultReminders(updatedPayment.dueDate);
    updatedPayment.reminderScheduledAt = reminderConfig.reminders[0]?.scheduledAt || null;
    updatedPayment.reminders = reminderConfig.reminders;
  }

  return updatedPayment;
}

/**
 * Format reminder offset into human-readable text
 * @param {number} offset - Day offset from due date
 * @returns {string} Formatted text
 */
export function formatReminderOffset(offset) {
  if (offset === 0) return 'On due date';
  if (offset === -1) return '1 day before';
  if (offset === 1) return '1 day after';
  if (offset < 0) return `${Math.abs(offset)} days before`;
  return `${offset} days after`;
}
