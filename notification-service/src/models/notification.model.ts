import pool from "../config/db";
import { Notification } from "./notification.interface";

const NOTIFICATION_COLUMNS = "id, user_id, message, is_read, created_at";

type FindOptions = {
  userId: string;
  unreadOnly?: boolean;
  limit: number;
  offset: number;
};

// Data-access layer for the notifications table (Postgres).
export const NotificationModel = {
  async findMany({
    userId,
    unreadOnly,
    limit,
    offset,
  }: FindOptions): Promise<{ notifications: Notification[]; total: number }> {
    const where = unreadOnly ? "user_id = $1 AND is_read = FALSE" : "user_id = $1";

    const { rows } = await pool.query<Notification>(
      `SELECT ${NOTIFICATION_COLUMNS} FROM notifications
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM notifications WHERE ${where}`,
      [userId]
    );

    return { notifications: rows, total: countResult.rows[0].total };
  },

  async create(userId: string, message: string): Promise<Notification> {
    const { rows } = await pool.query<Notification>(
      `INSERT INTO notifications (user_id, message)
       VALUES ($1, $2)
       RETURNING ${NOTIFICATION_COLUMNS}`,
      [userId, message]
    );
    return rows[0];
  },

  async markRead(id: number, userId: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  },

  async markAllRead(userId: string): Promise<number> {
    const { rowCount } = await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return rowCount ?? 0;
  },

  async remove(id: number, userId: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  },
};
