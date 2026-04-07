import express from "express";
import {
  createDonation,
  updateDonation,
  getShortErrorMessage,
  getDonations,
} from "../controllers/donationController.js";

const router = express.Router();

router.post("/", createDonation);
router.patch("/:id", updateDonation);
router.post("/error-message", getShortErrorMessage);
router.get("/", getDonations);

export default router;
