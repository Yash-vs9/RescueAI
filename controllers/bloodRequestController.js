import BloodRequest from "../model/BloodRequest.js";
import User from "../model/User.js";
import Notification from "../model/Notification.js";
import bloodCompatibility from "../utils/bloodCompatibility.js";
import nodemailer from "nodemailer";
import { analyzeBloodRequestWithAI } from "../services/aiService.js";

// =========================
// EMAIL TRANSPORTER (GMAIL EXAMPLE)
// =========================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// =========================
// HOSPITAL REQUEST RATE LIMIT
// =========================
const hospitalRequestMap = new Map(); // { hospitalId: { count, firstRequestTime } }
const MAX_REQUESTS = 5; // max requests per minute
const TIME_WINDOW = 60 * 1000; // 1 minute in ms

/**
 * @desc    Create emergency request and broadcast to nearby donors
 * @route   POST /api/blood-requests
 */
export const createBloodRequest = async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // =======================
    // RATE LIMIT CHECK
    // =======================
    const hospitalId = req.user._id.toString();
    const now = Date.now();
    const record = hospitalRequestMap.get(hospitalId);

    if (record) {
      if (now - record.firstRequestTime < TIME_WINDOW) {
        if (record.count >= MAX_REQUESTS) {
          return res.status(429).json({
            success: false,
            message: `You are making requests too fast! Max ${MAX_REQUESTS} requests per minute allowed.`,
          });
        } else {
          record.count += 1;
        }
      } else {
        // Reset counter after 1 minute
        hospitalRequestMap.set(hospitalId, { count: 1, firstRequestTime: now });
      }
    } else {
      hospitalRequestMap.set(hospitalId, { count: 1, firstRequestTime: now });
    }

    const { bloodGroup, units, urgency, location } = req.body;
    const lng = parseFloat(location?.coordinates?.[0]);
    const lat = parseFloat(location?.coordinates?.[1]);

    if (!bloodGroup || !units || !location?.address || isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // =======================
    // AI ANALYSIS
    // =======================
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

    // =======================
    // SAVE BLOOD REQUEST
    // =======================
    const request = await BloodRequest.create({
      hospital: req.user._id,
      hospitalName: req.user.name,
      bloodGroup,
      units,
      urgency,
      description: aiAnalysis.aiDescription,
      location: {
        address: location.address,
        coordinates: {
          type: "Point",
          coordinates: [lng, lat],
        },
      },
    });

    console.log(request);

    // =======================
    // FIND DONORS
    // =======================
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

    // =======================
    // BROADCAST TO DONORS
    // =======================
    for (let donor of donors) {
      const roomId = `user:${donor._id}`;

      const notificationData = {
        requestId: request._id,
        hospital: { name: req.user.name, location: location.address },
        bloodGroup,
        units,
        urgency,
        description: aiAnalysis.aiDescription
      };

      if (req.io) req.io.to(roomId).emit("blood_request", notificationData);

      await Notification.create({
        donor: donor._id,
        bloodRequest: request._id,
        hospital: notificationData.hospital,
        bloodGroup,
        units,
        urgency,
        message: aiAnalysis.aiDescription
      });

      const emailOptions = {
        from: '"Savify Admin" <your-email@gmail.com>',
        to: donor.email,
        subject: `🚨 Urgent: ${bloodGroup} Blood Donation Needed Near You`,
        text: `Hi ${donor.name},\n\n${aiAnalysis.aiEmailBody}\n\nThank you,\nSavify Team`,
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
