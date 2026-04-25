import type { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  email: string;
  universityId: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}
