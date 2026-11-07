import { Pool, PoolClient } from "pg";
import config from ".";
import logger from "./logger";

const pool = new Pool({ connectionString: config.database_url });

export const connectDB = async (): Promise<void> => {
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS created_by_id INTEGER,
        ADD COLUMN IF NOT EXISTS assignee_id INTEGER;

      CREATE TABLE IF NOT EXISTS task_schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS task_assignment_events (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        actor_id INTEGER NOT NULL,
        assignee_id INTEGER,
        action VARCHAR(30) NOT NULL
          CHECK (action IN ('assigned', 'reassigned', 'claimed', 'unassigned', 'legacy_migrated')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS task_comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL,
        body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS task_comment_reads (
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (task_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS task_time_entries (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        minutes INTEGER NOT NULL CHECK (minutes BETWEEN 1 AND 1440),
        note VARCHAR(500),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS tasks_assignee_created_idx
        ON tasks (assignee_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS tasks_status_created_idx
        ON tasks (status, created_at DESC);
      CREATE INDEX IF NOT EXISTS task_comments_task_created_idx
        ON task_comments (task_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS task_time_entries_task_created_idx
        ON task_time_entries (task_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS task_assignment_events_task_created_idx
        ON task_assignment_events (task_id, created_at DESC);
    `);

    const migration = await client.query(
      "SELECT 1 FROM task_schema_migrations WHERE version = 1"
    );
    if (migration.rowCount === 0) {
      await client.query(`
        UPDATE tasks
        SET created_by_id = CASE
          WHEN user_id ~ '^[0-9]+$' THEN user_id::integer
          ELSE NULL
        END
        WHERE created_by_id IS NULL;

        UPDATE tasks
        SET assignee_id = created_by_id
        WHERE assignee_id IS NULL AND created_by_id IS NOT NULL;

        INSERT INTO task_assignment_events (task_id, actor_id, assignee_id, action, created_at)
        SELECT t.id, t.created_by_id, t.assignee_id, 'legacy_migrated', t.created_at
        FROM tasks t
        WHERE t.assignee_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM task_assignment_events e WHERE e.task_id = t.id
          );

        INSERT INTO task_schema_migrations (version) VALUES (1);
      `);
    }

    await client.query("COMMIT");
    logger.info("✅ Postgres connected & task schema ready");
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    logger.error("❌ Postgres connection failed:", error);
    process.exit(1);
  } finally {
    client?.release();
  }
};

export default pool;
