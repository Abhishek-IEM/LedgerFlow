// Business logic for financial record CRUD operations.

import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";

interface CreateRecordData {
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
  notes?: string;
}

interface RecordFilters {
  type?: "INCOME" | "EXPENSE";
  category?: string;
  from?: string;
  to?: string;
}

export const createRecord = async (
  data: CreateRecordData,
  createdById: string
) => {
  const record = await prisma.financialRecord.create({
    data: {
      amount: new Prisma.Decimal(data.amount),
      type: data.type,
      category: data.category,
      date: new Date(data.date),
      notes: data.notes || null,
      createdById,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  return record;
};

export const getRecords = async (
  filters: RecordFilters,
  pagination: { skip: number; take: number; page: number; limit: number }
) => {
  // build the where clause dynamically based on provided filters
  const where: Prisma.FinancialRecordWhereInput = { isDeleted: false };

  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.category) {
    where.category = { contains: filters.category, mode: "insensitive" };
  }
  if (filters.from || filters.to) {
    where.date = {};
    if (filters.from) where.date.gte = new Date(filters.from);
    if (filters.to) where.date.lte = new Date(filters.to);
  }

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { date: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return {
    records,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

export const getRecordById = async (id: string) => {
  const record = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!record) {
    throw new AppError("Record not found", 404);
  }
  return record;
};

export const updateRecord = async (
  id: string,
  data: Partial<CreateRecordData>
) => {
  // first check it exists and is not soft-deleted
  await getRecordById(id);

  const updateData: any = { ...data };
  if (data.amount !== undefined) {
    updateData.amount = new Prisma.Decimal(data.amount);
  }
  if (data.date !== undefined) {
    updateData.date = new Date(data.date);
  }

  return prisma.financialRecord.update({
    where: { id },
    data: updateData,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
};

export const deleteRecord = async (id: string) => {
  await getRecordById(id);

  await prisma.financialRecord.update({
    where: { id },
    data: { isDeleted: true },
  });

  return { message: "Record deleted successfully" };
};
