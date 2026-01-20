import BloodRequest from "../model/BloodRequest.js";
import User from "../model/User.js";
import Notification from "../model/Notification.js";
import bloodCompatibility from "../utils/bloodCompatibility.js";
import nodemailer from "nodemailer";

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
    // 1. Authorization Check
    if (req.user.role !== "hospital") {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" });
    }

    const { bloodGroup, units, urgency, location } = req.body;

    // 2. Strict Coordinate Parsing (Force Numbers for MongoDB)
    const lng = parseFloat(location?.coordinates?.[0]);
    const lat = parseFloat(location?.coordinates?.[1]);

    if (!bloodGroup || !units || !location?.address || isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({
        success: false,
        message:
          "Missing fields: Blood group, units, address, and coordinates are all required.",
      });
    }

    // 3. Save Request to Database
    const request = await BloodRequest.create({
      hospital: req.user._id,
      hospitalName: req.user.name,
      bloodGroup,
      units,
      urgency,
      location: {
        address: location.address,
        coordinates: {
          type: "Point",
          coordinates: [lng, lat], // Order: [Longitude, Latitude]
        },
      },
    });

    // 4. Find Donors within 50km Radius (compatible donors)
    const compatibleGroups = bloodCompatibility[bloodGroup];

    if (!compatibleGroups) {
      return res.status(400).json({ success: false, message: "Invalid blood group" });
    }

    const donors = await User.find({
      role: "donor",
      bloodGroup: { $in: compatibleGroups },
      isAvailable: true,
      "location.coordinates": {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: 50000, // 50km
        },
      },
    });

    console.log(`🔍 BROADCAST: Found ${donors.length} eligible donors nearby.`);

    // 5. Real-time, DB, and Email notifications
    for (let donor of donors) {
      const donorIdStr = donor._id.toString();
      const roomId = `user:${donorIdStr}`;

      const notificationData = {
        requestId: request._id,
        hospital: {
          id: req.user._id,
          name: req.user.name,
          location: location.address,
        },
        bloodGroup,
        units,
        urgency,
      };

      // --- Real-time Socket.io ---
      if (req.io) {
        const clientsInRoom = req.io.sockets.adapter.rooms.get(roomId);
        console.log(
          `📡 Emitting to ${roomId} | Active Listeners: ${clientsInRoom ? clientsInRoom.size : 0}`
        );

        req.io.to(roomId).emit("blood_request", notificationData);
      }

      // --- Database notification ---
      await Notification.create({
        donor: donor._id,
        bloodRequest: request._id,
        hospital: notificationData.hospital,
        bloodGroup,
        units,
        urgency,
        isDelivered: false,
      });

      // --- Email notification ---
      const emailOptions = {
        from: '"RescueBlood" <your-email@gmail.com>',
        to: donor.email,
        subject: "Emergency Blood Request",
        text: `Hi ${donor.name},

Hospital ${req.user.name} needs ${units} units of ${bloodGroup} blood at ${location.address}.
Urgency: ${urgency}.

Please help if available.

Thank you!
`,
      };

      transporter.sendMail(emailOptions, (err, info) => {
        if (err) console.log("Email error:", err);
        else console.log("Email sent to", donor.email);
      });
    }

    res.status(201).json({
      success: true,
      message: `Broadcast successful. ${donors.length} donors notified.`,
      request,
    });
  } catch (error) {
    console.error("🔥 Error in createBloodRequest:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
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
