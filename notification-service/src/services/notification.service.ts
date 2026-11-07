import { NotificationModel } from "../models/notification.model";
import { ICreateNotification } from "../models/notification.interface";
import { emitNotificationNew } from "../realtime/socket";
import ApiError from "../utils/ApiError";

type Actor = { id: string; role: "admin" | "user" };

export const listNotifications = async (
  actor: Actor,
  page: unknown,
  limit: unknown,
  unreadOnly?: unknown
) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const onlyUnread = unreadOnly === true || unreadOnly === "true";

  const { notifications, total } = await NotificationModel.findMany({
    userId: actor.id,
    unreadOnly: onlyUnread,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  });

  return { notifications, meta: { page: safePage, limit: safeLimit, total } };
};

export const createNotification = async (actor: Actor, data: ICreateNotification) => {
  const message = String(data.message ?? "").trim();
  if (!message) throw new ApiError(400, "Message is required");

  const targetUserId = data.userId ? String(data.userId) : actor.id;
  if (targetUserId !== actor.id && actor.role !== "admin") {
    throw new ApiError(403, "You can only create notifications for yourself");
  }

  const notification = await NotificationModel.create(targetUserId, message);
  emitNotificationNew(targetUserId, notification);
  return notification;
};

export const markNotificationRead = async (actor: Actor, id: number) => {
  const updated = await NotificationModel.markRead(id, actor.id);
  if (!updated) throw new ApiError(404, "Notification not found");
};

export const markAllNotificationsRead = async (actor: Actor) => {
  const count = await NotificationModel.markAllRead(actor.id);
  return { updated: count };
};

export const deleteNotification = async (actor: Actor, id: number) => {
  const deleted = await NotificationModel.remove(id, actor.id);
  if (!deleted) throw new ApiError(404, "Notification not found");
};
