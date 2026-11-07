import { Request, Response } from "express";
import * as AuthService from "../services/auth.service";
import ApiResponse from "../utils/ApiResponse";
import config from "../config";

export const register = async (req: Request, res: Response) => {
  try {
    const result = await AuthService.registerUser(req.body);
    res.status(201).json(new ApiResponse(true, 201, "User registered successfully", result));
  } catch (error: any) {
    res.status(400).json(new ApiResponse(false, 400, error.message));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const {user, accessToken, refreshToken } = await AuthService.loginUser(email, password);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: config.jwt.jwt_cookie_secure === "true", 
      secure: config.node_env === "production", 
      sameSite:(config.jwt.jwt_cookie_samesite as "lax" | "strict" | "none") || "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json(new ApiResponse(true, 200, "Login successful", {user, accessToken }));
  } catch (error: any) {
    res.status(401).json(new ApiResponse(false, 401, error.message));
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.token;
    if (!token) {
      return res.status(400).json(new ApiResponse(false, 400, "No refresh token provided"));
    }
    const { accessToken, refreshToken } = await AuthService.refreshTokens(token);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: config.jwt.jwt_cookie_secure === "true", 
      secure: config.node_env === "production", 
      sameSite:(config.jwt.jwt_cookie_samesite as "lax" | "strict" | "none") || "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json(new ApiResponse(true, 200, "Tokens refreshed", { accessToken }));
  } catch (error: any) {
    res.status(401).json(new ApiResponse(false, 401, error.message));
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.token;
    if (!token) {
        res.clearCookie("refreshToken", { 
            httpOnly: config.jwt.jwt_cookie_secure === "true", 
            secure: config.node_env === "production", 
            sameSite:(config.jwt.jwt_cookie_samesite as "lax" | "strict" | "none") || "lax",
        });
      return res.status(400).json(new ApiResponse(false, 400, "No refresh token provided"));
    }
    await AuthService.logoutUser(token);
    res.json(new ApiResponse(true, 200, "Logged out successfully"));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, 500, error.message));
  }
};
