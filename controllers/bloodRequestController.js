// controllers/bloodRequestController.js
import BloodRequest from "../model/BloodRequest.js";
import User from "../model/User.js";
import Notification from "../model/Notification.js";

/* ============================
   CREATE BLOOD REQUEST (Hospital)
============================ */
export const createBloodRequest = async (req, res) => {
  try {
    // 1️⃣ Only hospitals can create requests
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Only hospitals can create blood requests",
      });
    }

    const { bloodGroup, units, urgency, description, location } = req.body;

    // 2️⃣ Validate required fields
    if (!bloodGroup || !units || !location?.coordinates) {
      return res.status(400).json({
        success: false,
        message: "bloodGroup, units, and location coordinates are required",
      });
    }

    // 3️⃣ Create blood request
    const bloodRequest = await BloodRequest.create({
      hospital: req.user._id,
      hospitalName: req.user.name,
      bloodGroup,
      units,
      urgency: urgency || "medium",
      description: description || "",
      location: {
        address: location.address || req.user.location.address,
        coordinates: {
          type: "Point",
          coordinates: location.coordinates, // [lng, lat]
        },
      },
    });

    // 4️⃣ Find nearby donors (50km radius) with matching blood group and available
    const nearbyDonors = await User.find({
      role: "donor",
      bloodGroup: bloodGroup,
      isAvailable: true,
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: location.coordinates,
          },
          $maxDistance: 50000, // 50km in meters
        },
      },
    });

    console.log(`✅ Found ${nearbyDonors.length} nearby donors for ${bloodGroup}`);

    // 5️⃣ Create notifications for each donor
    const notifications = [];
    for (const donor of nearbyDonors) {
      const notification = await Notification.create({
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
        isDelivered: false,
      });
      notifications.push(notification);
    }

    // 6️⃣ Send real-time socket notifications to all nearby donors
    if (req.io && nearbyDonors.length > 0) {
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
        description: description || "",
        location: {
          address: location.address || req.user.location.address,
          coordinates: location.coordinates,
        },
        status: "open",
        createdAt: bloodRequest.createdAt,
      };

      // Emit to each donor's room
      nearbyDonors.forEach((donor) => {
        const roomId = `user:${donor._id}`;
        req.io.to(roomId).emit("blood_request", notificationData);
        console.log(`📡 Sent notification to donor: ${donor.name} (${roomId})`);
      });

      // Mark all notifications as delivered since we sent them via socket
      await Notification.updateMany(
        { bloodRequest: bloodRequest._id },
        { isDelivered: true }
      );
    }

    return res.status(201).json({
      success: true,
      message: `Blood request created and ${nearbyDonors.length} donors notified`,
      request: bloodRequest,
      notifiedDonors: nearbyDonors.length,
    });
  } catch (error) {
    console.error("❌ createBloodRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/* ============================
   GET NEARBY REQUESTS (Donor)
============================ */
export const getNearbyRequests = async (req, res) => {
  try {
    // 1️⃣ Only donors can view nearby requests
    if (req.user.role !== "donor") {
      return res.status(403).json({
        success: false,
        message: "Only donors can view nearby blood requests",
      });
    }

    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // 2️⃣ Find requests within 50km, matching donor's blood group
    const requests = await BloodRequest.find({
      bloodGroup: req.user.bloodGroup,
      status: "open", // Only show open requests
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: 50000, // 50km
        },
      },
    })
      .populate("hospital", "name phone")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
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
        acceptedDonor: req.acceptedDonor,
        createdAt: req.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ getNearbyRequests error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/* ============================
   GET HOSPITAL'S OWN REQUESTS
============================ */
export const getMyRequests = async (req, res) => {
  try {
    // 1️⃣ Only hospitals can view their own requests
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Only hospitals can view their requests",
      });
    }

    // 2️⃣ Fetch all requests created by this hospital
    const requests = await BloodRequest.find({ hospital: req.user._id })
      .populate("acceptedDonor", "name phone bloodGroup")
      .sort({ createdAt: -1 });

    // 3️⃣ Format response with donor info if accepted
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
          }
        : null,
      acceptedAt: req.acceptedAt,
    }));

    return res.status(200).json({
      success: true,
      requests: formattedRequests,
    });
  } catch (error) {
    console.error("❌ getMyRequests error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/* ============================
   GET DONORS WHO ACCEPTED HOSPITAL REQUESTS
============================ */
export const getAcceptedDonors = async (req, res) => {
  try {
    // 1️⃣ Only hospitals can view accepted donors
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Only hospitals can view accepted donors",
      });
    }

    // 2️⃣ Find all requests with accepted donors
    const requests = await BloodRequest.find({
      hospital: req.user._id,
      acceptedDonor: { $ne: null },
    })
      .populate("acceptedDonor", "name phone bloodGroup location")
      .sort({ acceptedAt: -1 });

    // 3️⃣ Extract unique donors
    const donorsMap = new Map();
    requests.forEach((req) => {
      if (req.acceptedDonor) {
        donorsMap.set(req.acceptedDonor._id.toString(), {
          _id: req.acceptedDonor._id,
          name: req.acceptedDonor.name,
          phone: req.acceptedDonor.phone,
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
      donors,
    });
  } catch (error) {
    console.error("❌ getAcceptedDonors error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
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

    return res.status(200).json({
      success: true,
      message: "Blood request deleted successfully",
    });
  } catch (error) {
    console.error("❌ deleteBloodRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
