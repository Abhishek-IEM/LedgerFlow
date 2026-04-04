// Standardised JSON response helpers.
// Keeps the response envelope consistent across the entire API.

import { Response } from "express";

export const sendSuccess = (
  res: Response,
  data: unknown,
  message: string,
  statusCode = 200
) => {
  res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500
) => {
  res.status(statusCode).json({ success: false, message });
};
