// Request handlers for financial record routes.

import { Request, Response, NextFunction } from "express";
import * as recordsService from "./records.service";
import { createRecordSchema, updateRecordSchema, listRecordsQuerySchema } from "./records.schema";
import { sendSuccess } from "../../utils/response";
import { parsePagination } from "../../utils/pagination";

export const createRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = createRecordSchema.parse(req.body);
    const record = await recordsService.createRecord(body, req.user!.id);
    sendSuccess(res, record, "Record created successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const getRecords = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = listRecordsQuerySchema.parse(req.query);
    const pagination = parsePagination(query);

    const filters = {
      type: query.type as "INCOME" | "EXPENSE" | undefined,
      category: query.category,
      from: query.from,
      to: query.to,
    };

    const result = await recordsService.getRecords(filters, pagination);
    res.json({
      success: true,
      message: "Records fetched successfully",
      data: result.records,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const getRecordById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const record = await recordsService.getRecordById(id);
    sendSuccess(res, record, "Record fetched successfully");
  } catch (err) {
    next(err);
  }
};

export const updateRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const body = updateRecordSchema.parse(req.body);
    const record = await recordsService.updateRecord(id, body);
    sendSuccess(res, record, "Record updated successfully");
  } catch (err) {
    next(err);
  }
};

export const deleteRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const result = await recordsService.deleteRecord(id);
    sendSuccess(res, result, "Record deleted successfully");
  } catch (err) {
    next(err);
  }
};
