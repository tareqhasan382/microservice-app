import { Router } from "express";
import * as UserController from "../controllers/user.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

// ---- Current user (any authenticated user) ----
router.get("/me", authenticate, UserController.getMe);
router.patch("/me", authenticate, UserController.updateMe);
router.put("/me/password", authenticate, UserController.changeMyPassword);

// ---- Admin only ----
router.get("/", authenticate, authorize("admin"), UserController.getUsers);
router.get("/:id", authenticate, authorize("admin"), UserController.getUser);
router.patch("/:id", authenticate, authorize("admin"), UserController.updateUser);
router.delete("/:id", authenticate, authorize("admin"), UserController.deleteUser);

export default router;
