import { Router } from "express";
import {
  createInvitation,
  listInvitations,
  decideInvitation,
} from "../controllers/invitationController.js";
import {
  authenticate,
  authorize,
  requireApproved,
} from "../middleware/auth.js";

const router = Router();
router.get("/", authenticate, listInvitations);
router.post(
  "/",
  authenticate,
  authorize("media_house"),
  requireApproved,
  createInvitation,
);
router.patch("/:id", authenticate, authorize("influencer"), decideInvitation);
export default router;
