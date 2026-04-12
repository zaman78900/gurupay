// Centralized utility functions used across the app

export const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const monthLabel = (k) => {
  if (!k) return '';
  const [y, m] = k.split('-');
  return new Date(+y, +m - 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

export const fmtINR = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0);

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

export const fmtDateLong = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

export const getLast6Months = () =>
  Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return monthKey(d);
  });

export const getCurrentMonth = () => monthKey();

// Current month constant (YYYY-MM format)
export const curMonth = monthKey();

// UUID-like ID generator (not cryptographically secure, just for local IDs)
export const generateId = () => Math.random().toString(36).slice(2, 9);

// Phone number normalization - used for Indian phone numbers
export const normalizePhone = (value = '') => {
  const onlyDigits = value.replace(/\D/g, '');
  if (onlyDigits.startsWith('91') && onlyDigits.length > 10) {
    return onlyDigits.slice(-10);
  }
  return onlyDigits.slice(0, 10);
};

// Validate Indian phone number format
export const isValidPhone = (phone) => {
  const normalized = normalizePhone(phone);
  return /^[6-9]\d{9}$/.test(normalized);
};

// Validate email format
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Validate GSTIN format (India)
export const isValidGSTIN = (gstin) => {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
};

// Safe localStorage operations
export const safeGetItem = (key, fallback = null) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (err) {
    console.warn(`Error reading from localStorage [${key}]:`, err);
    return fallback;
  }
};

export const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`Error writing to localStorage [${key}]:`, err);
    return false;
  }
};

// Calculate fee with discount and GST
export const calculateFeeWithTax = (baseFee, discount = 0, gstRate = 0) => {
  const afterDiscount = baseFee - discount;
  const gstAmount = Math.round(afterDiscount * (gstRate / 100));
  return {
    baseFee,
    discount,
    afterDiscount,
    gstRate,
    gstAmount,
    totalFee: afterDiscount + gstAmount,
  };
};

// Debounce function for search and form inputs
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Format large numbers with commas
export const fmtNumber = (n) => {
  return (n || 0).toLocaleString('en-IN');
};

// Capitalize first letter
export const capitalize = (str) => {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
};

// Safe object merge with type checking
export const deepMerge = (target, source) => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
};

const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// Handle async operations with timeout
export const withTimeout = (promise, ms = 10000, message = 'Request timed out') =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);

// Check if error is timeout-related
export const isTimeoutError = (err) => {
  const msg = (err?.message || '').toLowerCase();
  return /timed out|timeout/i.test(msg);
};

// Check if error is network-related
export const isNetworkError = (err) => {
  const msg = (err?.message || '').toLowerCase();
  return (
    msg.includes('timed out') ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('name_not_resolved') ||
    msg.includes('load failed')
  );
};
