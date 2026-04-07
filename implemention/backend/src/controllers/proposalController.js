import { sendError, sendSuccess } from "../utils/response.js";
import Proposal from "../models/Proposal.js";
import DaoMember from "../models/DaoMember.js";
import { verifyTransaction } from "../utils/blockchain.js";

/**
 * Verify proposal creation transaction and save proposal + campaign data
 * POST /api/proposals/verify
 */
export const verifyAndSaveProposal = async (req, res) => {
  try {
    const {
      transactionHash,
      onChainProposalId,
      proposerAddress,
      campaignTitle,
      campaignMetadataUri,
      fundsRequested,
      campaign,
    } = req.body;

    if (
      !transactionHash ||
      !proposerAddress ||
      !campaignTitle ||
      !campaignMetadataUri ||
      fundsRequested === undefined
    ) {
      return sendError(
        res,
        "transactionHash, proposerAddress, campaignTitle, campaignMetadataUri and fundsRequested are required",
        400,
      );
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return sendError(res, "Invalid transaction hash format", 400);
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(proposerAddress)) {
      return sendError(res, "Invalid Ethereum address format", 400);
    }

    const numericFunds = Number(fundsRequested);
    if (!Number.isFinite(numericFunds) || numericFunds <= 0) {
      return sendError(res, "Invalid fundsRequested value", 400);
    }

    // Check for duplicate transaction
    const existing = await Proposal.findOne({ transactionHash });
    if (existing) {
      // Allow syncing onChainProposalId for older records that were created before we stored it
      if (!existing.onChainProposalId && onChainProposalId) {
        existing.onChainProposalId = String(onChainProposalId);
        await existing.save();

        return sendSuccess(res, "Proposal on-chain id synced successfully", {
          proposal: {
            id: existing._id,
            onChainProposalId: existing.onChainProposalId,
            transactionHash: existing.transactionHash,
            proposerAddress: existing.proposerAddress,
            campaignTitle: existing.campaignTitle,
            campaignMetadataUri: existing.campaignMetadataUri,
            fundsRequested: existing.fundsRequested,
            campaign: existing.campaign,
            forVotes: existing.forVotes,
            againstVotes: existing.againstVotes,
            state: existing.state,
            endTime: existing.endTime,
            createdAt: existing.createdAt,
          },
        });
      }

      return sendError(
        res,
        "Proposal for this transaction already exists",
        409,
      );
    }

    // Verify transaction exists on blockchain
    const transactionExists = await verifyTransaction(transactionHash);

    if (!transactionExists) {
      return sendError(
        res,
        "Transaction does not exist on blockchain or verification failed",
        404,
      );
    }

    const proposal = new Proposal({
      onChainProposalId: onChainProposalId ? String(onChainProposalId) : null,
      transactionHash,
      proposerAddress: proposerAddress.toLowerCase(),
      campaignTitle,
      campaignMetadataUri,
      fundsRequested: numericFunds,
      campaign: {
        ...(campaign || {}),
        // Normalize pincodes to strings to match schema
        pincodes: Array.isArray(campaign?.pincodes)
          ? campaign.pincodes.map((p) => String(p))
          : [],
      },
      // initialize vote tracking
      forVotes: 0,
      againstVotes: 0,
      state: "Active",
    });

    await proposal.save();

    return sendSuccess(
      res,
      "Proposal created and saved successfully",
      {
        proposal: {
          id: proposal._id,
          onChainProposalId: proposal.onChainProposalId,
          transactionHash: proposal.transactionHash,
          proposerAddress: proposal.proposerAddress,
          campaignTitle: proposal.campaignTitle,
          campaignMetadataUri: proposal.campaignMetadataUri,
          fundsRequested: proposal.fundsRequested,
          campaign: proposal.campaign,
          forVotes: proposal.forVotes,
          againstVotes: proposal.againstVotes,
          state: proposal.state,
          endTime: proposal.endTime,
          createdAt: proposal.createdAt,
        },
      },
      201,
    );
  } catch (error) {
    console.error("Error verifying and saving proposal:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};

/**
 * Get all proposals
 * GET /api/proposals
 */
export const getAllProposals = async (_req, res) => {
  try {
    const proposals = await Proposal.find().sort({ createdAt: -1 });

    return sendSuccess(res, "Proposals retrieved successfully", {
      proposals: proposals.map((proposal) => ({
        id: proposal._id,
        onChainProposalId: proposal.onChainProposalId,
        transactionHash: proposal.transactionHash,
        proposerAddress: proposal.proposerAddress,
        campaignTitle: proposal.campaignTitle,
        campaignMetadataUri: proposal.campaignMetadataUri,
        fundsRequested: proposal.fundsRequested,
        campaign: proposal.campaign,
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        state: proposal.state,
        endTime: proposal.endTime,
        createdAt: proposal.createdAt,
      })),
      count: proposals.length,
    });
  } catch (error) {
    console.error("Error retrieving proposals:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};

/**
 * Get a single proposal by id
 * GET /api/proposals/:id
 */
export const getProposalById = async (req, res) => {
  try {
    const { id } = req.params;

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return sendError(res, "Proposal not found", 404);
    }

    return sendSuccess(res, "Proposal retrieved successfully", {
      proposal: {
        id: proposal._id,
        onChainProposalId: proposal.onChainProposalId,
        transactionHash: proposal.transactionHash,
        proposerAddress: proposal.proposerAddress,
        campaignTitle: proposal.campaignTitle,
        campaignMetadataUri: proposal.campaignMetadataUri,
        fundsRequested: proposal.fundsRequested,
        campaign: proposal.campaign,
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        state: proposal.state,
        endTime: proposal.endTime,
        createdAt: proposal.createdAt,
      },
    });
  } catch (error) {
    console.error("Error retrieving proposal:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};

/**
 * Verify a vote transaction and update stored vote counts
 * POST /api/proposals/vote/verify
 */
export const verifyAndSaveProposalVote = async (req, res) => {
  try {
    const {
      transactionHash,
      onChainProposalId,
      support,
      voterAddress,
    } = req.body;

    if (
      !transactionHash ||
      onChainProposalId === undefined ||
      support === undefined
    ) {
      return sendError(
        res,
        "transactionHash, onChainProposalId and support are required",
        400,
      );
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return sendError(res, "Invalid transaction hash format", 400);
    }

    if (voterAddress && !/^0x[a-fA-F0-9]{40}$/.test(voterAddress)) {
      return sendError(
        res,
        "Invalid Ethereum address format for voterAddress",
        400,
      );
    }

    // Verify transaction exists on blockchain
    const transactionExists = await verifyTransaction(transactionHash);

    if (!transactionExists) {
      return sendError(
        res,
        "Transaction does not exist on blockchain or verification failed",
        404,
      );
    }

    const proposal = await Proposal.findOne({
      onChainProposalId: String(onChainProposalId),
    });

    if (!proposal) {
      return sendError(
        res,
        "Proposal not found for given onChainProposalId",
        404,
      );
    }

    // Update vote counts
    if (support) {
      proposal.forVotes = (proposal.forVotes || 0) + 1;
    } else {
      proposal.againstVotes = (proposal.againstVotes || 0) + 1;
    }

    // Check if proposal should transition to "Passed" state
    // Only update state if it's still "Active"
    if (proposal.state === "Active") {
      // Get total active DAO members
      const totalMembers = await DaoMember.countDocuments({
        isDaoMember: true,
      });

      // Calculate voting threshold (60% of total members)
      const requiredVotesPercentage = 60;
      const requiredVotes = Math.ceil(
        (totalMembers * requiredVotesPercentage) / 100,
      );

      console.log(
        `[Proposal ${proposal.onChainProposalId}] Vote check: forVotes=${proposal.forVotes}, requiredVotes=${requiredVotes}, totalMembers=${totalMembers}`,
      );

      // Check if proposal has passed (forVotes >= requiredVotes)
      if (proposal.forVotes >= requiredVotes) {
        proposal.state = "Passed";
        console.log(
          `[Proposal ${proposal.onChainProposalId}] State updated to "Passed"`,
        );
      } else {
        // Check if voting period has ended
        const currentTime = Math.floor(Date.now() / 1000);
        if (proposal.endTime && currentTime >= proposal.endTime) {
          // Voting period ended but threshold not met
          proposal.state = "Rejected";
          console.log(
            `[Proposal ${proposal.onChainProposalId}] State updated to "Rejected" (voting period ended)`,
          );
        }
      }
    }

    await proposal.save();

    return sendSuccess(res, "Vote recorded successfully", {
      proposal: {
        id: proposal._id,
        onChainProposalId: proposal.onChainProposalId,
        transactionHash: proposal.transactionHash,
        proposerAddress: proposal.proposerAddress,
        campaignTitle: proposal.campaignTitle,
        campaignMetadataUri: proposal.campaignMetadataUri,
        fundsRequested: proposal.fundsRequested,
        campaign: proposal.campaign,
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        state: proposal.state,
        endTime: proposal.endTime,
        createdAt: proposal.createdAt,
      },
    });
  } catch (error) {
    console.error("Error verifying and saving proposal vote:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};

/**
 * Manually check and update proposal state based on current votes
 * POST /api/proposals/:id/check-state
 */
export const checkAndUpdateProposalState = async (req, res) => {
  try {
    const { id } = req.params;

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return sendError(res, "Proposal not found", 404);
    }

    // Only update state if it's still "Active"
    if (proposal.state === "Active") {
      // Get total active DAO members
      const totalMembers = await DaoMember.countDocuments({
        isDaoMember: true,
      });

      // Calculate voting threshold (60% of total members)
      const requiredVotesPercentage = 60;
      const requiredVotes = Math.ceil(
        (totalMembers * requiredVotesPercentage) / 100,
      );

      // Check if proposal has passed (forVotes >= requiredVotes)
      if (proposal.forVotes >= requiredVotes) {
        proposal.state = "Passed";
      } else {
        // Check if voting period has ended
        const currentTime = Math.floor(Date.now() / 1000);
        if (proposal.endTime && currentTime >= proposal.endTime) {
          // Voting period ended but threshold not met
          proposal.state = "Rejected";
        }
      }

      await proposal.save();
    }

    return sendSuccess(res, "Proposal state checked and updated", {
      proposal: {
        id: proposal._id,
        onChainProposalId: proposal.onChainProposalId,
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        state: proposal.state,
      },
    });
  } catch (error) {
    console.error("Error checking proposal state:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};
