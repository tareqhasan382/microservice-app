import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { UserModel } from "../models/users/user.model";
import ApiError from "../utils/ApiError";

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication token missing");
    }

    const token = header.slice("Bearer ".length).trim();
    let decoded: { userId?: string | number };
    try {
      decoded = verifyAccessToken(token) as { userId?: string | number };
    } catch {
      throw new ApiError(401, "Invalid or expired token");
    }

    const user = await UserModel.findById(Number(decoded.userId));
    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    req.user = { id: user.id!, email: user.email, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize =
  (...roles: Array<"admin" | "user">) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Not authenticated"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden: insufficient permissions"));
    }
    next();
  };
