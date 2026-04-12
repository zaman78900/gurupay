/**
 * Automatic Payment Setup Configuration
 * User preferences for auto due date and reminder settings
 */

export const DEFAULT_AUTO_PAYMENT_CONFIG = {
  enabled: true,
  dueDatePreset: 'endOfMonth', // 'endOfMonth', 'daysFromNow', 'nextMonth'
  daysForDueDate: 7,
  autoReminders: true,
  reminderDaysBeforeDue: 1,
  reminderOnDueDate: true,
  reminderDaysAfterDue: 0, // 0 means disabled
};

/**
 * Get current auto payment configuration
 * Falls back to defaults if not set
 */
export function getAutoPaymentConfig(userSettings = {}) {
  return {
    enabled: userSettings.autoPaymentEnabled !== false,
    dueDatePreset: userSettings.autoPaymentDueDatePreset || DEFAULT_AUTO_PAYMENT_CONFIG.dueDatePreset,
    daysForDueDate: userSettings.autoPaymentDaysForDueDate || DEFAULT_AUTO_PAYMENT_CONFIG.daysForDueDate,
    autoReminders: userSettings.autoPaymentRemindersEnabled !== false,
    reminderDaysBeforeDue: userSettings.autoPaymentReminderDaysBeforeDue || DEFAULT_AUTO_PAYMENT_CONFIG.reminderDaysBeforeDue,
    reminderOnDueDate: userSettings.autoPaymentReminderOnDueDate !== false,
    reminderDaysAfterDue: userSettings.autoPaymentReminderDaysAfterDue || DEFAULT_AUTO_PAYMENT_CONFIG.reminderDaysAfterDue,
  };
}

/**
 * Format configuration description
 */
export function formatAutoPaymentConfigDescription(config) {
  let description = '🤖 Auto Setup: ';
  
  if (!config.enabled) {
    return description + 'Disabled';
  }

  const parts = [];
  
  // Due date format
  if (config.dueDatePreset === 'endOfMonth') {
    parts.push('Due end of month');
  } else if (config.dueDatePreset === 'daysFromNow') {
    parts.push(`Due in ${config.daysForDueDate} days`);
  } else if (config.dueDatePreset === 'nextMonth') {
    parts.push('Due next month');
  }

  // Reminders
  if (config.autoReminders) {
    const reminderTypes = [];
    if (config.reminderDaysBeforeDue > 0) {
      reminderTypes.push(`${config.reminderDaysBeforeDue}d before`);
    }
    if (config.reminderOnDueDate) {
      reminderTypes.push('on due');
    }
    if (config.reminderDaysAfterDue > 0) {
      reminderTypes.push(`${config.reminderDaysAfterDue}d after`);
    }
    
    if (reminderTypes.length > 0) {
      parts.push(`+ WhatsApp reminders (${reminderTypes.join(', ')})`);
    }
  }

  return description + parts.join(' • ');
}

/**
 * Validation for configuration
 */
export function validateAutoPaymentConfig(config) {
  const errors = [];

  if (config.dueDatePreset && !['endOfMonth', 'daysFromNow', 'nextMonth'].includes(config.dueDatePreset)) {
    errors.push('Invalid due date preset');
  }

  if (config.daysForDueDate && (config.daysForDueDate < 1 || config.daysForDueDate > 365)) {
    errors.push('Days for due date must be between 1 and 365');
  }

  if (config.reminderDaysBeforeDue && (config.reminderDaysBeforeDue < 0 || config.reminderDaysBeforeDue > 30)) {
    errors.push('Reminder days before must be between 0 and 30');
  }

  if (config.reminderDaysAfterDue && (config.reminderDaysAfterDue < 0 || config.reminderDaysAfterDue > 30)) {
    errors.push('Reminder days after must be between 0 and 30');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
