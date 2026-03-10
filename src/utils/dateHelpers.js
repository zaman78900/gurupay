export const getMonthKey = (date) =>
  new Date(date).toISOString().slice(0, 7);

export const getMonthLabel = (key) =>
  new Date(key + "-01").toLocaleDateString("en-IN", {
    month: "short", year: "2-digit"
  });

export const subtractMonths = (date, n) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() - n);
  return d;
};

export const isInRange = (date, start, end) =>
  new Date(date) >= new Date(start) && new Date(date) <= new Date(end);

export const startOfMonth = (date) => {
  const d = new Date(date);
  d.setDate(1); d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfMonth = (date) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1); d.setDate(0); d.setHours(23, 59, 59);
  return d;
};
