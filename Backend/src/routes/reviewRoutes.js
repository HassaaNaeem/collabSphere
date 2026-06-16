import { Router } from "express";
import {
  listReviews,
  setReviewHidden,
} from "../controllers/reviewController.js";
import { authenticate, authorize, optionalAuth } from "../middleware/auth.js";

const router = Router();
router.get("/", optionalAuth, listReviews);
router.patch("/:id", authenticate, authorize("admin"), setReviewHidden);
export default router;
