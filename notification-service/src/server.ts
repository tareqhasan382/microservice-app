import { createServer, Server } from "http";
import app from "./app";
import config from "./config";
import { connectDB } from "./config/db";
import { closeRabbitMQ, connectRabbitMQ } from "./config/rabbitmq";
import { initRealtime } from "./realtime/socket";
import { startEventConsumer } from "./events/notification.consumer";
import logger from "./config/logger";

process.on("uncaughtException", (error) => {
  logger.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

let server: Server;

async function main() {
  try {
    await connectDB();

    try {
      // Register the handler first so a late/backgrounded connect still attaches the consumer.
      await startEventConsumer();
      await connectRabbitMQ();
    } catch (error) {
      logger.error("❌ RabbitMQ unavailable — event consumer will resume automatically:", error);
    }

    server = createServer(app);
    initRealtime(server);
    server.listen(config.port, () => {
      logger.info(
        `🚀 Notification Service is running on http://localhost:${config.port}`
      );
    });
  } catch (error) {
    logger.error("❌ Failed to start Notification Service:", error);
  }

  process.on("unhandledRejection", (reason) => {
    logger.error("❌ Unhandled Rejection:", reason);
    if (server) {
      server.close(() => process.exit(1));
    } else {
      process.exit(1);
    }
  });
}

main();

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  if (server) {
    server.close(async () => {
      await closeRabbitMQ();
      logger.info("HTTP Notification Service closed.");
    });
  }
});
