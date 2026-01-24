//routes/donationRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  confirmDonation,
  getDonorDashboard,
  getHospitalDashboard,
  acceptBloodRequest
} from "../controllers/donationController.js";

const router = express.Router();

// ✅ Middleware to attach io to request
const attachSocketIO = (req, res, next) => {
  req.io = req.app.get('io');
  next();
};

// Donor accepts a blood request
router.post("/accept", protect, attachSocketIO, acceptBloodRequest);

// Hospital confirms donation (with socket support)
router.post("/confirm", protect, attachSocketIO, confirmDonation);

// Donor dashboard
router.get("/dashboard/donor", protect, getDonorDashboard);

// Hospital dashboard
router.get("/dashboard/hospital", protect, getHospitalDashboard);

export default router;