import pool from "../config/db";
import type { PoolClient } from "pg";
import type {
  ICreateTask,
  IUpdateTask,
  Task,
  TaskAssignmentEvent,
  TaskComment,
  TaskTimeEntry,
  TaskStatus,
} from "./task.interface";

const TASK_FROM = `
  FROM tasks t
  LEFT JOIN users assignee ON assignee.id = t.assignee_id
  LEFT JOIN users creator ON creator.id = COALESCE(
    t.created_by_id,
    CASE WHEN t.user_id ~ '^[0-9]+$' THEN t.user_id::integer ELSE NULL END
  )
  LEFT JOIN LATERAL (
    SELECT SUM(minutes)::int AS total_minutes
    FROM task_time_entries te
    WHERE te.task_id = t.id
  ) effort ON TRUE
`;

const TASK_SELECT = `
  SELECT t.id, t.title, t.description, t.status, t.user_id,
    t.created_by_id, creator.name AS created_by_name,
    t.assignee_id, assignee.name AS assignee_name, assignee.email AS assignee_email,
    COALESCE(effort.total_minutes, 0)::int AS total_minutes,
    t.created_at, t.updated_at
  ${TASK_FROM}
`;

type FindOptions = {
  actorId: number;
  isAdmin: boolean;
  status?: TaskStatus;
  search?: string;
  assigneeId?: number | "unassigned";
  limit: number;
  offset: number;
};

type TransactionClient = PoolClient;

