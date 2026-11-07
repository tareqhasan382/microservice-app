import { Server } from "http";
import app from "./app";
import config from "./config";
import { connectDB } from "./config/db";
import { closeRabbitMQ, connectRabbitMQ } from "./config/rabbitmq";
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
      await connectRabbitMQ();
    } catch (error) {
      logger.error("❌ Failed to connect to RabbitMQ (events will be dropped until reconnected):", error);
    }

    server = app.listen(config.port, () => {
      logger.info(`🚀 User Service is running on http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start User Service:", error);
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
      logger.info("HTTP User Service closed.");
    });
  }
});
