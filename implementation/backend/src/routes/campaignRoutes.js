import express from "express";
import {
  verifyAndSaveCampaign,
  getAllCampaigns,
  getCampaignById,
  getCampaignByAddress,
  addDistributedFundsForCampaign,
} from "../controllers/campaignController.js";

const router = express.Router();

// Verify transaction and save campaign
router.post("/verify", verifyAndSaveCampaign);

// Get all campaigns
router.get("/", getAllCampaigns);

// Get campaign by address
router.get("/address/:address", getCampaignByAddress);

// Update fundsDistributed after a successful claim
router.patch(
  "/address/:address/funds-distributed",
  addDistributedFundsForCampaign,
);

// Get single campaign
router.get("/:id", getCampaignById);

export default router;
