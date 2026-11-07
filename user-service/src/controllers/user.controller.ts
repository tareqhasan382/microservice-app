import { Request, Response } from "express";
import * as UserService from "../services/user.service";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";

const parseId = (value: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid user id");
  }
  return id;
};

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.getProfile(req.user!.id);
  res.status(200).json(new ApiResponse(true, 200, "Profile fetched successfully", user));
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const { name, image } = req.body;
  const user = await UserService.updateProfile(req.user!.id, { name, image });
  res.status(200).json(new ApiResponse(true, 200, "Profile updated successfully", user));
});

export const changeMyPassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await UserService.changePassword(req.user!.id, currentPassword, newPassword);
  res.status(200).json(new ApiResponse(true, 200, "Password changed successfully"));
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const { users, meta } = await UserService.listUsers(page, limit);
  res.status(200).json(new ApiResponse(true, 200, "Users fetched successfully", { users, meta }));
});

export const getUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.getUserById(parseId(req.params.id));
  res.status(200).json(new ApiResponse(true, 200, "User fetched successfully", user));
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { name, image, role } = req.body;
  const user = await UserService.updateProfile(parseId(req.params.id), { name, image, role });
  res.status(200).json(new ApiResponse(true, 200, "User updated successfully", user));
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await UserService.deleteUser(parseId(req.params.id));
  res.status(200).json(new ApiResponse(true, 200, "User deleted successfully"));
});
