// Business logic for user registration and login.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { RegisterInput, LoginInput } from "./auth.schema";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

export const googleLogin = async (credential: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError("Invalid Google token", 401);
  }

  const { email, name, sub: googleId } = payload;

  // check if user already exists
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (user.status === "INACTIVE") {
      throw new AppError("Account is deactivated. Contact admin.", 403);
    }
  } else {
    // new user via Google — create with a random password
    const randomPassword = await bcrypt.hash(
      `google_${googleId}_${Date.now()}`,
      10
    );

    user = await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        password: randomPassword,
      },
    });
  }

  const token = generateToken(user.id, user.email, user.role);
  return { token, user: sanitizeUser(user) };
};
