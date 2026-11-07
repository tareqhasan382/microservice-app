/**
 * Event contract consumed from the task_app.events topic exchange.
 * Kept in sync with the publishers in user-service and task-service.
 */
export const USER_ROUTING_KEYS = {
  registered: "user.registered",
} as const;

export const TASK_ROUTING_KEYS = {
  created: "task.created",
  updated: "task.updated",
  assigned: "task.assigned",
  deleted: "task.deleted",
  commented: "task.commented",
} as const;

export type UserRegisteredPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type TaskEventPayload = {
  id: number;
  title: string;
  status: string;
  user_id: string;
  created_by_id: number | null;
  assignee_id: number | null;
  actor_id?: number;
};

export type TaskCommentPayload = {
  task_id: number;
  title: string;
  user_id: string;
  created_by_id: number | null;
  assignee_id: number | null;
  author_id: number;
  author_name: string;
  body: string;
};

export interface EventEnvelope<T> {
  event: string;
  service: string;
  occurredAt: string;
  data: T;
}
