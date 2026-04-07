import express from "express";
import {
  verifyAndSaveProposal,
  getAllProposals,
  getProposalById,
  verifyAndSaveProposalVote,
  checkAndUpdateProposalState,
} from "../controllers/proposalController.js";

const router = express.Router();

// Verify transaction and save proposal
router.post("/verify", verifyAndSaveProposal);

// Verify vote transaction and update vote counts
router.post("/vote/verify", verifyAndSaveProposalVote);

// Get all proposals (must come before /:id routes)
router.get("/", getAllProposals);

// Manually check and update proposal state (must come before /:id route)
router.post("/:id/check-state", checkAndUpdateProposalState);

// Get single proposal
router.get("/:id", getProposalById);

export default router;
