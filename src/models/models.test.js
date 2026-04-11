/**
 * Unit Tests for All Models
 * Tests validation, creation, and helper methods
 */

import {
  Batch,
  createBatch,
  validateBatch,
  calculateBatchAmount,
  Student,
  createStudent,
  validateStudent,
  getStudentStatus,
  Payment,
  createPayment,
  validatePayment,
  getPaymentStatus,
  calculateDaysUntilDue,
  getDueDateDisplay,
  calculateTotalAmount,
  Installment,
  createInstallment,
  validateInstallment,
  getInstallmentStatus,
  calculateInstallmentProgress,
  getRemainingAmount,
  Profile,
  createProfile,
  validateProfile,
  getProfileDisplay,
  isProfileComplete,
  Settings,
  createSettings,
  validateSettings,
  getSettingsDisplay,
  toggleSetting,
  updateSettings,
  resetSettingsToDefaults,
} from "../models";

// ═══════════════════════════════════════════════════════════════════════════
// TEST UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

let testsPassed = 0;
let testsFailed = 0;

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    testsFailed++;
  } else {
    console.log(`✓ ${message}`);
    testsPassed++;
  }
};

const assertEquals = (actual, expected, message) => {
  if (actual !== expected) {
    console.error(
      `❌ FAILED: ${message}\n   Expected: ${expected}, Got: ${actual}`
    );
    testsFailed++;
  } else {
    console.log(`✓ ${message}`);
    testsPassed++;
  }
};

