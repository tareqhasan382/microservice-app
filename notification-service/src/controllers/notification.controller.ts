import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import * as NotificationService from "../services/notification.service";

const parseId = (value: unknown): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid notification id");
  return id;
};

export const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const { notifications, meta } = await NotificationService.listNotifications(
    req.user!,
    req.query.page,
    req.query.limit,
    req.query.unread
  );
  res
    .status(200)
    .json(new ApiResponse(true, 200, "Notifications fetched successfully", { notifications, meta }));
});

export const createNotification = catchAsync(async (req: Request, res: Response) => {
  const notification = await NotificationService.createNotification(req.user!, req.body);
  res
    .status(201)
    .json(new ApiResponse(true, 201, "Notification created successfully", notification));
});

export const markRead = catchAsync(async (req: Request, res: Response) => {
  await NotificationService.markNotificationRead(req.user!, parseId(req.params.id));
  res.status(200).json(new ApiResponse(true, 200, "Notification marked as read"));
});

export const markAllRead = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.markAllNotificationsRead(req.user!);
  res.status(200).json(new ApiResponse(true, 200, "All notifications marked as read", result));
});

export const removeNotification = catchAsync(async (req: Request, res: Response) => {
  await NotificationService.deleteNotification(req.user!, parseId(req.params.id));
  res.status(200).json(new ApiResponse(true, 200, "Notification deleted successfully"));
});
