// Request handlers for user management routes (admin-only).

import { Request, Response, NextFunction } from "express";
import * as usersService from "./users.service";
import { updateRoleSchema, updateStatusSchema } from "./users.schema";
import { sendSuccess } from "../../utils/response";

export const getAllUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await usersService.getAllUsers();
    sendSuccess(res, users, "Users fetched successfully");
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const user = await usersService.getUserById(id);
    sendSuccess(res, user, "User fetched successfully");
  } catch (err) {
    next(err);
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const { role } = updateRoleSchema.parse(req.body);
    const user = await usersService.updateUserRole(id, role);
    sendSuccess(res, user, "Role updated successfully");
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const { status } = updateStatusSchema.parse(req.body);
    const user = await usersService.updateUserStatus(id, status, req.user!.id);
    sendSuccess(res, user, "Status updated successfully");
  } catch (err) {
    next(err);
  }
};
