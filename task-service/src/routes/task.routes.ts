import { Router } from "express";
import * as TaskController from "../controllers/task.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.use(authenticate);

router.get("/", TaskController.getTasks);
router.post("/", TaskController.createTask);
router.get("/:id/comments", TaskController.getComments);
router.post("/:id/comments/read", TaskController.markCommentsRead);
router.post("/:id/comments", TaskController.createComment);
router.get("/:id/time-entries", TaskController.getTimeEntries);
router.post("/:id/time-entries", TaskController.createTimeEntry);
router.get("/:id/assignment-history", TaskController.getAssignmentHistory);
router.post("/:id/claim", TaskController.claimTask);
router.patch("/:id/assignment", TaskController.assignTask);
router.get("/:id", TaskController.getTask);
router.patch("/:id", TaskController.updateTask);
router.delete("/:id", TaskController.deleteTask);

export default router;
