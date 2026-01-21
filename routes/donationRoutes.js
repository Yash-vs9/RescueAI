// routes/donationRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  confirmDonation,
  getDonorDashboard,
  getHospitalDashboard
} from "../controllers/donationController.js";

const router = express.Router();

// Hospital confirms a donation
router.post("/confirm", protect, confirmDonation);

// Donor dashboard
router.get("/dashboard/donor", protect, getDonorDashboard);

// Hospital dashboard
router.get("/dashboard/hospital", protect, getHospitalDashboard);

export default router;
