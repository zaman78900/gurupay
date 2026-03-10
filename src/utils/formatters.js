export const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });

export const formatMonth = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    month: "long", year: "numeric"
  });

export const formatMonthShort = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    month: "short", year: "2-digit"
  });