const inTransaction = async <T>(work: (client: TransactionClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Data-access layer for tasks and their activity records.
export const TaskModel = {
  async findMany({
    actorId,
    isAdmin,
    status,
    search,
    assigneeId,
    limit,
    offset,
  }: FindOptions): Promise<{ tasks: Task[]; total: number }> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (!isAdmin) {
      values.push(actorId);
      conditions.push(`(t.assignee_id = $${values.length} OR t.assignee_id IS NULL)`);
    }
    if (status !== undefined) {
      values.push(status);
      conditions.push(`t.status = $${values.length}`);
    }
    if (assigneeId === "unassigned") {
      conditions.push("t.assignee_id IS NULL");
    } else if (assigneeId !== undefined) {
      values.push(assigneeId);
      conditions.push(`t.assignee_id = $${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      const queryParam = `$${values.length}`;
      conditions.push(`(
        t.title ILIKE ${queryParam}
        OR COALESCE(t.description, '') ILIKE ${queryParam}
        OR assignee.name ILIKE ${queryParam}
        OR assignee.email ILIKE ${queryParam}
        OR creator.name ILIKE ${queryParam}
      )`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await pool.query<Task>(
      `${TASK_SELECT} ${where}
       ORDER BY t.created_at DESC, t.id DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );
    const countResult = await pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total ${TASK_FROM} ${where}`,
      values
    );

    if (rows.length) {
      const ids = rows.map((task) => task.id);
      const { rows: unread } = await pool.query<{ task_id: number; count: number }>(
        `SELECT c.task_id, COUNT(*)::int AS count
         FROM task_comments c
         LEFT JOIN task_comment_reads r
           ON r.task_id = c.task_id AND r.user_id = $2
         WHERE c.task_id = ANY($1::int[])
           AND c.author_id <> $2
           AND c.created_at > COALESCE(r.last_read_at, to_timestamp(0))
         GROUP BY c.task_id`,
        [ids, actorId]
      );
      const byTask = new Map(unread.map((row) => [row.task_id, row.count]));
      for (const task of rows) {
        task.unread_comment_count = byTask.get(task.id) ?? 0;
      }
    }

    return { tasks: rows, total: countResult.rows[0].total };
  },

  async findById(id: number): Promise<Task | null> {
    const { rows } = await pool.query<Task>(
      `${TASK_SELECT} WHERE t.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async userCanBeAssigned(id: number): Promise<boolean> {
    const result = await pool.query("SELECT 1 FROM users WHERE id = $1 AND role = 'user'", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async create(actorId: number, data: ICreateTask): Promise<Task> {
    return inTransaction(async (client) => {
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO tasks (title, description, status, user_id, created_by_id, assignee_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          data.title,
          data.description ?? null,
          data.status ?? "pending",
          String(actorId),
          actorId,
          data.assigneeId ?? null,
        ]
      );

      const taskId = rows[0].id;
      if (data.assigneeId) {
        await client.query(
          `INSERT INTO task_assignment_events (task_id, actor_id, assignee_id, action)
           VALUES ($1, $2, $3, 'assigned')`,
          [taskId, actorId, data.assigneeId]
        );
      }
      const task = await client.query<Task>(`${TASK_SELECT} WHERE t.id = $1`, [taskId]);
      return task.rows[0];
    });
  },

  async update(id: number, data: IUpdateTask): Promise<Task | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) {
      values.push(data.title);
      fields.push(`title = $${values.length}`);
    }
    if (data.description !== undefined) {
      values.push(data.description);
      fields.push(`description = $${values.length}`);
    }
    if (data.status !== undefined) {
      values.push(data.status);
      fields.push(`status = $${values.length}`);
    }
    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = NOW()");
    values.push(id);
    const result = await pool.query<{ id: number }>(
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id`,
      values
    );
    return result.rows[0] ? this.findById(result.rows[0].id) : null;
  },

  async assign(id: number, actorId: number, assigneeId: number | null): Promise<Task | null> {
    return inTransaction(async (client) => {
      const currentResult = await client.query<{ assignee_id: number | null }>(
        "SELECT assignee_id FROM tasks WHERE id = $1 FOR UPDATE",
        [id]
      );
      if (!currentResult.rows[0]) return null;

      const previousAssignee = currentResult.rows[0].assignee_id;
      if (previousAssignee === assigneeId) {
        const current = await client.query<Task>(`${TASK_SELECT} WHERE t.id = $1`, [id]);
        return current.rows[0];
      }

      await client.query(
        "UPDATE tasks SET assignee_id = $1, updated_at = NOW() WHERE id = $2",
        [assigneeId, id]
      );
      const action = assigneeId === null
        ? "unassigned"
        : previousAssignee === null
          ? "assigned"
          : "reassigned";
      await client.query(
        `INSERT INTO task_assignment_events (task_id, actor_id, assignee_id, action)
         VALUES ($1, $2, $3, $4)`,
        [id, actorId, assigneeId, action]
      );
      const updated = await client.query<Task>(`${TASK_SELECT} WHERE t.id = $1`, [id]);
      return updated.rows[0] ?? null;
    });
  },

  async claim(id: number, actorId: number): Promise<Task | null> {
    return inTransaction(async (client) => {
      const claimed = await client.query<{ id: number }>(
        `UPDATE tasks SET assignee_id = $1, updated_at = NOW()
         WHERE id = $2 AND assignee_id IS NULL
         RETURNING id`,
        [actorId, id]
      );
      if (!claimed.rows[0]) return null;
      await client.query(
        `INSERT INTO task_assignment_events (task_id, actor_id, assignee_id, action)
         VALUES ($1, $2, $2, 'claimed')`,
        [id, actorId]
      );
      const task = await client.query<Task>(`${TASK_SELECT} WHERE t.id = $1`, [id]);
      return task.rows[0] ?? null;
    });
  },

  async remove(id: number): Promise<Task | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    return result.rowCount ? existing : null;
  },

  async listComments(taskId: number, limit: number, offset: number) {
    const { rows } = await pool.query<TaskComment>(
      `SELECT c.id, c.task_id, c.author_id, u.name AS author_name, c.body, c.created_at
       FROM task_comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC, c.id ASC
       LIMIT $2 OFFSET $3`,
      [taskId, limit, offset]
    );
    const count = await pool.query<{ total: number }>(
      "SELECT COUNT(*)::int AS total FROM task_comments WHERE task_id = $1",
      [taskId]
    );
    return { comments: rows, total: count.rows[0].total };
  },

  async addComment(taskId: number, authorId: number, body: string): Promise<TaskComment> {
    const { rows } = await pool.query<TaskComment>(
      `INSERT INTO task_comments (task_id, author_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, task_id, author_id, body, created_at`,
      [taskId, authorId, body]
    );
    const result = await pool.query<TaskComment>(
      `SELECT c.id, c.task_id, c.author_id, u.name AS author_name, c.body, c.created_at
       FROM task_comments c JOIN users u ON u.id = c.author_id WHERE c.id = $1`,
      [rows[0].id]
    );
    return result.rows[0];
  },

  async markCommentsRead(taskId: number, userId: number): Promise<void> {
    await pool.query(
      `INSERT INTO task_comment_reads (task_id, user_id, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (task_id, user_id)
       DO UPDATE SET last_read_at = NOW()`,
      [taskId, userId]
    );
  },

  async listTimeEntries(taskId: number, limit: number, offset: number) {
    const { rows } = await pool.query<TaskTimeEntry>(
      `SELECT e.id, e.task_id, e.user_id, u.name AS user_name,
        e.minutes, e.note, e.created_at
       FROM task_time_entries e
       JOIN users u ON u.id = e.user_id
       WHERE e.task_id = $1
       ORDER BY e.created_at DESC, e.id DESC
       LIMIT $2 OFFSET $3`,
      [taskId, limit, offset]
    );
    const count = await pool.query<{ total: number }>(
      "SELECT COUNT(*)::int AS total FROM task_time_entries WHERE task_id = $1",
      [taskId]
    );
    return { entries: rows, total: count.rows[0].total };
  },

  async addTimeEntry(
    taskId: number,
    userId: number,
    minutes: number,
    note: string | null
  ): Promise<TaskTimeEntry> {
    const { rows } = await pool.query<TaskTimeEntry>(
      `INSERT INTO task_time_entries (task_id, user_id, minutes, note)
       VALUES ($1, $2, $3, $4)
       RETURNING id, task_id, user_id, minutes, note, created_at`,
      [taskId, userId, minutes, note]
    );
    const result = await pool.query<TaskTimeEntry>(
      `SELECT e.id, e.task_id, e.user_id, u.name AS user_name,
        e.minutes, e.note, e.created_at
       FROM task_time_entries e JOIN users u ON u.id = e.user_id WHERE e.id = $1`,
      [rows[0].id]
    );
    return result.rows[0];
  },

  async listAssignmentHistory(taskId: number): Promise<TaskAssignmentEvent[]> {
    const { rows } = await pool.query<TaskAssignmentEvent>(
      `SELECT e.id, e.task_id, e.actor_id, actor.name AS actor_name,
        e.assignee_id, assignee.name AS assignee_name, e.action, e.created_at
       FROM task_assignment_events e
       JOIN users actor ON actor.id = e.actor_id
       LEFT JOIN users assignee ON assignee.id = e.assignee_id
       WHERE e.task_id = $1
       ORDER BY e.created_at DESC, e.id DESC`,
      [taskId]
    );
    return rows;
  },
};
