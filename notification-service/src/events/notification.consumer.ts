import logger from "../config/logger";
import { startConsuming } from "../config/rabbitmq";
import { NotificationModel } from "../models/notification.model";
import {
  emitNotificationNew,
  emitTaskChanged,
  emitTaskChangedToWorkspace,
} from "../realtime/socket";
import {
  EventEnvelope,
  TASK_ROUTING_KEYS,
  TaskCommentPayload,
  TaskEventPayload,
  USER_ROUTING_KEYS,
  UserRegisteredPayload,
} from "./event.types";

const handleUserRegistered = async (
  envelope: EventEnvelope<UserRegisteredPayload>
): Promise<void> => {
  const { id, name } = envelope.data;
  const notification = await NotificationModel.create(
    id,
    `Welcome ${name}! Your account has been created. 🎉`
  );
  emitNotificationNew(id, notification);
  logger.info(`🔔 Welcome notification created for user #${id}`);
};

const handleTaskEvent = async (
  routingKey: string,
  envelope: EventEnvelope<TaskEventPayload>
): Promise<void> => {
  const { user_id, title, status, created_by_id, assignee_id, actor_id } = envelope.data;

  const messageByEvent: Record<string, string> = {
    [TASK_ROUTING_KEYS.created]: `New task created: "${title}"`,
    [TASK_ROUTING_KEYS.updated]: `Task updated: "${title}" (status: ${status})`,
    [TASK_ROUTING_KEYS.assigned]: `A task was assigned to you: "${title}"`,
    [TASK_ROUTING_KEYS.deleted]: `Task deleted: "${title}"`,
  };
  const actionByEvent: Record<string, "created" | "updated" | "deleted"> = {
    [TASK_ROUTING_KEYS.created]: "created",
    [TASK_ROUTING_KEYS.updated]: "updated",
    [TASK_ROUTING_KEYS.assigned]: "updated",
    [TASK_ROUTING_KEYS.deleted]: "deleted",
  };

  const message = messageByEvent[routingKey];
  if (!message) return;

  const targets = new Set(
    [created_by_id, assignee_id, user_id]
      .filter((id): id is string | number => id !== null && id !== undefined)
      .map(String)
  );

  if (assignee_id === null) {
    emitTaskChangedToWorkspace(actionByEvent[routingKey], envelope.data);
  } else {
    for (const userId of targets) {
      emitTaskChanged(userId, actionByEvent[routingKey], envelope.data);
    }
  }

  const shouldNotifyAssignee =
    assignee_id !== null &&
    assignee_id !== undefined &&
    actor_id !== assignee_id &&
    routingKey !== TASK_ROUTING_KEYS.deleted;
  const notificationTarget = shouldNotifyAssignee
    ? String(assignee_id)
    : assignee_id === undefined && routingKey !== TASK_ROUTING_KEYS.assigned
      ? user_id
      : null;

  if (notificationTarget) {
    const notification = await NotificationModel.create(notificationTarget, message);
    emitNotificationNew(notificationTarget, notification);
    logger.info(`🔔 Notification created for user #${notificationTarget}: ${message}`);
  }
};

const handleTaskCommented = async (
  envelope: EventEnvelope<TaskCommentPayload>
): Promise<void> => {
  const { task_id, title, user_id, created_by_id, assignee_id, author_id, author_name, body } =
    envelope.data;

  // Everyone involved in the task hears about the comment — except its author.
  const targets = new Set(
    [created_by_id, assignee_id, user_id]
      .filter((id): id is string | number => id !== null && id !== undefined)
      .map(String)
      .filter((id) => id !== String(author_id))
  );

  const excerpt = body.length > 80 ? `${body.slice(0, 77)}...` : body;
  const message = `${author_name} commented on "${title}": ${excerpt}`;

  for (const userId of targets) {
    const notification = await NotificationModel.create(userId, message);
    emitNotificationNew(userId, notification);
    // Refresh the recipient's board so the unread-comment badge appears live.
    emitTaskChanged(userId, "updated", { id: task_id, title, user_id, created_by_id, assignee_id });
    logger.info(`🔔 Comment notification for user #${userId} on task #${task_id}`);
  }
};

/**
 * Consumes domain events and turns them into user notifications.
 * Called once during service bootstrap.
 */
export const startEventConsumer = async (): Promise<void> => {
  await startConsuming(async (routingKey, payload) => {
    const envelope = payload as EventEnvelope<
      UserRegisteredPayload & TaskEventPayload
    >;

    switch (routingKey) {
      case USER_ROUTING_KEYS.registered:
        await handleUserRegistered(envelope);
        break;
      case TASK_ROUTING_KEYS.created:
      case TASK_ROUTING_KEYS.updated:
      case TASK_ROUTING_KEYS.assigned:
      case TASK_ROUTING_KEYS.deleted:
        await handleTaskEvent(routingKey, envelope);
        break;
      case TASK_ROUTING_KEYS.commented:
        await handleTaskCommented(envelope as unknown as EventEnvelope<TaskCommentPayload>);
        break;
      default:
        logger.warn(`⚠️ Unhandled routing key: ${routingKey}`);
    }
  });
};
