import { sendSuccess, sendError } from "../utils/response.js";
import DaoMember from "../models/DaoMember.js";
import { verifyTransaction } from "../utils/blockchain.js";

/**
 * Verify transaction on blockchain and save DAO member to database
 * POST /api/dao-members/verify
 */
export const verifyAndSaveDaoMember = async (req, res) => {
  try {
    const { transactionHash, daoMemberAddress } = req.body;

    // Validate input
    if (!transactionHash || !daoMemberAddress) {
      return sendError(
        res,
        "Transaction hash and DAO member address are required",
        400,
      );
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(daoMemberAddress)) {
      return sendError(res, "Invalid Ethereum address format", 400);
    }

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return sendError(res, "Invalid transaction hash format", 400);
    }

    // Check if transaction already exists in database
    const existingMember = await DaoMember.findOne({
      $or: [
        { transactionHash },
        { daoMemberAddress: daoMemberAddress.toLowerCase() },
      ],
    });

    if (existingMember) {
      if (existingMember.transactionHash === transactionHash) {
        return sendError(res, "Transaction already exists in database", 409);
      }
      if (
        existingMember.daoMemberAddress.toLowerCase() ===
        daoMemberAddress.toLowerCase()
      ) {
        return sendError(
          res,
          "DAO member address already exists in database",
          409,
        );
      }
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

    // Save to database
    const daoMember = new DaoMember({
      daoMemberAddress: daoMemberAddress.toLowerCase(),
      isDaoMember: true,
      transactionHash,
    });

    await daoMember.save();

    return sendSuccess(
      res,
      "DAO member verified and saved successfully",
      {
        daoMember: {
          daoMemberAddress: daoMember.daoMemberAddress,
          isDaoMember: daoMember.isDaoMember,
          transactionHash: daoMember.transactionHash,
          addedAt: daoMember.addedAt,
        },
      },
      201,
    );
  } catch (error) {
    console.error("Error verifying and saving DAO member:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return sendError(res, `${field} already exists in database`, 409);
    }

    return sendError(res, error.message || "Internal server error", 500);
  }
};

/**
 * Verify transaction on blockchain and mark DAO member as removed (isDaoMember: false)
 * POST /api/dao-members/remove/verify
 */
export const verifyAndRemoveDaoMember = async (req, res) => {
  try {
    const { transactionHash, daoMemberAddress } = req.body;

    // Validate input
    if (!transactionHash || !daoMemberAddress) {
      return sendError(
        res,
        "Transaction hash and DAO member address are required",
        400,
      );
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(daoMemberAddress)) {
      return sendError(res, "Invalid Ethereum address format", 400);
    }

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return sendError(res, "Invalid transaction hash format", 400);
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

    // Find existing member
    const member = await DaoMember.findOne({
      daoMemberAddress: daoMemberAddress.toLowerCase(),
    });

    if (!member) {
      return sendError(res, "DAO member not found in database", 404);
    }

    if (!member.isDaoMember) {
      return sendError(res, "DAO member is already removed", 409);
    }

    member.isDaoMember = false;
    await member.save();

    return sendSuccess(res, "DAO member removed successfully", {
      daoMember: {
        daoMemberAddress: member.daoMemberAddress,
        isDaoMember: member.isDaoMember,
        transactionHash: member.transactionHash,
        addedAt: member.addedAt,
      },
    });
  } catch (error) {
    console.error("Error verifying and removing DAO member:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};

/**
 * Get all DAO members
 * GET /api/dao-members
 */
export const getAllDaoMembers = async (req, res) => {
  try {
    const { isDaoMember } = req.query;

    const query = {};
    if (isDaoMember !== undefined) {
      query.isDaoMember = isDaoMember === "true";
    }

    const members = await DaoMember.find(query).sort({ addedAt: -1 });

    return sendSuccess(res, "DAO members retrieved successfully", {
      members: members.map((member) => ({
        daoMemberAddress: member.daoMemberAddress,
        isDaoMember: member.isDaoMember,
        transactionHash: member.transactionHash,
        addedAt: member.addedAt,
      })),
      count: members.length,
    });
  } catch (error) {
    console.error("Error retrieving DAO members:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};

/**
 * Get a single DAO member by address
 * GET /api/dao-members/:address
 */
export const getDaoMemberByAddress = async (req, res) => {
  try {
    const { address } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return sendError(res, "Invalid Ethereum address format", 400);
    }

    const member = await DaoMember.findOne({
      daoMemberAddress: address.toLowerCase(),
    });

    if (!member) {
      return sendError(res, "DAO member not found", 404);
    }

    return sendSuccess(res, "DAO member retrieved successfully", {
      daoMember: {
        daoMemberAddress: member.daoMemberAddress,
        isDaoMember: member.isDaoMember,
        transactionHash: member.transactionHash,
        addedAt: member.addedAt,
      },
    });
  } catch (error) {
    console.error("Error retrieving DAO member:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};
