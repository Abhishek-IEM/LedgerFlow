// Dashboard analytics — aggregated financial data for the summary view.

import { prisma } from "../../config/db";
import { Prisma } from "@prisma/client";

export const getSummary = async () => {
  const [aggregates, totalRecords] = await Promise.all([
    prisma.financialRecord.groupBy({
      by: ["type"],
      where: { isDeleted: false },
      _sum: { amount: true },
    }),
    prisma.financialRecord.count({ where: { isDeleted: false } }),
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;

  for (const row of aggregates) {
    const val = Number(row._sum.amount) || 0;
    if (row.type === "INCOME") totalIncome = val;
    if (row.type === "EXPENSE") totalExpenses = val;
  }

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    totalRecords,
  };
};

export const getCategoryBreakdown = async () => {
  const records = await prisma.financialRecord.findMany({
    where: { isDeleted: false },
    select: { type: true, category: true, amount: true },
  });

  // group by category in application code
  const categoryMap: Record<
    string,
    { income: number; expense: number }
  > = {};

  for (const r of records) {
    if (!categoryMap[r.category]) {
      categoryMap[r.category] = { income: 0, expense: 0 };
    }
    const amt = Number(r.amount);
    if (r.type === "INCOME") {
      categoryMap[r.category].income += amt;
    } else {
      categoryMap[r.category].expense += amt;
    }
  }

  const result = Object.entries(categoryMap)
    .map(([category, totals]) => ({
      category,
      income: totals.income,
      expense: totals.expense,
      net: totals.income - totals.expense,
    }))
    .sort((a, b) => b.income + b.expense - (a.income + a.expense));

  return result;
};

export const getTrends = async (period: "monthly" | "weekly") => {
  const truncUnit = period === "weekly" ? "week" : "month";

  const rows: Array<{ period: Date; type: string; total: number }> =
    await prisma.$queryRaw`
      SELECT
        DATE_TRUNC(${truncUnit}, date) as period,
        type,
        SUM(amount)::float as total
      FROM "FinancialRecord"
      WHERE "isDeleted" = false
      GROUP BY period, type
      ORDER BY period ASC
    `;

  // merge INCOME and EXPENSE rows into a single object per period
  const periodMap: Record<string, { income: number; expense: number }> = {};

  for (const row of rows) {
    const key = new Date(row.period).toISOString().slice(0, 7); // e.g. "2025-03"
    if (!periodMap[key]) {
      periodMap[key] = { income: 0, expense: 0 };
    }
    if (row.type === "INCOME") periodMap[key].income = row.total;
    if (row.type === "EXPENSE") periodMap[key].expense = row.total;
  }

  return Object.entries(periodMap).map(([period, data]) => ({
    period,
    income: data.income,
    expense: data.expense,
  }));
};

export const getRecentActivity = async () => {
  return prisma.financialRecord.findMany({
    where: { isDeleted: false },
    orderBy: { date: "desc" },
    take: 10,
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
};
