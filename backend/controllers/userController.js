import User from "../model/User.js";

// ------------------ TOGGLE DONOR AVAILABILITY ------------------
export const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isAvailable must be true or false",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isAvailable = isAvailable;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      isAvailable: user.isAvailable,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ------------------ GET NEARBY DONORS ------------------
export const getNearbyDonors = async (req, res) => {
  try {
    const { lat, lng, distance = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const donors = await User.find({
      role: "donor",
      isAvailable: true,
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: distance * 1000 // km → meters
        }
      }
    }).select("-password");

    return res.status(200).json({
      success: true,
      count: donors.length,
      donors,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
