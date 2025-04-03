import { User } from "better-auth/types";
import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: User;
}
