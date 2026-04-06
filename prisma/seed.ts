// Seed script — creates test users and sample financial records.
// Safe to re-run thanks to upsert on the user email.

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hashedAdmin = await bcrypt.hash("admin123", 10);
  const hashedAnalyst = await bcrypt.hash("analyst123", 10);
  const hashedViewer = await bcrypt.hash("viewer123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ledgerflow.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@ledgerflow.com",
      password: hashedAdmin,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "analyst@ledgerflow.com" },
    update: {},
    create: {
      name: "Analyst User",
      email: "analyst@ledgerflow.com",
      password: hashedAnalyst,
      role: "ANALYST",
    },
  });

  await prisma.user.upsert({
    where: { email: "viewer@ledgerflow.com" },
    update: {},
    create: {
      name: "Viewer User",
      email: "viewer@ledgerflow.com",
      password: hashedViewer,
      role: "VIEWER",
    },
  });

  // sample financial records spread across the last 6 months
  const sampleRecords = [
    { amount: 45000, type: "INCOME" as const, category: "Salary", monthsAgo: 5, notes: "Monthly salary - October" },
    { amount: 12000, type: "INCOME" as const, category: "Freelance", monthsAgo: 5, notes: "Client project payment" },
    { amount: 15000, type: "EXPENSE" as const, category: "Rent", monthsAgo: 5 },
    { amount: 3200, type: "EXPENSE" as const, category: "Utilities", monthsAgo: 5, notes: "Electricity and water" },
    { amount: 45000, type: "INCOME" as const, category: "Salary", monthsAgo: 4, notes: "Monthly salary - November" },
    { amount: 8500, type: "EXPENSE" as const, category: "Groceries", monthsAgo: 4 },
    { amount: 2500, type: "EXPENSE" as const, category: "Insurance", monthsAgo: 4, notes: "Health insurance premium" },
    { amount: 45000, type: "INCOME" as const, category: "Salary", monthsAgo: 3, notes: "Monthly salary - December" },
    { amount: 18000, type: "INCOME" as const, category: "Freelance", monthsAgo: 3 },
    { amount: 15000, type: "EXPENSE" as const, category: "Rent", monthsAgo: 3 },
    { amount: 7500, type: "EXPENSE" as const, category: "Travel", monthsAgo: 3, notes: "Holiday trip" },
    { amount: 45000, type: "INCOME" as const, category: "Salary", monthsAgo: 2, notes: "Monthly salary - January" },
    { amount: 4000, type: "EXPENSE" as const, category: "Marketing", monthsAgo: 2 },
    { amount: 15000, type: "EXPENSE" as const, category: "Rent", monthsAgo: 2 },
    { amount: 9500, type: "EXPENSE" as const, category: "Tax", monthsAgo: 2, notes: "Quarterly advance tax" },
    { amount: 45000, type: "INCOME" as const, category: "Salary", monthsAgo: 1, notes: "Monthly salary - February" },
    { amount: 25000, type: "INCOME" as const, category: "Freelance", monthsAgo: 1 },
    { amount: 15000, type: "EXPENSE" as const, category: "Rent", monthsAgo: 1 },
    { amount: 35000, type: "EXPENSE" as const, category: "Equipment", monthsAgo: 1, notes: "New laptop purchase" },
    { amount: 45000, type: "INCOME" as const, category: "Salary", monthsAgo: 0, notes: "Monthly salary - March" },
  ];

  const now = new Date();
  const recordPromises = sampleRecords.map((r) => {
    const date = new Date(now);
    date.setMonth(date.getMonth() - r.monthsAgo);
    date.setDate(Math.floor(Math.random() * 25) + 1); // random day between 1-25

    return prisma.financialRecord.create({
      data: {
        amount: r.amount,
        type: r.type,
        category: r.category,
        date,
        notes: r.notes || null,
        createdById: admin.id,
      },
    });
  });

  await Promise.all(recordPromises);

  console.log(`Seeded 3 users and ${sampleRecords.length} financial records.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
