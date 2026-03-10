export const calculateGST = (baseFee, discount = 0, gstRate = 0) => {
  const taxable = Math.max(baseFee - discount, 0);
  const gst = Math.round((taxable * gstRate) / 100);
  const total = taxable + gst;
  return { taxable, gst, total };
};

export const generateReceiptNumber = (payments = []) =>
  `GP-P${payments.length + 1}`;
