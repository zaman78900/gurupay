/**
 * Revenue Report Model
 * Calculates and formats revenue data
 */

export const calculateMonthlyRevenue = (payments, batches, students) => {
  const monthlyData = {};

  payments.forEach((payment) => {
    const student = students.find((s) => s.id === payment.studentId);
    const batch = batches.find((b) => b.id === student?.batchId);

    if (payment.status === "paid" && batch) {
      const month = payment.month;
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          revenue: 0,
          paidCount: 0,
          unpaidCount: 0,
          lateFeeCollected: 0,
          batches: {},
        };
      }

      monthlyData[month].revenue += payment.amount;
      monthlyData[month].paidCount++;
      monthlyData[month].lateFeeCollected += payment.lateFee || 0;

      if (!monthlyData[month].batches[batch.id]) {
        monthlyData[month].batches[batch.id] = {
          name: batch.name,
          revenue: 0,
          count: 0,
        };
      }
      monthlyData[month].batches[batch.id].revenue += payment.amount;
      monthlyData[month].batches[batch.id].count++;
    }
  });

  return Object.values(monthlyData).sort(
    (a, b) => new Date(b.month) - new Date(a.month)
  );
};

export const calculateBatchRevenue = (payments, batches, students) => {
  const batchData = {};

  payments.forEach((payment) => {
    const student = students.find((s) => s.id === payment.studentId);
    const batch = batches.find((b) => b.id === student?.batchId);

    if (payment.status === "paid" && batch) {
      if (!batchData[batch.id]) {
        batchData[batch.id] = {
          id: batch.id,
          name: batch.name,
          fee: batch.fee,
          revenue: 0,
          paidCount: 0,
          unpaidCount: 0,
          capacity: batch.capacity,
          color: batch.color,
          occupancy: 0,
        };
      }

      batchData[batch.id].revenue += payment.amount;
      batchData[batch.id].paidCount++;
    }
  });

  batches.forEach((batch) => {
    if (!batchData[batch.id]) {
      batchData[batch.id] = {
        id: batch.id,
        name: batch.name,
        fee: batch.fee,
        revenue: 0,
        paidCount: 0,
        unpaidCount: 0,
        capacity: batch.capacity,
        color: batch.color,
        occupancy: 0,
      };
    }

    const batchStudents = students.filter((s) => s.batchId === batch.id);
    batchData[batch.id].occupancy = batchStudents.length;
  });

  return Object.values(batchData);
};

export const calculateTotalRevenue = (payments) => {
  return payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount + (p.lateFee || 0), 0);
};

export const getRevenueStats = (payments, batches, students) => {
  const paidPayments = payments.filter((p) => p.status === "paid");
  const unpaidPayments = payments.filter((p) => p.status === "unpaid");

  const totalRevenue = calculateTotalRevenue(payments);
  const totalLateFee = paidPayments.reduce((sum, p) => sum + (p.lateFee || 0), 0);
  const expectedRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalRevenue,
    totalLateFee,
    expectedRevenue,
    collectionRate: Math.round(
      (totalRevenue / expectedRevenue) * 100 || 0
    ),
    paidCount: paidPayments.length,
    unpaidCount: unpaidPayments.length,
    totalPayments: payments.length,
  };
};

export const getYearlyTrend = (payments) => {
  const yearlyData = {};

  payments
    .filter((p) => p.status === "paid")
    .forEach((payment) => {
      const year = new Date(payment.paidOn || payment.createdAt).getFullYear();
      if (!yearlyData[year]) {
        yearlyData[year] = 0;
      }
      yearlyData[year] += payment.amount + (payment.lateFee || 0);
    });

  return Object.entries(yearlyData)
    .map(([year, revenue]) => ({
      year: Number(year),
      revenue,
    }))
    .sort((a, b) => a.year - b.year);
};

export const getRevenueGrowthRate = (currentMonth, previousMonth) => {
  if (!previousMonth || previousMonth === 0) return 0;
  return Math.round(((currentMonth - previousMonth) / previousMonth) * 100);
};

export const RevenueReport = {
  calculateMonthlyRevenue,
  calculateBatchRevenue,
  calculateTotalRevenue,
  getStats: getRevenueStats,
  getYearlyTrend,
  getGrowthRate: getRevenueGrowthRate,
};
