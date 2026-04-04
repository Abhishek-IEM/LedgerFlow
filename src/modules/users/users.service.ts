// Business logic for user management (admin-only operations).

import { prisma } from "../../config/db";
import { Role, Status } from "@prisma/client";
import { AppError } from "../../utils/AppError";

// shared select object — never return passwords
const safeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export const getAllUsers = async () => {
  return prisma.user.findMany({ select: safeSelect });
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: safeSelect,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
};

export const updateUserRole = async (id: string, role: Role) => {
  // make sure the target user actually exists
  await getUserById(id);

  return prisma.user.update({
    where: { id },
    data: { role },
    select: safeSelect,
  });
};

export const updateUserStatus = async (
  id: string,
  status: Status,
  requestingUserId: string
) => {
  if (id === requestingUserId) {
    throw new AppError("Cannot deactivate your own account", 400);
  }

  await getUserById(id);

  return prisma.user.update({
    where: { id },
    data: { status },
    select: safeSelect,
  });
};
