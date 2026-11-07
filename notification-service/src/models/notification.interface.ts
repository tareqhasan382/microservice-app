export interface Notification {
  id: number;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}

export interface ICreateNotification {
  message: string;
  /** Optional target user; defaults to the authenticated user. Admin-only for other users. */
  userId?: string;
}
