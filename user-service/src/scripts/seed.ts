import dotenv from "dotenv";
import Path from "path";

dotenv.config({ path: Path.join(process.cwd(), ".env") });

import { pool, ensureAdmin, readAdminEnv, hashPassword } from "./create-admin";

type TaskStatus = "pending" | "in_progress" | "done";
type SeedUser = { name: string; email: string; password: string };
type SeedTask = { title: string; description: string | null; status: TaskStatus };
type SeedNotification = { message: string; isRead: boolean };

const USERS: SeedUser[] = [
  { name: "Alice Carter", email: "alice@example.com", password: "Passw0rd!" },
  { name: "Bob Nguyen", email: "bob@example.com", password: "Passw0rd!" },
];

const TASKS: SeedTask[] = [
  { title: "Write project README", description: "Document all APIs", status: "in_progress" },
  { title: "Set up CI pipeline", description: "GitHub Actions", status: "pending" },
  { title: "Fix login refresh bug", description: "Read cookie for token", status: "done" },
];

const NOTIFICATIONS: SeedNotification[] = [
  { message: "Welcome to notifications", isRead: false },
  { message: "Your task was assigned", isRead: false },
  { message: "Password changed successfully", isRead: true },
];

// Keeps the seed runnable against a fresh database (mirrors each service's schema).
const ensureSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      image VARCHAR(500),
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      user_id VARCHAR(255) NOT NULL,
      created_by_id INTEGER,
      assignee_id INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS created_by_id INTEGER,
      ADD COLUMN IF NOT EXISTS assignee_id INTEGER;

    CREATE TABLE IF NOT EXISTS task_assignment_events (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      actor_id INTEGER NOT NULL,
      assignee_id INTEGER,
      action VARCHAR(30) NOT NULL
        CHECK (action IN ('assigned', 'reassigned', 'claimed', 'unassigned', 'legacy_migrated')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
};

const upsertDemoUser = async ({ name, email, password }: SeedUser) => {
  const hashedPassword = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'user')
     ON CONFLICT (email)
     DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
     RETURNING id, email`,
    [name, email.toLowerCase(), hashedPassword]
  );
  return rows[0] as { id: number; email: string };
};

const seedTasks = async (ownerId: number, tasks: SeedTask[]) => {
  const { rows } = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM tasks WHERE user_id = $1`,
    [String(ownerId)]
  );
  if (rows[0].count > 0) return 0;

  for (const task of tasks) {
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO tasks
         (title, description, status, user_id, created_by_id, assignee_id)
       VALUES ($1, $2, $3, $4, $4, $4)
       RETURNING id`,
      [task.title, task.description, task.status, String(ownerId)]
    );
    await pool.query(
      `INSERT INTO task_assignment_events (task_id, actor_id, assignee_id, action)
       VALUES ($1, $2, $2, 'legacy_migrated')`,
      [rows[0].id, ownerId]
    );
  }
  return tasks.length;
};

const seedNotifications = async (ownerId: number, items: SeedNotification[]) => {
  const { rows } = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1`,
    [String(ownerId)]
  );
  if (rows[0].count > 0) return 0;

  for (const item of items) {
    await pool.query(
      `INSERT INTO notifications (user_id, message, is_read) VALUES ($1, $2, $3)`,
      [String(ownerId), item.message, item.isRead]
    );
  }
  return items.length;
};

const run = async () => {
  await ensureSchema();

  const admin = await ensureAdmin(readAdminEnv());
  console.log(`✅ Admin ready   -> ${admin.email} (role=${admin.role})`);

  const [alice, bob] = await Promise.all(USERS.map(upsertDemoUser));
  console.log(`✅ Users ready   -> ${alice.email}, ${bob.email}`);

  const taskCount = await seedTasks(alice.id, TASKS);
  console.log(taskCount ? `✅ Seeded ${taskCount} tasks for ${alice.email}` : `ℹ️  Tasks already present, skipped`);

  const notificationCount = await seedNotifications(bob.id, NOTIFICATIONS);
  console.log(
    notificationCount
      ? `✅ Seeded ${notificationCount} notifications for ${bob.email}`
      : `ℹ️  Notifications already present, skipped`
  );

  console.log("\n🎉 Seed complete. Login with:");
  console.log(`   admin : ${admin.email} / <ADMIN_PASSWORD>`);
  console.log(`   user  : ${alice.email} / Passw0rd!`);
};

run()
  .catch((error: unknown) => {
    console.error("❌ Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
