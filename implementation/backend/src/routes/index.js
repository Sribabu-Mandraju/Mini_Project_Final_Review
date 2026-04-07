import express from "express";
import healthRoutes from "./healthRoutes.js";
import daoMemberRoutes from "./daoMemberRoutes.js";
import proposalRoutes from "./proposalRoutes.js";
import donationRoutes from "./donationRoutes.js";
import campaignRoutes from "./campaignRoutes.js";

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/dao-members", daoMemberRoutes);
router.use("/proposals", proposalRoutes);
router.use("/donations", donationRoutes);
router.use("/campaigns", campaignRoutes);

export default router;
