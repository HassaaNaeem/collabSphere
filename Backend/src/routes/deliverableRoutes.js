import { Router } from "express";
import {
  listDeliverables,
  submitDeliverable,
  reviewDeliverable,
  reviewQueue,
} from "../controllers/deliverableController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.get("/inbox", authenticate, authorize("media_house"), reviewQueue); // before '/'
router.get("/", authenticate, listDeliverables);
router.post(
  "/:id/submit",
  authenticate,
  authorize("influencer"),
  submitDeliverable,
);
router.patch(
  "/:id/review",
  authenticate,
  authorize("media_house"),
  reviewDeliverable,
);
export default router;
