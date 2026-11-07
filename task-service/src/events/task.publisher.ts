import config from "../config";
import logger from "../config/logger";
import { publishEvent } from "../config/rabbitmq";
import { Task } from "../models/task.interface";
import {
  EventEnvelope,
  TASK_ROUTING_KEYS,
  TaskCommentEventPayload,
  TaskEventPayload,
} from "./event.types";

const toPayload = (task: Task, actorId?: number): TaskEventPayload => ({
  id: task.id,
  title: task.title,
  status: task.status,
  user_id: task.user_id,
  created_by_id: task.created_by_id,
  assignee_id: task.assignee_id,
  actor_id: actorId,
});

const emit = (routingKey: string, task: Task, actorId?: number): void => {
  const envelope: EventEnvelope<TaskEventPayload> = {
    event: routingKey,
    service: config.service_name,
    occurredAt: new Date().toISOString(),
    data: toPayload(task, actorId),
  };

  if (publishEvent(routingKey, envelope)) {
    logger.debug(`📤 Published "${routingKey}" for task #${task.id}`);
  }
};

export const publishTaskCreated = (task: Task): void =>
  emit(TASK_ROUTING_KEYS.created, task);

export const publishTaskUpdated = (task: Task, actorId?: number): void =>
  emit(TASK_ROUTING_KEYS.updated, task, actorId);

export const publishTaskAssigned = (task: Task, actorId: number): void =>
  emit(TASK_ROUTING_KEYS.assigned, task, actorId);

export const publishTaskDeleted = (task: Task, actorId?: number): void =>
  emit(TASK_ROUTING_KEYS.deleted, task, actorId);

export const publishTaskCommented = (
  task: Task,
  comment: { author_id: number; author_name: string; body: string }
): void => {
  const envelope: EventEnvelope<TaskCommentEventPayload> = {
    event: TASK_ROUTING_KEYS.commented,
    service: config.service_name,
    occurredAt: new Date().toISOString(),
    data: {
      task_id: task.id,
      title: task.title,
      user_id: task.user_id,
      created_by_id: task.created_by_id,
      assignee_id: task.assignee_id,
      author_id: comment.author_id,
      author_name: comment.author_name,
      body: comment.body,
    },
  };

  if (publishEvent(TASK_ROUTING_KEYS.commented, envelope)) {
    logger.debug(`📤 Published "${TASK_ROUTING_KEYS.commented}" for task #${task.id}`);
  }
};
