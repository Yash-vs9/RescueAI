import BloodRequest from "../model/BloodRequest.js";
import User from "../model/User.js";
import Notification from "../model/Notification.js";
import bloodCompatibility from "../utils/bloodCompatibility.js";
import nodemailer from "nodemailer";
import { analyzeBloodRequestWithAI } from "../services/aiService.js";
//nodemailer :D
/* =========================
   EMAIL TRANSPORTER (GMAIL EXAMPLE)
========================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // app password
  },
});

/**
 * @desc    Create emergency request and broadcast to nearby donors
 * @route   POST /api/blood-requests
 */
export const createBloodRequest = async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { bloodGroup, units, urgency, location } = req.body;
    const lng = parseFloat(location?.coordinates?.[0]);
    const lat = parseFloat(location?.coordinates?.[1]);

    if (!bloodGroup || !units || !location?.address || isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // --- STEP: AI AGENT WORKFLOW ---
    const aiAnalysis = await analyzeBloodRequestWithAI({
      bloodGroup,
      units,
      urgency,
      address: location.address,
      hospitalName: req.user.name
    });

    if (!aiAnalysis.isAddressValid) {
      return res.status(400).json({
        success: false,
        message: "The address provided appears to be invalid or contains random symbols. Please provide a clear location."
      });
    }

    // 3. Save Request to Database (including AI Description)
    const request = await BloodRequest.create({
      hospital: req.user._id,
      hospitalName: req.user.name,
      bloodGroup,
      units,
      urgency,
      description: aiAnalysis.aiDescription, // SAVE AI DESC HERE
      location: {
        address: location.address,
        coordinates: {
          type: "Point",
          coordinates: [lng, lat],
        },
      },
    });
    console.log(request)

    // 4. Find Donors (keep compatibility logic same)
    const compatibleGroups = bloodCompatibility[bloodGroup];
    const donors = await User.find({
      role: "donor",
      bloodGroup: { $in: compatibleGroups },
      isAvailable: true,
      "location.coordinates": {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: 50000, 
        },
      },
    });

    // 5. Broadcast with AI Content
    for (let donor of donors) {
      const roomId = `user:${donor._id}`;
      
      const notificationData = {
        requestId: request._id,
        hospital: { name: req.user.name, location: location.address },
        bloodGroup,
        units,
        urgency,
        description: aiAnalysis.aiDescription // Send AI desc via socket
      };

      if (req.io) req.io.to(roomId).emit("blood_request", notificationData);

      await Notification.create({
        donor: donor._id,
        bloodRequest: request._id,
        hospital: notificationData.hospital,
        bloodGroup,
        units,
        urgency,
        message: aiAnalysis.aiDescription // Save AI message
      });

      // --- AI-Generated Email ---
      const emailOptions = {
        from: '"RescueBlood Admin" <your-email@gmail.com>',
        to: donor.email,
        subject: `🚨 Urgent: ${bloodGroup} Blood Donation Needed Near You`,
        text: `Hi ${donor.name},\n\n${aiAnalysis.aiEmailBody}\n\nThank you,\nRescueBlood Team`,
      };

      transporter.sendMail(emailOptions).catch(e => console.log("Email Failed", e));
    }

    res.status(201).json({
      success: true,
      message: `AI validated request. ${donors.length} donors notified via AI-generated alerts.`,
      request,
    });

  } catch (error) {
    console.error("🔥 Controller Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Fetch active requests nearby for the donor dashboard
 * @route   GET /api/blood-requests/nearby
 */
export const getNearbyRequests = async (req, res) => {
  try {
    const lng = parseFloat(req.query.lng);
    const lat = parseFloat(req.query.lat);

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({ success: false, message: "Valid coordinates (lat/lng) are required" });
    }

    const requests = await BloodRequest.find({
      "location.coordinates": {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: 50000,
        },
      },
    }).sort("-createdAt");

    res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error) {
    console.error("🔥 Error in getNearbyRequests:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
