import config from "../config";
import logger from "../config/logger";
import { publishEvent } from "../config/rabbitmq";
import { IUser } from "../models/users/user.interface";
import { EventEnvelope, USER_ROUTING_KEYS, UserEventPayload } from "./event.types";

export const publishUserRegistered = (user: IUser): void => {
  const envelope: EventEnvelope<UserEventPayload> = {
    event: USER_ROUTING_KEYS.registered,
    service: config.service_name || "user-service",
    occurredAt: new Date().toISOString(),
    data: {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };

  if (publishEvent(USER_ROUTING_KEYS.registered, envelope)) {
    logger.debug(`📤 Published "user.registered" for user #${user.id}`);
  }
};
