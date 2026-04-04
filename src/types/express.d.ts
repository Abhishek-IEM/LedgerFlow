// Extend the Express Request type so we can attach user data after JWT verification.

import { Role, Status } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        status: Status;
      };
    }
  }
}
