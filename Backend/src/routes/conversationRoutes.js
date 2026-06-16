import { Router } from "express";
import {
  startConversation,
  listConversations,
  getMessages,
  sendMessage,
} from "../controllers/conversationController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.get("/", authenticate, listConversations);
router.post(
  "/",
  authenticate,
  authorize("influencer", "media_house"),
  startConversation,
);
router.get("/:id/messages", authenticate, getMessages);
router.post(
  "/:id/messages",
  authenticate,
  authorize("influencer", "media_house"),
  sendMessage,
);
export default router;
