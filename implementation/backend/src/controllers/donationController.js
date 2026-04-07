import { sendSuccess, sendError } from "../utils/response.js";
import Donation from "../models/Donation.js";
import { getShortDonationError } from "../utils/donationErrors.js";

/**
 * Create a pending donation record (before user signs the contract tx).
 * POST /api/donations
 */
export const createDonation = async (req, res) => {
  try {
    const { donorAddress, amount, amountWei } = req.body;

    if (!donorAddress || amount == null || amount === "") {
      return sendError(res, "Donor address and amount are required", 400);
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(donorAddress)) {
      return sendError(res, "Invalid Ethereum address format", 400);
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return sendError(res, "Amount must be a positive number", 400);
    }

    const donation = new Donation({
      donorAddress: donorAddress.toLowerCase(),
      amount: numAmount,
      amountWei: amountWei || null,
      currency: "USDC",
      status: "pending",
    });

    await donation.save();

    return sendSuccess(res, "Donation record created", {
      donation: {
        id: donation._id,
        donorAddress: donation.donorAddress,
        amount: donation.amount,
        status: donation.status,
      },
    });
  } catch (err) {
    console.error("createDonation error:", err);
    return sendError(res, "Failed to create donation record", 500);
  }
};

/**
 * Update donation after contract tx (success or failure).
 * PATCH /api/donations/:id
 * Body: { transactionHash?, status, rawErrorMessage? }
 * Returns shortMessage for failed status so frontend can show it.
 */
export const updateDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionHash, status, rawErrorMessage } = req.body;

    if (!status || !["success", "failed"].includes(status)) {
      return sendError(res, "status must be 'success' or 'failed'", 400);
    }

    const donation = await Donation.findById(id);
    if (!donation) {
      return sendError(res, "Donation not found", 404);
    }

    if (donation.status !== "pending") {
      return sendError(res, "Donation already finalized", 400);
    }

    donation.status = status;
    if (transactionHash) donation.transactionHash = transactionHash;
    if (rawErrorMessage) {
      donation.rawErrorMessage = rawErrorMessage;
      const { shortMessage, errorCode } = getShortDonationError(rawErrorMessage);
      donation.shortMessage = shortMessage;
      donation.errorCode = errorCode;
    }

    await donation.save();

    const payload = {
      donation: {
        id: donation._id,
        status: donation.status,
        transactionHash: donation.transactionHash,
      },
    };
    if (status === "failed" && donation.shortMessage) {
      payload.shortMessage = donation.shortMessage;
      payload.errorCode = donation.errorCode;
    }

    return sendSuccess(
      res,
      status === "success" ? "Donation recorded" : "Donation failure recorded",
      payload,
    );
  } catch (err) {
    console.error("updateDonation error:", err);
    return sendError(res, "Failed to update donation", 500);
  }
};

/**
 * Get short error message for a raw error (so frontend can show it without storing).
 * POST /api/donations/error-message
 * Body: { rawErrorMessage: string }
 */
export const getShortErrorMessage = async (req, res) => {
  try {
    const { rawErrorMessage } = req.body;
    const { shortMessage, errorCode } = getShortDonationError(
      rawErrorMessage || "",
    );
    return sendSuccess(res, "OK", { shortMessage, errorCode });
  } catch (err) {
    console.error("getShortErrorMessage error:", err);
    return sendError(res, "Failed to get error message", 500);
  }
};

/**
 * List donations (optional; for admin or user history).
 * GET /api/donations?donorAddress=0x...&status=...
 */
export const getDonations = async (req, res) => {
  try {
    const { donorAddress, status, limit = 50 } = req.query;
    const filter = {};
    if (donorAddress && /^0x[a-fA-F0-9]{40}$/.test(donorAddress)) {
      filter.donorAddress = donorAddress.toLowerCase();
    }
    if (status && ["pending", "success", "failed"].includes(status)) {
      filter.status = status;
    }

    const donations = await Donation.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 100))
      .lean()
      .select("donorAddress amount currency status transactionHash createdAt shortMessage errorCode");

    return sendSuccess(res, "Donations retrieved", { donations });
  } catch (err) {
    console.error("getDonations error:", err);
    return sendError(res, "Failed to get donations", 500);
  }
};
