import { TaskModel } from "../models/task.model";
import { ICreateTask, IUpdateTask, TaskStatus } from "../models/task.interface";
import {
  publishTaskAssigned,
  publishTaskCommented,
  publishTaskCreated,
  publishTaskDeleted,
  publishTaskUpdated,
} from "../events/task.publisher";
import ApiError from "../utils/ApiError";

const VALID_STATUS: TaskStatus[] = ["pending", "in_progress", "done"];

type Actor = { id: string; role: "admin" | "user" };
const actorId = (actor: Actor): number => {
  const id = Number(actor.id);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(401, "Invalid user identity");
  return id;
};

const canAccessTask = (actor: Actor, assigneeId: number | null): boolean =>
  actor.role === "admin" || assigneeId === null || assigneeId === actorId(actor);

const canWorkOnTask = (actor: Actor, assigneeId: number | null): boolean =>
  actor.role === "admin" || assigneeId === actorId(actor);

const requireTask = async (id: number) => {
  const task = await TaskModel.findById(id);
  if (!task) throw new ApiError(404, "Task not found");
  return task;
};

const requireWorkAccess = async (actor: Actor, id: number) => {
  const task = await requireTask(id);
  if (!canWorkOnTask(actor, task.assignee_id)) {
    throw new ApiError(403, "Claim this task before adding work activity");
  }
  return task;
};

const pageValue = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(Math.floor(parsed), 1) : fallback;
};

const assertStatus = (status: unknown): TaskStatus => {
  if (!VALID_STATUS.includes(status as TaskStatus)) {
    throw new ApiError(400, `Status must be one of: ${VALID_STATUS.join(", ")}`);
  }
  return status as TaskStatus;
};

