import express from "express";
import { createBloodRequest,getNearbyRequests } from "../controllers/bloodRequestController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBloodRequest);
router.get("/nearby", protect, getNearbyRequests);
export default router;
