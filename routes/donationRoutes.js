// routes/donationRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  confirmDonation,
  getDonorDashboard,
  getHospitalDashboard,
  acceptBloodRequest
} from "../controllers/donationController.js";

const router = express.Router();

//  Donor accepts a blood request
router.post("/accept", protect, acceptBloodRequest);

//  Hospital confirms donation (success/failure handled later)
router.post("/confirm", protect, confirmDonation);

//  Donor dashboard
router.get("/dashboard/donor", protect, getDonorDashboard);

//  Hospital dashboard
router.get("/dashboard/hospital", protect, getHospitalDashboard);

export default router;
