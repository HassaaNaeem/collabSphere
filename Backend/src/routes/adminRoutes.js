import { Router } from "express";
import {
  getStats,
  getVerificationQueue,
  decideVerification,
  listUsers,
  deleteUser,
} from "../controllers/adminController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate, authorize("admin"));
router.get("/stats", getStats);
router.get("/verifications", getVerificationQueue);
router.patch("/verifications/:userId", decideVerification);
router.get("/users", listUsers);
router.delete("/users/:userId", deleteUser);
export default router;
