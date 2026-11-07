import * as amqp from "amqplib";
import config from ".";
import logger from "./logger";

export const EXCHANGE_NAME = "task_app.events";
export const EXCHANGE_TYPE = "topic";
export const QUEUE_NAME = `${config.service_name}.events`;

/** Routing keys this service subscribes to. */
export const ROUTING_KEYS = [
  "user.registered",
  "task.created",
  "task.updated",
  "task.assigned",
  "task.deleted",
  "task.commented",
];

const RECONNECT_DELAY_MS = 5000;
const PREFETCH = 10;

export type EventHandler = (
  routingKey: string,
  payload: unknown
) => Promise<void>;

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;
let messageHandler: EventHandler | null = null;
let reconnecting = false;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const onMessage = (msg: amqp.ConsumeMessage | null): void => {
  if (!msg || !channel) return;
  const activeChannel = channel;

  void (async () => {
    try {
      const payload = JSON.parse(msg.content.toString());
      if (messageHandler) {
        await messageHandler(msg.fields.routingKey, payload);
      }
      activeChannel.ack(msg);
    } catch (error) {
      logger.error(
        `❌ Failed to process "${msg.fields.routingKey}" message:`,
        error
      );
      // Drop poisoned messages instead of requeueing them forever.
      activeChannel.nack(msg, false, false);
    }
  })();
};

const setupConsumer = async (): Promise<void> => {
  if (!channel || !messageHandler) return;

  await channel.assertQueue(QUEUE_NAME, { durable: true });
  for (const key of ROUTING_KEYS) {
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, key);
  }
  await channel.prefetch(PREFETCH);
  await channel.consume(QUEUE_NAME, onMessage, { noAck: false });
  logger.info(
    `📥 Consuming "${QUEUE_NAME}" bound to: ${ROUTING_KEYS.join(", ")}`
  );
};

const openConnection = async (): Promise<void> => {
  connection = await amqp.connect(config.rabbitmq_url);

  connection.on("error", (error) => {
    logger.error("❌ RabbitMQ connection error:", error);
  });

  connection.on("close", () => {
    logger.warn("⚠️ RabbitMQ connection closed. Reconnecting...");
    channel = null;
    connection = null;
    void scheduleReconnect();
  });

  channel = await connection.createChannel();
  channel.on("error", (error) => logger.error("❌ RabbitMQ channel error:", error));

  await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });
  logger.info("✅ RabbitMQ connected & exchange ready");

  // Re-attach the consumer automatically after a reconnect.
  await setupConsumer();
};

const scheduleReconnect = async (): Promise<void> => {
  if (reconnecting) return;
  reconnecting = true;

  while (!connection) {
    await sleep(RECONNECT_DELAY_MS);
    try {
      await openConnection();
    } catch (error) {
      logger.error("❌ RabbitMQ reconnect attempt failed, retrying...", error);
    }
  }

  reconnecting = false;
};

export const connectRabbitMQ = async (
  retries = 10,
  delay = 5000
): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await openConnection();
      return;
    } catch (error) {
      logger.error(`❌ RabbitMQ connection attempt ${attempt}/${retries} failed`);
      if (attempt === retries) {
        // Keep retrying in the background so the consumer recovers automatically.
        void scheduleReconnect();
        throw error;
      }
      await sleep(delay);
    }
  }
};

/** Registers the event handler and (re)starts consumption. */
export const startConsuming = async (handler: EventHandler): Promise<void> => {
  messageHandler = handler;
  await setupConsumer();
};

export const getChannel = (): amqp.Channel => {
  if (!channel) throw new Error("RabbitMQ channel is not initialized");
  return channel;
};

export const isRabbitMQConnected = (): boolean => channel !== null;

export const closeRabbitMQ = async (): Promise<void> => {
  try {
    await channel?.close();
    await connection?.close();
  } catch (error) {
    logger.error("Error while closing RabbitMQ connection:", error);
  } finally {
    channel = null;
    connection = null;
  }
};
