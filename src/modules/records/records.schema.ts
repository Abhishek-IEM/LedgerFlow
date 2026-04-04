// Validation schemas for financial record endpoints.

import { z } from "zod";

export const createRecordSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1, "Category is required").max(100),
  date: z.string().datetime({ message: "Invalid date format — use ISO 8601" }),
  notes: z.string().max(500).optional(),
});

export const updateRecordSchema = createRecordSchema.partial();

export const listRecordsQuerySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  category: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
