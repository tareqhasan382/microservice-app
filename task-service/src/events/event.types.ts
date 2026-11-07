import { Task } from "../models/task.interface";

/** Routing keys published by the task-service. */
export const TASK_ROUTING_KEYS = {
  created: "task.created",
  updated: "task.updated",
  assigned: "task.assigned",
  deleted: "task.deleted",
  commented: "task.commented",
} as const;

export type TaskRoutingKey =
  (typeof TASK_ROUTING_KEYS)[keyof typeof TASK_ROUTING_KEYS];

/** Fields shared with the notification-service consumer. */
export type TaskEventPayload = Pick<
  Task,
  "id" | "title" | "status" | "user_id" | "created_by_id" | "assignee_id"
> & { actor_id?: number };

/** Emitted when a member adds a comment to a task discussion thread. */
export interface TaskCommentEventPayload {
  task_id: number;
  title: string;
  user_id: string;
  created_by_id: number | null;
  assignee_id: number | null;
  author_id: number;
  author_name: string;
  body: string;
}

export interface EventEnvelope<T> {
  event: string;
  service: string;
  occurredAt: string;
  data: T;
}
