import dotenv from "dotenv";
import Path from "path";
dotenv.config({ path: Path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV,
  node_env: process.env.NODE_ENV,
  service_name: process.env.SERVICE_NAME || "user-service",
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL!,
  bycrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  client_url: process.env.CLIENT_URL,
  rabbitmq_url: process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
  jwt: {
    jwt_access_secret: process.env.JWT_ACCESS_SECRET,
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
    jwt_access_expires: process.env.JWT_ACCESS_EXPIRES,
    jwt_access_refresh_expires: process.env.JWT_ACCESS_EXPIRES,
    jwt_cookie_secure:process.env.COOKIE_SECURE,
    jwt_cookie_samesite:process.env.COOKIE_SAMESITE,
  },
};