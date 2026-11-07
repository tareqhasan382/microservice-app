import { Router } from "express";
import * as NotificationController from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.use(authenticate);

router.get("/", NotificationController.getNotifications);
router.post("/", NotificationController.createNotification);
router.patch("/read-all", NotificationController.markAllRead);
router.patch("/:id/read", NotificationController.markRead);
router.delete("/:id", NotificationController.removeNotification);

export default router;
