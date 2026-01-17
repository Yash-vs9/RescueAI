import BloodRequest from "../model/BloodRequest.js";
import User from "../model/User.js";
import Notification from "../model/Notification.js";

export const createBloodRequest = async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({ message: "Only hospitals can create blood requests" });
    }

    const { bloodGroup, units, urgency, location } = req.body;
    if (!bloodGroup || !units || !location?.address || !location?.coordinates) {
      return res.status(400).json({ message: "Blood group, units, and location are required" });
    }

    const [lng, lat] = location.coordinates;

    // 1️⃣ Save blood request
    const request = await BloodRequest.create({
      hospital: req.user._id,
      hospitalName: req.user.name,
      bloodGroup,
      units,
      urgency,
      location: {
        address: location.address,
        coordinates: { type: "Point", coordinates: [lng, lat] }
      }
    });

    // 2️⃣ Find all relevant donors (even offline)
    const donors = await User.find({
      role: "donor",
      bloodGroup,
      "location.coordinates": {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: 50000 // 50 km radius
        }
      }
    });

    // 3️⃣ Emit real-time notifications + save in DB
    for (let donor of donors) {
      // Emit only if donor is online
      req.io.to(`user:${donor._id}`).emit("blood_request", {
        requestId: request._id,
        hospital: {
          id: req.user._id,
          name: req.user.name,
          location: location.address
        },
        bloodGroup,
        units,
        urgency
      });

      // Save notification in DB for offline donors
      await Notification.create({
        donor: donor._id,
        bloodRequest: request._id,
        hospital: {
          id: req.user._id,
          name: req.user.name,
          location: location.address
        },
        bloodGroup,
        units,
        urgency
      });
    }

    res.status(201).json({
      message: "Blood request created and donors notified",
      request
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to create blood request",
      error: error.message
    });
  }
};
