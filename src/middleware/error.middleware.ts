// Central error handling middleware.
// Catches all errors thrown in route handlers and returns a clean JSON response.

import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // our own operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // zod validation errors
  if (err.name === "ZodError") {
    const formatted = err.issues.map((issue: any) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formatted,
    });
    return;
  }

  // prisma unique-constraint violation (e.g. duplicate email)
  if (err.code === "P2002") {
    res.status(409).json({
      success: false,
      message: "A record with that value already exists",
    });
    return;
  }

  // fallback — unexpected error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
