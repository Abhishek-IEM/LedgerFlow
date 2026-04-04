// JWT authentication middleware.
// Extracts the Bearer token, verifies it, and attaches user info to req.user.

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError("JWT secret is not configured", 500);
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      throw new AppError("User not found", 401);
    }

    if (user.status === "INACTIVE") {
      throw new AppError("Account is deactivated", 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    // jwt.verify throws its own errors for expired / malformed tokens
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Invalid or expired token", 401));
    }
    next(err);
  }
};
