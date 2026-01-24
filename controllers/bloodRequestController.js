// controllers/bloodRequestController.js
import BloodRequest from "../model/BloodRequest.js";
import User from "../model/User.js";
import Notification from "../model/Notification.js";
import bloodCompatibility from "../utils/bloodCompatibility.js";
import nodemailer from "nodemailer";
import { analyzeBloodRequestWithAI } from "../services/aiService.js";

/* ============================
   EMAIL CONFIGURATION
============================ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter on startup
transporter.verify((error) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email server is ready");
  }
});

/* ============================
   SEND EMAIL NOTIFICATION
============================ */
const sendEmailNotification = async (donor, requestData, aiAnalysis) => {
  try {
    const emailOptions = {
      from: `"Savify Blood Donation" <${process.env.EMAIL_USER}>`,
      to: donor.email,
      subject: `🚨 Urgent: ${requestData.bloodGroup} Blood Donation Needed Near You`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">🩸 Emergency Blood Request</h2>
          
          <p>Dear <strong>${donor.name}</strong>,</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Hospital:</strong> ${requestData.hospitalName}</p>
            <p><strong>Blood Group Required:</strong> <span style="color: #d32f2f; font-size: 18px;">${requestData.bloodGroup}</span></p>
            <p><strong>Units Needed:</strong> ${requestData.units}</p>
            <p><strong>Urgency:</strong> <span style="color: ${
              requestData.urgency === "high" ? "#d32f2f" : 
              requestData.urgency === "medium" ? "#ff9800" : "#4caf50"
            };">${requestData.urgency.toUpperCase()}</span></p>
            <p><strong>Location:</strong> ${requestData.location.address}</p>
          </div>
          
          ${aiAnalysis?.aiDescription ? `
            <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0;">
              <p style="margin: 0;"><strong>AI Analysis:</strong></p>
              <p style="margin: 10px 0 0 0;">${aiAnalysis.aiDescription}</p>
            </div>
          ` : ''}
          
          <p style="margin-top: 20px;">Your compatible blood type can save a life today. Please consider responding to this request through the Savify app.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">
              This is an automated notification from Savify Blood Donation System.<br>
              If you're not available to donate, please update your availability in the app.
            </p>
          </div>
        </div>
      `,
      text: `
Hi ${donor.name},

Emergency Blood Request:
- Hospital: ${requestData.hospitalName}
- Blood Group: ${requestData.bloodGroup}
- Units: ${requestData.units}
- Urgency: ${requestData.urgency}
- Location: ${requestData.location.address}

${aiAnalysis?.aiDescription || ''}

Please respond through the Savify app if you're available.

Thank you,
Savify Team
      `,
    };

    await transporter.sendMail(emailOptions);
    console.log(`✅ Email sent to ${donor.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${donor.email}:`, error.message);
    return false;
  }
};

/* ============================
   CREATE BLOOD REQUEST (Hospital)
============================ */
export const createBloodRequest = async (req, res) => {
  try {
    // 1️⃣ Authorization check
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Only hospitals can create blood requests",
      });
    }

    // 2️⃣ Extract and validate input
    const { bloodGroup, units, urgency, description, location } = req.body;
    const lng = parseFloat(location?.coordinates?.[0]);
    const lat = parseFloat(location?.coordinates?.[1]);

    if (!bloodGroup || !units || !location?.address || isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: bloodGroup, units, location with valid coordinates",
      });
    }

    // 3️⃣ Check for duplicate open requests
    const existingRequest = await BloodRequest.findOne({
      hospital: req.user._id,
      bloodGroup: bloodGroup,
      status: "open"
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: `You already have an active request for ${bloodGroup}. Please wait for it to be fulfilled or cancel it first.`,
        duplicateRequest: true,
        existingRequestId: existingRequest._id
      });
    }

    // 4️⃣ AI Analysis
    let aiAnalysis = null;
    try {
      aiAnalysis = await analyzeBloodRequestWithAI({
        bloodGroup,
        units,
        urgency: urgency || "medium",
        address: location.address,
        hospitalName: req.user.name,
        description: description || "",
      });

      // Validate address through AI
      if (aiAnalysis && !aiAnalysis.isAddressValid) {
        return res.status(400).json({
          success: false,
          message: "The address provided appears invalid. Please provide a clear, valid location.",
        });
      }
    } catch (aiError) {
      console.warn("⚠️ AI analysis failed, continuing without it:", aiError.message);
      // Continue even if AI fails
    }

    // 5️⃣ Create blood request
    const bloodRequest = await BloodRequest.create({
      hospital: req.user._id,
      hospitalName: req.user.name,
      bloodGroup,
      units,
      urgency: urgency || "medium",
      description: aiAnalysis?.aiDescription || description || "",
      location: {
        address: location.address,
        coordinates: {
          type: "Point",
          coordinates: [lng, lat],
        },
      },
    });

    console.log(`✅ Blood request created: ${bloodRequest._id}`);

    // 6️⃣ Find compatible donors
    const compatibleGroups = bloodCompatibility[bloodGroup] || [bloodGroup];
    
    const donors = await User.find({
      role: "donor",
      bloodGroup: { $in: compatibleGroups },
      isAvailable: true,
      "location.coordinates": {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: 50000, // 50km
        },
      },
    }).select("name email phone bloodGroup location");

    console.log(`✅ Found ${donors.length} compatible donors within 50km`);

    // 7️⃣ Notify donors (Socket + Email + Database)
    const notificationPromises = [];
    const emailPromises = [];

    for (const donor of donors) {
      // Prepare notification data
      const notificationData = {
        _id: bloodRequest._id,
        requestId: bloodRequest._id,
        hospital: {
          _id: req.user._id,
          name: req.user.name,
        },
        hospitalName: req.user.name,
        bloodGroup,
        units,
        urgency: urgency || "medium",
        description: aiAnalysis?.aiDescription || description || "",
        location: {
          address: location.address,
          coordinates: [lng, lat],
        },
        status: "open",
        createdAt: bloodRequest.createdAt,
      };

      // Socket notification
      if (req.io) {
        const roomId = `user:${donor._id}`;
        req.io.to(roomId).emit("blood_request", notificationData);
        console.log(`📡 Socket notification sent to: ${donor.name} (${roomId})`);
      }

      // Database notification
      notificationPromises.push(
        Notification.create({
          donor: donor._id,
          bloodRequest: bloodRequest._id,
          hospital: {
            id: req.user._id,
            name: req.user.name,
            location: location.address,
          },
          bloodGroup,
          units,
          urgency: urgency || "medium",
          message: aiAnalysis?.aiDescription || description || "",
          isDelivered: true,
        })
      );

      // Email notification
      emailPromises.push(
        sendEmailNotification(donor, {
          hospitalName: req.user.name,
          bloodGroup,
          units,
          urgency: urgency || "medium",
          location: { address: location.address },
        }, aiAnalysis)
      );
    }

    // 8️⃣ Wait for all notifications to complete
    await Promise.allSettled([
      ...notificationPromises,
      ...emailPromises,
    ]);

    // 9️⃣ Success response with rate limit warning if present
    const response = {
      success: true,
      message: `Blood request created${aiAnalysis ? ' with AI validation' : ''}. ${donors.length} compatible donor(s) notified via app, email, and push notifications.`,
      request: {
        _id: bloodRequest._id,
        bloodGroup,
        units,
        urgency: urgency || "medium",
        description: aiAnalysis?.aiDescription || description || "",
        location: bloodRequest.location,
        status: bloodRequest.status,
        createdAt: bloodRequest.createdAt,
      },
      notifiedDonors: donors.length,
      aiAnalysis: aiAnalysis ? {
        validated: true,
        addressValid: aiAnalysis.isAddressValid,
      } : null,
    };

    // Add rate limit warning if middleware set it
    if (req.rateLimitWarning) {
      response.rateLimitWarning = req.rateLimitWarning;
    }

    return res.status(201).json(response);

  } catch (error) {
    console.error("❌ createBloodRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating blood request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/* ============================
   GET NEARBY REQUESTS (Donor)
============================ */
export const getNearbyRequests = async (req, res) => {
  try {
    if (req.user.role !== "donor") {
      return res.status(403).json({
        success: false,
        message: "Only donors can view nearby blood requests",
      });
    }

    const { lat, lng } = req.query;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    // Get compatible blood groups for donor
    const donorBloodGroup = req.user.bloodGroup;
    const compatibleRequests = [];

    // Find which blood groups this donor can donate to
    for (const [requestBloodGroup, compatibleDonors] of Object.entries(bloodCompatibility)) {
      if (compatibleDonors.includes(donorBloodGroup)) {
        compatibleRequests.push(requestBloodGroup);
      }
    }

    const requests = await BloodRequest.find({
      bloodGroup: { $in: compatibleRequests },
      status: "open",
      "location.coordinates": {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: 50000,
        },
      },
    })
      .populate("hospital", "name phone email")
      .sort({ urgency: -1, createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests.map((req) => ({
        _id: req._id,
        requestId: req._id,
        hospital: req.hospital,
        hospitalName: req.hospitalName,
        bloodGroup: req.bloodGroup,
        units: req.units,
        urgency: req.urgency,
        description: req.description,
        location: req.location,
        status: req.status,
        createdAt: req.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ getNearbyRequests error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/* ============================
   GET HOSPITAL'S OWN REQUESTS
============================ */
export const getMyRequests = async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Only hospitals can view their requests",
      });
    }

    const requests = await BloodRequest.find({ hospital: req.user._id })
      .populate("acceptedDonor", "name phone bloodGroup email")
      .sort({ createdAt: -1 });

    const formattedRequests = requests.map((req) => ({
      _id: req._id,
      bloodGroup: req.bloodGroup,
      units: req.units,
      urgency: req.urgency,
      description: req.description,
      location: req.location,
      status: req.status,
      createdAt: req.createdAt,
      acceptedDonor: req.acceptedDonor
        ? {
            _id: req.acceptedDonor._id,
            name: req.acceptedDonor.name,
            phone: req.acceptedDonor.phone,
            bloodGroup: req.acceptedDonor.bloodGroup,
            email: req.acceptedDonor.email,
          }
        : null,
      acceptedAt: req.acceptedAt,
    }));

    return res.status(200).json({
      success: true,
      count: formattedRequests.length,
      requests: formattedRequests,
    });
  } catch (error) {
    console.error("❌ getMyRequests error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/* ============================
   GET ACCEPTED DONORS
============================ */
export const getAcceptedDonors = async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Only hospitals can view accepted donors",
      });
    }

    const requests = await BloodRequest.find({
      hospital: req.user._id,
      acceptedDonor: { $ne: null },
    })
      .populate("acceptedDonor", "name phone bloodGroup location email")
      .sort({ acceptedAt: -1 });

    const donorsMap = new Map();
    requests.forEach((req) => {
      if (req.acceptedDonor) {
        donorsMap.set(req.acceptedDonor._id.toString(), {
          _id: req.acceptedDonor._id,
          name: req.acceptedDonor.name,
          phone: req.acceptedDonor.phone,
          email: req.acceptedDonor.email,
          bloodGroup: req.acceptedDonor.bloodGroup,
          location: req.acceptedDonor.location,
          requestId: req._id,
          acceptedAt: req.acceptedAt,
        });
      }
    });

    const donors = Array.from(donorsMap.values());

    return res.status(200).json({
      success: true,
      count: donors.length,
      donors,
    });
  } catch (error) {
    console.error("❌ getAcceptedDonors error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/* ============================
   DELETE BLOOD REQUEST
============================ */
export const deleteBloodRequest = async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Only hospitals can delete requests",
      });
    }

    const { id } = req.params;

    const request = await BloodRequest.findOne({
      _id: id,
      hospital: req.user._id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found or you don't have permission",
      });
    }

    await BloodRequest.findByIdAndDelete(id);
    await Notification.deleteMany({ bloodRequest: id });

    return res.status(200).json({
      success: true,
      message: "Blood request deleted successfully",
    });
  } catch (error) {
    console.error("❌ deleteBloodRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};