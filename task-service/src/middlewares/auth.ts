import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import ApiError from "../utils/ApiError";

type TokenPayload = { userId?: string | number; role?: "admin" | "user" };

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication token missing"));
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const decoded = jwt.verify(token, config.jwt.jwt_access_secret || "") as TokenPayload;
    if (!decoded.userId) {
      return next(new ApiError(401, "Invalid token payload"));
    }
    req.user = {
      id: String(decoded.userId),
      role: decoded.role === "admin" ? "admin" : "user",
    };
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
};
