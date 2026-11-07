import bcrypt from "bcryptjs";
import { UserModel } from "../models/users/user.model";
import { IUpdateUser } from "../models/users/user.interface";
import ApiError from "../utils/ApiError";

const MIN_PASSWORD_LENGTH = 6;

export const getProfile = async (userId: number) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const listUsers = async (page = 1, limit = 10) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const { users, total } = await UserModel.findAll(safeLimit, offset);
  return { users, meta: { page: safePage, limit: safeLimit, total } };
};

export const getUserById = async (id: number) => {
  const user = await UserModel.findById(id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const updateProfile = async (id: number, data: IUpdateUser) => {
  const updated = await UserModel.update(id, data);
  if (!updated) throw new ApiError(404, "User not found");
  return updated;
};

export const changePassword = async (id: number, currentPassword: string, newPassword: string) => {
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new password are required");
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(400, `New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const user = await UserModel.findById(id, true);
  if (!user) throw new ApiError(404, "User not found");

  const isMatched = await bcrypt.compare(currentPassword, user.password);
  if (!isMatched) throw new ApiError(400, "Current password is incorrect");

  await UserModel.updatePassword(id, newPassword);
};

export const deleteUser = async (id: number) => {
  const deleted = await UserModel.remove(id);
  if (!deleted) throw new ApiError(404, "User not found");
};
