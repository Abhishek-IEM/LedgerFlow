// Business logic for user registration and login.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { RegisterInput, LoginInput } from "./auth.schema";

const generateToken = (userId: string, email: string, role: string) => {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as string;
  return jwt.sign({ userId, email, role }, secret, { expiresIn: expiresIn as any });
};

// strips the password before returning user data
const sanitizeUser = (user: any) => {
  const { password, ...safe } = user;
  return safe;
};

export const register = async (data: RegisterInput) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new AppError("Email already in use", 409);
  }

  const hashed = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      // defaults to VIEWER role and ACTIVE status via the schema
    },
  });

  const token = generateToken(user.id, user.email, user.role);
  return { token, user: sanitizeUser(user) };
};

export const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const passwordMatch = await bcrypt.compare(data.password, user.password);
  if (!passwordMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  if (user.status === "INACTIVE") {
    throw new AppError("Account is deactivated. Contact admin.", 403);
  }

  const token = generateToken(user.id, user.email, user.role);
  return { token, user: sanitizeUser(user) };
};
