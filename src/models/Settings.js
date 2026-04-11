/**
 * Settings Model
 * Represents application settings
 */

export const createSettings = (data = {}) => ({
  id: data.id || "",
  enableGst: data.enableGst !== undefined ? data.enableGst : true,
  enableDiscounts: data.enableDiscounts !== undefined ? data.enableDiscounts : true,
  enableLateFees: data.enableLateFees !== undefined ? data.enableLateFees : true,
  enableWhatsApp: data.enableWhatsApp !== undefined ? data.enableWhatsApp : true,
  csvExport: data.csvExport !== undefined ? data.csvExport : true,
  compactMode: data.compactMode !== undefined ? data.compactMode : false,
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString(),
});

export const validateSettings = (settings) => {
  const errors = [];

  // Settings are mostly boolean, so validation is minimal
  const booleanFields = [
    "enableGst",
    "enableDiscounts",
    "enableLateFees",
    "enableWhatsApp",
    "csvExport",
    "compactMode",
  ];

  for (const field of booleanFields) {
    if (typeof settings[field] !== "boolean") {
      errors.push(`${field} must be a boolean`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getSettingsDisplay = (settings) => {
  return {
    "GST Enabled": settings.enableGst ? "Yes" : "No",
    "Discounts Enabled": settings.enableDiscounts ? "Yes" : "No",
    "Late Fees Enabled": settings.enableLateFees ? "Yes" : "No",
    "WhatsApp Enabled": settings.enableWhatsApp ? "Yes" : "No",
    "CSV Export": settings.csvExport ? "Enabled" : "Disabled",
    "Compact Mode": settings.compactMode ? "On" : "Off",
  };
};

export const toggleSetting = (settings, settingName) => {
  return {
    ...settings,
    [settingName]: !settings[settingName],
  };
};

export const updateSettings = (settings, updates) => {
  return {
    ...settings,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
};

export const resetSettingsToDefaults = () => {
  return createSettings({
    enableGst: true,
    enableDiscounts: true,
    enableLateFees: true,
    enableWhatsApp: true,
    csvExport: true,
    compactMode: false,
  });
};

export const Settings = {
  create: createSettings,
  validate: validateSettings,
  getDisplay: getSettingsDisplay,
  toggle: toggleSetting,
  update: updateSettings,
  resetToDefaults: resetSettingsToDefaults,
};
