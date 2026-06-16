import { Router } from "express";
import {
  listCampaigns,
  listMyCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
} from "../controllers/campaignController.js";
import {
  authenticate,
  authorize,
  requireApproved,
} from "../middleware/auth.js";

const router = Router();
router.get("/", listCampaigns);
router.get("/mine", authenticate, authorize("media_house"), listMyCampaigns); // before /:id
router.post(
  "/",
  authenticate,
  authorize("media_house"),
  requireApproved,
  createCampaign,
);
router.get("/:id", getCampaign);
router.patch(
  "/:id",
  authenticate,
  authorize("admin", "media_house"),
  updateCampaign,
);
export default router;
