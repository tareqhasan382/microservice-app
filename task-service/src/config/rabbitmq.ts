import * as amqp from "amqplib";
import config from ".";
import logger from "./logger";

export const EXCHANGE_NAME = "task_app.events";
export const EXCHANGE_TYPE = "topic";

const RECONNECT_DELAY_MS = 5000;

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;
let reconnecting = false;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
        // Keep retrying in the background so publishing recovers automatically.
        void scheduleReconnect();
        throw error;
      }
      await sleep(delay);
    }
  }
};

export const getChannel = (): amqp.Channel => {
  if (!channel) throw new Error("RabbitMQ channel is not initialized");
  return channel;
};

export const isRabbitMQConnected = (): boolean => channel !== null;

/** Publishes an event to the shared topic exchange. Returns false when the broker is unavailable. */
export const publishEvent = (routingKey: string, payload: unknown): boolean => {
  if (!channel) {
    logger.warn(`⚠️ RabbitMQ not connected — dropped event "${routingKey}"`);
    return false;
  }

  const message = Buffer.from(JSON.stringify(payload));
  return channel.publish(EXCHANGE_NAME, routingKey, message, {
    persistent: true,
    contentType: "application/json",
    timestamp: Date.now(),
  });
};

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
