import { Router } from "express";
import {
  listNotifications,
  markRead,
  markAllRead,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.get("/", authenticate, listNotifications);
router.patch("/read-all", authenticate, markAllRead); // before /:id/read
router.patch("/:id/read", authenticate, markRead);
export default router;
