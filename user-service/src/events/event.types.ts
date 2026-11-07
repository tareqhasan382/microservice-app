/** Routing keys published by the user-service. */
export const USER_ROUTING_KEYS = {
  registered: "user.registered",
} as const;

export type UserRoutingKey =
  (typeof USER_ROUTING_KEYS)[keyof typeof USER_ROUTING_KEYS];

/** Fields shared with the notification-service consumer. */
export type UserEventPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export interface EventEnvelope<T> {
  event: string;
  service: string;
  occurredAt: string;
  data: T;
}