const assertArrayEquals = (actual, expected, message) => {
  const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
  if (!isEqual) {
    console.error(
      `❌ FAILED: ${message}\n   Expected: ${JSON.stringify(expected)}\n   Got: ${JSON.stringify(actual)}`
    );
    testsFailed++;
  } else {
    console.log(`✓ ${message}`);
    testsPassed++;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// BATCH MODEL TESTS
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n📦 BATCH MODEL TESTS\n");

// Test createBatch
const batch = createBatch({ name: "Yoga Class", fee: 1500, gstRate: 18 });
assert(batch.name === "Yoga Class", "createBatch: name set correctly");
assertEquals(batch.fee, 1500, "createBatch: fee set correctly");
assertEquals(batch.gstRate, 18, "createBatch: gstRate set correctly");
assert(batch.id !== undefined, "createBatch: id generated");
assert(batch.color !== undefined, "createBatch: default color set");

// Test validateBatch - valid
const validBatch = createBatch({
  name: "Math Class",
  fee: 2000,
  gstRate: 5,
  capacity: 20,
});
const validation1 = validateBatch(validBatch);
assert(validation1.isValid, "validateBatch: valid batch passes");
assertEquals(validation1.errors.length, 0, "validateBatch: no errors on valid");

// Test validateBatch - missing name
const invalidBatch1 = createBatch({ name: "", fee: 2000 });
const validation2 = validateBatch(invalidBatch1);
assert(!validation2.isValid, "validateBatch: rejects empty name");
assert(validation2.errors.length > 0, "validateBatch: returns error for missing name");

// Test validateBatch - negative fee
const invalidBatch2 = createBatch({ name: "Test", fee: -100 });
const validation3 = validateBatch(invalidBatch2);
assert(!validation3.isValid, "validateBatch: rejects negative fee");

// Test validateBatch - invalid gstRate
const invalidBatch3 = createBatch({ name: "Test", fee: 1000, gstRate: 105 });
const validation4 = validateBatch(invalidBatch3);
assert(!validation4.isValid, "validateBatch: rejects gstRate > 100");

// Test calculateBatchAmount
const amount1 = calculateBatchAmount(batch);
assert(amount1.base === 1500, "calculateBatchAmount: base amount correct");
assertEquals(amount1.gst, 270, "calculateBatchAmount: GST calculated correctly");
assertEquals(amount1.total, 1770, "calculateBatchAmount: total = base + GST");

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT MODEL TESTS
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n👨‍🎓 STUDENT MODEL TESTS\n");

// Test createStudent
const student = createStudent({
  name: "John Doe",
  phone: "9876543210",
  email: "john@email.com",
  discount: 10,
});
assertEquals(student.name, "John Doe", "createStudent: name set");
assertEquals(student.phone, "9876543210", "createStudent: phone set");
assertEquals(student.status, "Active", "createStudent: default status is Active");

// Test validateStudent - valid
const validation5 = validateStudent(student);
assert(validation5.isValid, "validateStudent: valid student passes");

// Test validateStudent - missing name
const invalidStudent1 = createStudent({ name: "", phone: "9876543210" });
const validation6 = validateStudent(invalidStudent1);
assert(!validation6.isValid, "validateStudent: rejects empty name");

// Test validateStudent - missing phone
const invalidStudent2 = createStudent({ name: "John", phone: "" });
const validation7 = validateStudent(invalidStudent2);
assert(!validation7.isValid, "validateStudent: rejects empty phone");

// Test validateStudent - invalid email
const invalidStudent3 = createStudent({
  name: "John",
  phone: "9876543210",
  email: "invalidemail",
});
const validation8 = validateStudent(invalidStudent3);
assert(!validation8.isValid, "validateStudent: rejects invalid email");

// Test validateStudent - invalid discount
const invalidStudent4 = createStudent({
  name: "John",
  phone: "9876543210",
  discount: 150,
});
const validation9 = validateStudent(invalidStudent4);
assert(!validation9.isValid, "validateStudent: rejects discount > 100");

// Test getStudentStatus
const status1 = getStudentStatus({ status: "Active" });
assertEquals(status1.label, "Active", "getStudentStatus: label correct");
assertEquals(status1.color, "#10B981", "getStudentStatus: Active is green");

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT MODEL TESTS
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n💳 PAYMENT MODEL TESTS\n");

// Test createPayment
const payment = createPayment({
  studentId: "s1",
  month: "January 2024",
  amount: 1000,
  status: "unpaid",
});
assertEquals(payment.studentId, "s1", "createPayment: studentId set");
assertEquals(payment.month, "January 2024", "createPayment: month set");
assertEquals(payment.status, "unpaid", "createPayment: status set");

// Test validatePayment - valid
const validation10 = validatePayment(payment);
assert(validation10.isValid, "validatePayment: valid payment passes");

// Test validatePayment - missing studentId
const invalidPayment1 = createPayment({ month: "January" });
const validation11 = validatePayment(invalidPayment1);
assert(!validation11.isValid, "validatePayment: rejects missing studentId");

// Test getPaymentStatus
const paymentStatus1 = getPaymentStatus({ status: "paid" });
assertEquals(paymentStatus1.label, "Paid", "getPaymentStatus: paid status correct");
assertEquals(paymentStatus1.color, "#10B981", "getPaymentStatus: paid is green");

// Test calculateTotalAmount
const payment2 = createPayment({ amount: 1000, lateFee: 100 });
const total1 = calculateTotalAmount(payment2, true);
assertEquals(total1, 1100, "calculateTotalAmount: includes late fee");

const total2 = calculateTotalAmount(payment2, false);
assertEquals(total2, 1000, "calculateTotalAmount: excludes late fee when false");

// Test calculateDaysUntilDue
const today = new Date().toISOString().split("T")[0];
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 5);
const tomorrow = tomorrowDate.toISOString().split("T")[0];

const payment3 = createPayment({ dueDate: tomorrow });
const daysUntil = calculateDaysUntilDue(payment3);
assert(daysUntil === 5, "calculateDaysUntilDue: calculates days correctly");

// Test getDueDateDisplay
const tomorrowDisplay = getDueDateDisplay(payment3);
assert(tomorrowDisplay.label.includes("5"), "getDueDateDisplay: includes day count");

// ═══════════════════════════════════════════════════════════════════════════
// INSTALLMENT MODEL TESTS
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n📊 INSTALLMENT MODEL TESTS\n");

// Test createInstallment
const installment = createInstallment({
  paymentId: "p1",
  amount: 1000,
  installmentNumber: 1,
});
assertEquals(installment.paymentId, "p1", "createInstallment: paymentId set");
assertEquals(installment.amount, 1000, "createInstallment: amount set");

// Test validateInstallment - valid
const validation12 = validateInstallment(installment);
assert(validation12.isValid, "validateInstallment: valid installment passes");

// Test validateInstallment - invalid
const invalidInstallment1 = createInstallment({
  paymentId: "",
  amount: 1000,
});
const validation13 = validateInstallment(invalidInstallment1);
assert(!validation13.isValid, "validateInstallment: rejects empty paymentId");

// Test getInstallmentStatus
const instStatus = getInstallmentStatus({ status: "paid" });
assertEquals(instStatus.label, "Paid", "getInstallmentStatus: returns correct label");

// Test calculateInstallmentProgress
const inst1 = createInstallment({
  amount: 1000,
  paidAmount: 500,
});
const progress1 = calculateInstallmentProgress(inst1);
assertEquals(progress1, 50, "calculateInstallmentProgress: 50% when half paid");

const inst2 = createInstallment({
  amount: 1000,
  paidAmount: 1000,
});
const progress2 = calculateInstallmentProgress(inst2);
assertEquals(progress2, 100, "calculateInstallmentProgress: 100% when full paid");

// Test getRemainingAmount
const inst3 = createInstallment({
  amount: 1000,
  paidAmount: 300,
});
const remaining = getRemainingAmount(inst3);
assertEquals(remaining, 700, "getRemainingAmount: calculates correctly");

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE MODEL TESTS
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n🏢 PROFILE MODEL TESTS\n");

// Test createProfile
const profile = createProfile({
  name: "My Academy",
  gstin: "29ABCDE1234F1Z5",
  phone: "9876543210",
});
assertEquals(profile.name, "My Academy", "createProfile: name set");
assertEquals(profile.gstin, "29ABCDE1234F1Z5", "createProfile: gstin set");

// Test validateProfile - valid
const validation14 = validateProfile(profile);
assert(validation14.isValid, "validateProfile: valid profile passes");

// Test validateProfile - invalid email
const invalidProfile1 = createProfile({
  name: "Test",
  email: "notanemail",
});
const validation15 = validateProfile(invalidProfile1);
assert(!validation15.isValid, "validateProfile: rejects invalid email");

// Test validateProfile - invalid GSTIN
const invalidProfile2 = createProfile({
  name: "Test",
  gstin: "123",
});
const validation16 = validateProfile(invalidProfile2);
assert(!validation16.isValid, "validateProfile: rejects invalid GSTIN");

// Test isProfileComplete
const completeProfile = createProfile({
  name: "Test",
  gstin: "29ABCDE1234F1Z5",
  address: "123 Main St",
  phone: "9876543210",
  email: "test@email.com",
});
assert(
  isProfileComplete(completeProfile),
  "isProfileComplete: returns true for complete profile"
);

const incompleteProfile = createProfile({ name: "Test" });
assert(
  !isProfileComplete(incompleteProfile),
  "isProfileComplete: returns false for incomplete profile"
);

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS MODEL TESTS
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n⚙️ SETTINGS MODEL TESTS\n");

// Test createSettings
const settings = createSettings({
  enableGst: true,
  compactMode: false,
});
assertEquals(settings.enableGst, true, "createSettings: enableGst set");
assertEquals(settings.compactMode, false, "createSettings: compactMode set");
assertEquals(settings.enableDiscounts, true, "createSettings: default enableDiscounts");

// Test validateSettings - valid
const validation17 = validateSettings(settings);
assert(validation17.isValid, "validateSettings: valid settings pass");

// Test validateSettings - invalid
const invalidSettings = createSettings({ enableGst: "yes" });
const validation18 = validateSettings(invalidSettings);
assert(!validation18.isValid, "validateSettings: rejects non-boolean values");

// Test toggleSetting
const toggled = toggleSetting(settings, "compactMode");
assertEquals(toggled.compactMode, true, "toggleSetting: toggles boolean correctly");

// Test updateSettings
const updated = updateSettings(settings, {
  enableWhatsApp: false,
  csvExport: false,
});
assertEquals(updated.enableWhatsApp, false, "updateSettings: updates multiple settings");
assertEquals(updated.enableGst, true, "updateSettings: preserves other settings");

// Test resetSettingsToDefaults
const defaults = resetSettingsToDefaults();
assertEquals(defaults.enableGst, true, "resetSettingsToDefaults: gst default true");
assertEquals(defaults.compactMode, false, "resetSettingsToDefaults: compact default false");

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n" + "═".repeat(70));
console.log(
  `\n✅ TESTS SUMMARY: ${testsPassed} passed, ${testsFailed} failed\n`
);
if (testsFailed === 0) {
  console.log("🎉 ALL TESTS PASSED!\n");
} else {
  console.log(`⚠️  ${testsFailed} test(s) failed\n`);
}
console.log("═".repeat(70) + "\n");

export { testsPassed, testsFailed };
