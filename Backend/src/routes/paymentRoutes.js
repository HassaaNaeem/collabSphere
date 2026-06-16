import { Router } from "express";
import { listPayments } from "../controllers/paymentController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.get("/", authenticate, listPayments);
export default router;
