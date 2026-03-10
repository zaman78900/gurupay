import { useMemo } from "react";
import { useApp } from "../context/AppContext";

export function useFees(monthKey) {
  const { state } = useApp();
  const { students, payments, batches } = state;

  const feeList = useMemo(() => {
    return students.map((student) => {
      const batch = batches.find((b) => b.id === student.batchId);
      const payment = payments.find(
        (p) => p.studentId === student.id && p.month === monthKey
      );
      return {
        ...student,
        batch,
        payment,
        status: payment ? "paid" : "pending",
        amount: student.customFee || batch?.fee || 0,
      };
    });
  }, [students, payments, batches, monthKey]);

  const paid = feeList.filter((f) => f.status === "paid");
  const pending = feeList.filter((f) => f.status !== "paid");
  const collected = paid.reduce(
    (a, f) => a + (f.payment?.totalPaid || f.amount),
    0
  );
  const totalDue = feeList.reduce((a, f) => a + f.amount, 0);
  const rate = totalDue > 0 ? Math.round((collected / totalDue) * 100) : 0;

  return { feeList, paid, pending, collected, totalDue, rate };
}