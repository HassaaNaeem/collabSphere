import { Router } from "express";
import {
  listApplications,
  createApplication,
  updateApplicationStatus,
} from "../controllers/applicationController.js";
import {
  authenticate,
  authorize,
  requireApproved,
} from "../middleware/auth.js";

const router = Router();
router.get("/", authenticate, listApplications);
router.post(
  "/",
  authenticate,
  authorize("influencer"),
  requireApproved,
  createApplication,
);
router.patch(
  "/:id",
  authenticate,
  authorize("media_house"),
  updateApplicationStatus,
);
export default router;
