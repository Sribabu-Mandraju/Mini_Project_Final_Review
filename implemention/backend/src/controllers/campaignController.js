import Campaign from "../models/Campaign.js";
import Proposal from "../models/Proposal.js";
import { verifyTransaction } from "../utils/blockchain.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * Verify executeProposal transaction and save campaign
 * POST /api/campaigns/verify
 */
export const verifyAndSaveCampaign = async (req, res) => {
  try {
    const {
      transactionHash,
      onChainProposalId,
      campaignAddress,
      donationPeriod,
      registrationPeriod,
      waitingPeriod,
      distributionPeriod,
    } = req.body;

    if (
      !transactionHash ||
      !onChainProposalId ||
      !campaignAddress ||
      donationPeriod === undefined ||
      registrationPeriod === undefined ||
      waitingPeriod === undefined ||
      distributionPeriod === undefined
    ) {
      return sendError(
        res,
        "transactionHash, onChainProposalId, campaignAddress, and all periods are required",
        400,
      );
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return sendError(res, "Invalid transaction hash format", 400);
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(campaignAddress)) {
      return sendError(res, "Invalid campaign address format", 400);
    }

    // Check for duplicate transaction
    const existingCampaign = await Campaign.findOne({ transactionHash });
    if (existingCampaign) {
      return sendError(
        res,
        "Campaign for this transaction already exists",
        409,
      );
    }

    // Check if campaign address already exists (normalize to lowercase for comparison)
    const existingByAddress = await Campaign.findOne({
      campaignAddress: campaignAddress.toLowerCase(),
    });
    if (existingByAddress) {
      return sendError(res, "Campaign with this address already exists", 409);
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

    // Find the proposal
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

    // Check if proposal is in "Passed" state
    if (proposal.state !== "Passed") {
      return sendError(
        res,
        `Proposal must be in "Passed" state to execute. Current state: ${proposal.state}`,
        400,
      );
    }

    // Create campaign
    const campaign = new Campaign({
      campaignAddress: campaignAddress.toLowerCase(),
      proposalId: proposal._id,
      onChainProposalId: String(onChainProposalId),
      transactionHash,
      title: proposal.campaignTitle,
      descriptionURI: proposal.campaignMetadataUri,
      pincodes:
        proposal.campaign?.pincodes
          ?.map((p) => {
            const numeric = parseInt(p, 10);
            return Number.isFinite(numeric) ? numeric : null;
          })
          .filter((p) => p !== null) ?? [],
      donationPeriod: Number(donationPeriod),
      registrationPeriod: Number(registrationPeriod),
      waitingPeriod: Number(waitingPeriod),
      distributionPeriod: Number(distributionPeriod),
      fundsAllocated: proposal.fundsRequested,
      fundsDistributed: 0,
    });

    await campaign.save();

    // Update proposal state to "Executed" and set campaignAddress
    proposal.state = "Executed";
    proposal.campaignAddress = campaignAddress.toLowerCase();
    await proposal.save();

    return sendSuccess(
      res,
      "Campaign created and saved successfully",
      {
        campaign: {
          id: campaign._id,
          campaignAddress: campaign.campaignAddress,
          proposalId: campaign.proposalId,
          onChainProposalId: campaign.onChainProposalId,
          transactionHash: campaign.transactionHash,
          title: campaign.title,
          descriptionURI: campaign.descriptionURI,
          pincodes: campaign.pincodes,
          donationPeriod: campaign.donationPeriod,
          registrationPeriod: campaign.registrationPeriod,
          waitingPeriod: campaign.waitingPeriod,
          distributionPeriod: campaign.distributionPeriod,
          fundsAllocated: campaign.fundsAllocated,
          fundsDistributed: campaign.fundsDistributed,
          createdAt: campaign.createdAt,
        },
      },
      201,
    );
  } catch (error) {
    console.error("Error verifying and saving campaign:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};

/**
 * Get all campaigns
 * GET /api/campaigns
 */
export const getAllCampaigns = async (_req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate("proposalId", "campaignTitle campaignMetadataUri")
      .sort({ createdAt: -1 });

    return sendSuccess(res, "Campaigns retrieved successfully", {
      campaigns,
    });
  } catch (error) {
    console.error("Error retrieving campaigns:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};

/**
 * Get campaign by ID
 * GET /api/campaigns/:id
 */
export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id).populate(
      "proposalId",
      "campaignTitle campaignMetadataUri campaign",
    );

    if (!campaign) {
      return sendError(res, "Campaign not found", 404);
    }

    return sendSuccess(res, "Campaign retrieved successfully", {
      campaign,
    });
  } catch (error) {
    console.error("Error retrieving campaign:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};

/**
 * Get campaign by address
 * GET /api/campaigns/address/:address
 */
export const getCampaignByAddress = async (req, res) => {
  try {
    const { address } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return sendError(res, "Invalid campaign address format", 400);
    }

    const campaign = await Campaign.findOne({
      campaignAddress: address.toLowerCase(),
    }).populate("proposalId", "campaignTitle campaignMetadataUri campaign");

    if (!campaign) {
      return sendError(res, "Campaign not found", 404);
    }

    return sendSuccess(res, "Campaign retrieved successfully", {
      campaign,
    });
  } catch (error) {
    console.error("Error retrieving campaign:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};

/**
 * Increment fundsDistributed for a campaign after a victim claims funds.
 * PATCH /api/campaigns/address/:address/funds-distributed
 * Body: { amount: number }
 */
export const addDistributedFundsForCampaign = async (req, res) => {
  try {
    const { address } = req.params;
    const { amount } = req.body || {};

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return sendError(res, "Invalid campaign address format", 400);
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return sendError(res, "amount must be a positive number", 400);
    }

    const campaign = await Campaign.findOne({
      campaignAddress: address.toLowerCase(),
    });

    if (!campaign) {
      return sendError(res, "Campaign not found", 404);
    }

    campaign.fundsDistributed = Math.max(
      0,
      (campaign.fundsDistributed || 0) + numericAmount,
    );

    await campaign.save();

    return sendSuccess(res, "Campaign funds updated successfully", {
      campaign,
    });
  } catch (error) {
    console.error("Error updating campaign funds:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};
