import { Pool } from "pg";
import config from ".";
import logger from "./logger";

const pool = new Pool({ connectionString: config.database_url });

export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    // Minimal schema for the notification-service scaffold.
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    client.release();
    logger.info("✅ Postgres connected & notifications table ready");
  } catch (error) {
    logger.error("❌ Postgres connection failed:", error);
    process.exit(1);
  }
};

export default pool;
