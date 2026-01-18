import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  updateAvailability,
  getNearbyDonors
} from "../controllers/userController.js";


const router = express.Router();

// Update donor availability
router.put("/availability", protect, updateAvailability);

// Get nearby donors
router.get("/nearby", protect, getNearbyDonors);


export default router;
