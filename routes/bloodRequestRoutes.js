import express from "express";
import { 
  createBloodRequest,
  getNearbyRequests,
  getAcceptedDonors,
  deleteBloodRequest  // ✅ This was missing!
} from "../controllers/bloodRequestController.js";
import protect from "../middleware/authMiddleware.js";
import { bloodRequestRateLimiter } from "../middleware/rateLimiter.js";


import BloodRequest from "../model/BloodRequest.js";

const router = express.Router();
router.post("/create", protect, bloodRequestRateLimiter, createBloodRequest);
router.get("/nearby", protect, getNearbyRequests);
router.get("/accepted-donors", protect, getAcceptedDonors);
router.delete("/:id", protect, deleteBloodRequest);
router.get('/my-requests', protect, async (req, res) => {
    try {
      // Verify that the user is a hospital
      if (req.user.role !== 'hospital') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only hospitals can access their own requests.'
        });
      }
  
      // Fetch all blood requests created by this hospital
      const requests = await BloodRequest.find({ 
        hospital: req.user._id
          })
        .sort({ createdAt: -1 }) // Most recent first
        .populate('hospital', 'name email phone location') // Populate hospital details
        .populate('acceptedDonor', 'name email phone bloodGroup location') // Populate accepted donor if exists
        .lean();
      console.log(requests)
      // Calculate statistics
      const activeRequests = requests.filter(req => req.status === 'open');
      const completedRequests = requests.filter(req => req.status === 'completed');
      const inProgressRequests = requests.filter(req => req.status === 'in_progress');
      const expiredRequests = requests.filter(req => req.status === 'expired');
  
      return res.status(200).json({
        success: true,
        message: 'Blood requests retrieved successfully',
        count: requests.length,
        statistics: {
          total: requests.length,
          active: activeRequests.length,
          completed: completedRequests.length,
          inProgress: inProgressRequests.length,
          expired: expiredRequests.length
        },
        requests: requests
      });
  
    } catch (error) {
      console.error('Error fetching hospital requests:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch blood requests',
        error: error.message
      });
    }
  });
export default router;