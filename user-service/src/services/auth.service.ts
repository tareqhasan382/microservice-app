import bcrypt from "bcryptjs";
import { RefreshTokenModel } from "../models/tokens/refreshToken.model";
import { UserModel } from "../models/users/user.model";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { IRegisterUser } from "../models/users/user.interface";
import { publishUserRegistered } from "../events/user.publisher";

export const registerUser = async (data: IRegisterUser) => {
  const existingUser = await UserModel.findByEmail(data.email);
  if (existingUser) throw new Error("Email already registered");
  const user = await UserModel.create(data);
  publishUserRegistered(user);
  return user;
};

export const loginUser = async (email: string, password: string) => {
  const existingUser = await UserModel.findByEmail(email, true);
  if (!existingUser) throw new Error("User Does't Exist!");

  const isPasswordMatched = await bcrypt.compare(password, existingUser.password);
  if (!isPasswordMatched) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(String(existingUser.id), existingUser.role);
  const refreshToken = generateRefreshToken(String(existingUser.id));

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshTokenModel.create({
    userId: existingUser.id!,
    token: refreshToken,
    expiresAt,
  });

  const { password: _password, ...user } = existingUser;
  return { user, accessToken, refreshToken };
};

export const refreshTokens = async (token: string) => {
  const decoded: any = verifyRefreshToken(token);
  const existing = await RefreshTokenModel.findByToken(token);
  if (!existing || existing.revoked) throw new Error("Invalid refresh token");

  const user = await UserModel.findById(Number(decoded.userId));
  if (!user) throw new Error("User no longer exists");

  const newAccess = generateAccessToken(String(decoded.userId), user.role);
  const newRefresh = generateRefreshToken(String(decoded.userId));

  await RefreshTokenModel.revoke(token, newRefresh);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshTokenModel.create({
    userId: Number(decoded.userId),
    token: newRefresh,
    expiresAt,
  });

  return { accessToken: newAccess, refreshToken: newRefresh };
};

export const logoutUser = async (token: string) => {
  await RefreshTokenModel.revoke(token);
  return true;
};
