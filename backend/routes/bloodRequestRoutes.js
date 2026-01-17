import express from "express";
import { createBloodRequest } from "../controllers/bloodRequestController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBloodRequest);

export default router;
