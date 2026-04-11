/**
 * Profile Model
 * Represents business profile information
 */

export const createProfile = (data = {}) => ({
  id: data.id || "", // User UUID
  name: data.name || "",
  gstin: data.gstin || "",
  address: data.address || "",
  phone: data.phone || "",
  email: data.email || "",
  upiId: data.upiId || "",
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString(),
});

export const validateProfile = (profile) => {
  const errors = [];

  if (!profile.name || profile.name.trim() === "") {
    errors.push("Business name is required");
  }

  if (profile.phone && !/\d{10}/.test(profile.phone.replace(/\D/g, ""))) {
    errors.push("Phone number must have at least 10 digits");
  }

  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    errors.push("Invalid email format");
  }

  if (profile.gstin) {
    // Basic GSTIN validation (15 characters, alphanumeric)
    if (!/^[0-9A-Z]{15}$/.test(profile.gstin)) {
      errors.push("Invalid GSTIN format (must be 15 characters)");
    }
  }

  if (profile.upiId) {
    // Basic UPI ID validation
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(profile.upiId)) {
      errors.push("Invalid UPI ID format (e.g., username@upi)");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getProfileDisplay = (profile) => {
  return {
    name: profile.name || "Your Business",
    gstin: profile.gstin || "Not provided",
    address: profile.address || "Not provided",
    phone: profile.phone || "Not provided",
    email: profile.email || "Not provided",
    upiId: profile.upiId || "Not provided",
  };
};

export const isProfileComplete = (profile) => {
  return (
    profile.name &&
    profile.gstin &&
    profile.address &&
    profile.phone &&
    profile.email
  );
};

export const Profile = {
  create: createProfile,
  validate: validateProfile,
  getDisplay: getProfileDisplay,
  isComplete: isProfileComplete,
};
