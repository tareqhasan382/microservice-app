import dotenv from "dotenv";
dotenv.config();

export default {
  NODE_ENV: process.env.NODE_ENV || 'development',
  SERVICE_NAME: require("../../package.json").name, //require('../../package.json').name,
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_ACCESS_SECRET!,
  redis_url: process.env.REDIS_URL || 'redis://localhost:6379',
  DEFAULT_TIMEOUT: Number(process.env.DEFAULT_TIMEOUT || '30000'),
  // Rate limiting (window is expressed in minutes, matching .env.example)
  RATE_LIMIT_WINDOW: Number(process.env.RATE_LIMIT_WINDOW || '15'),
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  services: {
    user: process.env.USER_SERVICE_BASE!,
    task: process.env.TASK_SERVICE_BASE!,
    notification: process.env.NOTIFICATION_SERVICE_BASE!,
  },
};
