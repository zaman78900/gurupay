import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  subtractMonths,
  isInRange,
  startOfMonth,
  endOfMonth,
} from "../utils/dateHelpers";

export function useReports(range, customFrom, customTo) {
  const { state } = useApp();
  const { payments, batches, students } = state;

  const dateRange = useMemo(() => {
    const now = new Date();
    const n = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 }[range];
    if (n) return { start: subtractMonths(now, n), end: now };
    if (range === "Custom" && customFrom && customTo) {
      return {
        start: startOfMonth(new Date(customFrom + "-01")),
        end: endOfMonth(new Date(customTo + "-01")),
      };
    }
    return { start: subtractMonths(now, 6), end: now };
  }, [range, customFrom, customTo]);

  const filtered = useMemo(
    () =>
      payments.filter((p) =>
        isInRange(p.paidAt || p.date, dateRange.start, dateRange.end)
      ),
    [payments, dateRange]
  );

  const totalCollected = filtered
    .filter((p) => p.status === "paid")
    .reduce((a, p) => a + (p.totalPaid || 0), 0);
  const totalPending = filtered
    .filter((p) => p.status !== "paid")
    .reduce((a, p) => a + (p.amount || 0), 0);
  const totalGst = filtered.reduce((a, p) => a + (p.gstAmount || 0), 0);
  const overallRate =
    totalCollected + totalPending > 0
      ? Math.round((totalCollected / (totalCollected + totalPending)) * 100)
      : 0;

  return {
    filtered,
    totalCollected,
    totalPending,
    totalGst,
    overallRate,
    dateRange,
    batches,
    students,
  };
}