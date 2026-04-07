import express from "express";
import {
  verifyAndSaveDaoMember,
  verifyAndRemoveDaoMember,
  getAllDaoMembers,
  getDaoMemberByAddress,
} from "../controllers/daoMemberController.js";

const router = express.Router();

// Verify transaction and save DAO member
router.post("/verify", verifyAndSaveDaoMember);
// Verify transaction and mark DAO member as removed
router.post("/remove/verify", verifyAndRemoveDaoMember);

// Get all DAO members
router.get("/", getAllDaoMembers);

// Get DAO member by address
router.get("/:address", getDaoMemberByAddress);

export default router;
