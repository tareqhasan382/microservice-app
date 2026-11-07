import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import * as TaskService from "../services/task.service";

const parseId = (value: unknown): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid task id");
  return id;
};

export const getTasks = catchAsync(async (req: Request, res: Response) => {
  const { tasks, meta } = await TaskService.listTasks(
    req.user!,
    req.query.page,
    req.query.limit,
    req.query.status,
    req.query.search,
    req.query.assignee
  );
  res.status(200).json(new ApiResponse(true, 200, "Tasks fetched successfully", { tasks, meta }));
});

export const getTask = catchAsync(async (req: Request, res: Response) => {
  const task = await TaskService.getTask(req.user!, parseId(req.params.id));
  res.status(200).json(new ApiResponse(true, 200, "Task fetched successfully", task));
});

export const createTask = catchAsync(async (req: Request, res: Response) => {
  const task = await TaskService.createTask(req.user!, req.body);
  res.status(201).json(new ApiResponse(true, 201, "Task created successfully", task));
});

export const updateTask = catchAsync(async (req: Request, res: Response) => {
  const task = await TaskService.updateTask(req.user!, parseId(req.params.id), req.body);
  res.status(200).json(new ApiResponse(true, 200, "Task updated successfully", task));
});

export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  await TaskService.deleteTask(req.user!, parseId(req.params.id));
  res.status(200).json(new ApiResponse(true, 200, "Task deleted successfully"));
});

export const assignTask = catchAsync(async (req: Request, res: Response) => {
  const task = await TaskService.assignTask(
    req.user!,
    parseId(req.params.id),
    req.body.assigneeId
  );
  res.status(200).json(new ApiResponse(true, 200, "Task assignment updated", task));
});

export const claimTask = catchAsync(async (req: Request, res: Response) => {
  const task = await TaskService.claimTask(req.user!, parseId(req.params.id));
  res.status(200).json(new ApiResponse(true, 200, "Task claimed successfully", task));
});

export const getComments = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.listComments(
    req.user!,
    parseId(req.params.id),
    req.query.page,
    req.query.limit
  );
  res.status(200).json(new ApiResponse(true, 200, "Task comments fetched successfully", result));
});

export const createComment = catchAsync(async (req: Request, res: Response) => {
  const comment = await TaskService.addComment(
    req.user!,
    parseId(req.params.id),
    req.body.body
  );
  res.status(201).json(new ApiResponse(true, 201, "Comment added successfully", comment));
});

export const markCommentsRead = catchAsync(async (req: Request, res: Response) => {
  await TaskService.markCommentsRead(req.user!, parseId(req.params.id));
  res.status(200).json(new ApiResponse(true, 200, "Comments marked as read"));
});

export const getTimeEntries = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.listTimeEntries(
    req.user!,
    parseId(req.params.id),
    req.query.page,
    req.query.limit
  );
  res.status(200).json(new ApiResponse(true, 200, "Task time entries fetched successfully", result));
});

export const createTimeEntry = catchAsync(async (req: Request, res: Response) => {
  const entry = await TaskService.addTimeEntry(
    req.user!,
    parseId(req.params.id),
    req.body
  );
  res.status(201).json(new ApiResponse(true, 201, "Time entry added successfully", entry));
});

export const getAssignmentHistory = catchAsync(async (req: Request, res: Response) => {
  const history = await TaskService.listAssignmentHistory(req.user!, parseId(req.params.id));
  res.status(200).json(new ApiResponse(true, 200, "Assignment history fetched successfully", history));
});
