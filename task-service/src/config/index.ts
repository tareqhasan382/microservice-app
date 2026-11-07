import dotenv from "dotenv";
import Path from "path";
dotenv.config({ path: Path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV || "development",
  node_env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5002),
  service_name: process.env.SERVICE_NAME || "task-service",
  database_url: process.env.DATABASE_URL!,
  redis_url: process.env.REDIS_URL!,
  rabbitmq_url: process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
  jwt: {
    jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  },
};
