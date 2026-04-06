// Request handlers for auth routes.
// Validates input with Zod, delegates to the auth service, and responds.

import { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema } from "./auth.schema";
import * as authService from "./auth.service";
import { sendSuccess } from "../../utils/response";

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body);
    sendSuccess(res, result, "Registration successful", 201);
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body);
    sendSuccess(res, result, "Login successful");
  } catch (err) {
    next(err);
  }
};

export const googleLoginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ status: "error", message: "Google credential is required" });
    }
    const result = await authService.googleLogin(credential);
    sendSuccess(res, result, "Google login successful");
  } catch (err) {
    next(err);
  }
};
