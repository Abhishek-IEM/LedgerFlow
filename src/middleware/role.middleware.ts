// Role-based access control middleware.
// Factory function that returns a middleware rejecting users whose role
// is not in the allowed list.

import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../utils/AppError";

export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("Access denied: insufficient permissions", 403)
      );
    }

    next();
  };
};