export const listTasks = async (
  actor: Actor,
  page: unknown,
  limit: unknown,
  status?: unknown,
  search?: unknown,
  assignee?: unknown
) => {
  const safePage = pageValue(page, 1);
  const safeLimit = Math.min(pageValue(limit, 10), 100);
  const filterStatus = status !== undefined && status !== "" ? assertStatus(status) : undefined;
  const filterSearch = String(search ?? "").trim().slice(0, 100);
  let assigneeId: number | "unassigned" | undefined;
  if (assignee !== undefined && assignee !== "") {
    if (actor.role !== "admin") throw new ApiError(403, "Only administrators can filter by assignee");
    if (assignee === "unassigned") {
      assigneeId = "unassigned";
    } else {
      assigneeId = Number(assignee);
      if (!Number.isInteger(assigneeId) || assigneeId <= 0) {
        throw new ApiError(400, "Invalid assignee filter");
      }
    }
  }

  const { tasks, total } = await TaskModel.findMany({
    actorId: actorId(actor),
    isAdmin: actor.role === "admin",
    status: filterStatus,
    search: filterSearch || undefined,
    assigneeId,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  });

  return { tasks, meta: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
};

export const getTask = async (actor: Actor, id: number) => {
  const task = await requireTask(id);
  if (!canAccessTask(actor, task.assignee_id)) throw new ApiError(404, "Task not found");
  return task;
};

export const createTask = async (actor: Actor, data: ICreateTask) => {
  if (actor.role !== "admin") throw new ApiError(403, "Only administrators can create tasks");
  const title = String(data.title ?? "").trim();
  if (!title) throw new ApiError(400, "Title is required");

  const status = data.status !== undefined ? assertStatus(data.status) : undefined;
  const assigneeId = data.assigneeId === undefined || data.assigneeId === null
    ? null
    : Number(data.assigneeId);
  if (assigneeId !== null) {
    if (!Number.isInteger(assigneeId) || assigneeId <= 0) {
      throw new ApiError(400, "Invalid assignee");
    }
    if (!(await TaskModel.userCanBeAssigned(assigneeId))) {
      throw new ApiError(404, "Assignee not found");
    }
  }
  const task = await TaskModel.create(actorId(actor), {
    title,
    description: data.description ?? null,
    status,
    assigneeId,
  });
  publishTaskCreated(task);
  return task;
};

export const updateTask = async (actor: Actor, id: number, data: IUpdateTask) => {
  const task = await requireTask(id);
  if (!canAccessTask(actor, task.assignee_id)) throw new ApiError(404, "Task not found");
  if (actor.role !== "admin" && !canWorkOnTask(actor, task.assignee_id)) {
    throw new ApiError(403, "Claim this task before updating its status");
  }
  if (actor.role !== "admin" && (data.title !== undefined || data.description !== undefined)) {
    throw new ApiError(403, "Only administrators can edit task details");
  }
  if (data.title !== undefined && !String(data.title).trim()) {
    throw new ApiError(400, "Title cannot be empty");
  }
  if (data.status !== undefined) assertStatus(data.status);

  const payload: IUpdateTask = { ...data };
  if (payload.title !== undefined) payload.title = String(payload.title).trim();

  const updated = await TaskModel.update(id, payload);
  if (!updated) throw new ApiError(404, "Task not found");
  publishTaskUpdated(updated, actorId(actor));
  return updated;
};

export const deleteTask = async (actor: Actor, id: number) => {
  if (actor.role !== "admin") throw new ApiError(403, "Only administrators can delete tasks");
  const deleted = await TaskModel.remove(id);
  if (!deleted) throw new ApiError(404, "Task not found");
  publishTaskDeleted(deleted, actorId(actor));
};

export const assignTask = async (actor: Actor, id: number, target: unknown) => {
  if (actor.role !== "admin") throw new ApiError(403, "Only administrators can assign tasks");
  const task = await requireTask(id);
  const assigneeId = target === null || target === "" ? null : Number(target);
  if (assigneeId !== null) {
    if (!Number.isInteger(assigneeId) || assigneeId <= 0) {
      throw new ApiError(400, "Invalid assignee");
    }
    if (!(await TaskModel.userCanBeAssigned(assigneeId))) {
      throw new ApiError(404, "Assignee not found");
    }
  }
  const updated = await TaskModel.assign(id, actorId(actor), assigneeId);
  if (!updated) throw new ApiError(404, "Task not found");
  if (task.assignee_id !== updated.assignee_id) {
    publishTaskAssigned(updated, actorId(actor));
  }
  return updated;
};

export const claimTask = async (actor: Actor, id: number) => {
  if (actor.role !== "user") throw new ApiError(403, "Only members can claim open tasks");
  const claimed = await TaskModel.claim(id, actorId(actor));
  if (claimed) {
    publishTaskAssigned(claimed, actorId(actor));
    return claimed;
  }
  const current = await TaskModel.findById(id);
  if (!current) throw new ApiError(404, "Task not found");
  throw new ApiError(409, "This task has already been claimed");
};

export const listComments = async (actor: Actor, id: number, page: unknown, limit: unknown) => {
  const task = await requireWorkAccess(actor, id);
  const safePage = pageValue(page, 1);
  const safeLimit = Math.min(pageValue(limit, 20), 100);
  const { comments, total } = await TaskModel.listComments(
    task.id,
    safeLimit,
    (safePage - 1) * safeLimit
  );
  return { comments, meta: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
};

export const addComment = async (actor: Actor, id: number, value: unknown) => {
  const task = await requireWorkAccess(actor, id);
  const body = String(value ?? "").trim();
  if (!body) throw new ApiError(400, "Comment cannot be empty");
  if (body.length > 5000) throw new ApiError(400, "Comment cannot exceed 5000 characters");
  const comment = await TaskModel.addComment(task.id, actorId(actor), body);
  publishTaskCommented(task, {
    author_id: comment.author_id,
    author_name: comment.author_name,
    body: comment.body,
  });
  return comment;
};

export const markCommentsRead = async (actor: Actor, id: number) => {
  const task = await requireWorkAccess(actor, id);
  await TaskModel.markCommentsRead(task.id, actorId(actor));
};

export const listTimeEntries = async (actor: Actor, id: number, page: unknown, limit: unknown) => {
  const task = await requireWorkAccess(actor, id);
  const safePage = pageValue(page, 1);
  const safeLimit = Math.min(pageValue(limit, 20), 100);
  const { entries, total } = await TaskModel.listTimeEntries(
    task.id,
    safeLimit,
    (safePage - 1) * safeLimit
  );
  return { entries, meta: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
};

export const addTimeEntry = async (
  actor: Actor,
  id: number,
  value: { minutes?: unknown; note?: unknown }
) => {
  const task = await requireWorkAccess(actor, id);
  const minutes = Number(value.minutes);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
    throw new ApiError(400, "Time must be between 1 and 1440 minutes");
  }
  const note = String(value.note ?? "").trim();
  if (note.length > 500) throw new ApiError(400, "Time note cannot exceed 500 characters");
  return TaskModel.addTimeEntry(task.id, actorId(actor), minutes, note || null);
};

export const listAssignmentHistory = async (actor: Actor, id: number) => {
  const task = await requireTask(id);
  if (!canWorkOnTask(actor, task.assignee_id)) {
    throw new ApiError(403, "Only the assignee and administrators can view assignment history");
  }
  return TaskModel.listAssignmentHistory(task.id);
};
