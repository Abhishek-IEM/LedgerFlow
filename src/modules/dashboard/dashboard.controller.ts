// Request handlers for dashboard analytics endpoints.

import { Request, Response, NextFunction } from "express";
import * as dashboardService from "./dashboard.service";
import { sendSuccess } from "../../utils/response";

export const getSummary = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await dashboardService.getSummary();
    sendSuccess(res, data, "Dashboard summary fetched");
  } catch (err) {
    next(err);
  }
};

export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await dashboardService.getCategoryBreakdown();
    sendSuccess(res, data, "Category breakdown fetched");
  } catch (err) {
    next(err);
  }
};

export const getTrends = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const period = req.query.period === "weekly" ? "weekly" : "monthly";
    const data = await dashboardService.getTrends(period);
    sendSuccess(res, data, "Trends fetched");
  } catch (err) {
    next(err);
  }
};

export const getRecent = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await dashboardService.getRecentActivity();
    sendSuccess(res, data, "Recent activity fetched");
  } catch (err) {
    next(err);
  }
};
