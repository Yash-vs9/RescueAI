// controllers/donationController.js
import Donation from "../model/Donation.js";
import User from "../model/User.js";
import BloodRequest from "../model/BloodRequest.js";

/* ============================
   HOSPITAL CONFIRM DONATION (WITH SOCKET & NOTIFICATION)
============================ */
export const confirmDonation = async (req, res) => {
  try {
    // 1️ Only hospitals can confirm
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Only hospitals can confirm donations",
      });
    }

    const { donorId, bloodRequestId, units } = req.body;

    // 2️ Validate input
    if (!donorId || !bloodRequestId || !units || units <= 0) {
      return res.status(400).json({
        success: false,
        message: "donorId, bloodRequestId, and units (>0) are required",
      });
    }

    // 3️ Verify donor exists
    const donor = await User.findById(donorId);
    if (!donor || donor.role !== "donor") {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    // 4️ Verify blood request exists
    const request = await BloodRequest.findById(bloodRequestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found",
      });
    }

    // 5 Create donation record
    const donation = await Donation.create({
      donor: donorId,
      hospital: req.user._id,
      bloodGroup: donor.bloodGroup,
      units,
      donationDate: new Date(),
      bloodRequest: bloodRequestId,
    });

    // 6️ Optional: create DB notification for donor history
    // (like how you did for blood requests)
    const notification = await Notification.create({
      donor: donorId,
      bloodRequest: bloodRequestId,
      hospital: { id: req.user._id, name: req.user.name },
      bloodGroup: donor.bloodGroup,
      units,
      urgency: "confirmed",
      isDelivered: false,
    });

    // 7️ Socket.io: send real-time notification to donor
    if (req.io) {
      const roomId = `user:${donorId}`;
      req.io.to(roomId).emit("donation_confirmed", {
        donationId: donation._id,
        hospitalName: req.user.name,
        units: units,
        bloodGroup: donor.bloodGroup,
        donationDate: donation.donationDate,
        bloodRequestId: bloodRequestId
      });

      // Optional: mark notification delivered immediately if donor is online
      notification.isDelivered = true;
      await notification.save();
    }

    return res.status(201).json({
      success: true,
      message: "Donation confirmed and donor notified successfully",
      donation,
    });
  } catch (error) {
    console.error(" confirmDonation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


/* ============================
   DONOR DASHBOARD
============================ */
export const getDonorDashboard = async (req, res) => {
  try {
    // 1️ Only donors
    if (req.user.role !== "donor") {
      return res.status(403).json({
        success: false,
        message: "Only donors can access this dashboard",
      });
    }

    // 2️ Fetch all donations by this donor
    const donations = await Donation.find({ donor: req.user._id })
      .populate("hospital", "name")
      .sort({ donationDate: -1 });

    // 3️ Total units donated
    const totalUnits = donations.reduce((sum, d) => sum + d.units, 0);

    // 4️ Last donation date
    const lastDonationDate = donations.length > 0 ? donations[0].donationDate : null;

    // 5️ Calculate next eligible date (90 days cooldown)
    const nextEligibleDate = lastDonationDate
      ? new Date(new Date(lastDonationDate).getTime() + 90 * 24 * 60 * 60 * 1000)
      : null;

    // 6️ Prepare history
    const history = donations.map(d => ({
      date: d.donationDate,
      units: d.units,
      bloodGroup: d.bloodGroup,
      hospitalName: d.hospital.name,
    }));

    return res.status(200).json({
      success: true,
      profile: {
        name: req.user.name,
        bloodGroup: req.user.bloodGroup,
        phone: req.user.phone,
      },
      stats: {
        totalUnitsDonated: totalUnits,
        nextEligibleDate,
      },
      history,
    });
  } catch (error) {
    console.error(" getDonorDashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/* ============================
   HOSPITAL DASHBOARD
============================ */
export const getHospitalDashboard = async (req, res) => {
  try {
    // 1️ Only hospitals
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Only hospitals can access this dashboard",
      });
    }

    // 2️ Fetch all donations received by this hospital
    const donations = await Donation.find({ hospital: req.user._id })
      .populate("donor", "name bloodGroup")
      .sort({ donationDate: -1 });

    // 3️ Total units received
    const totalUnits = donations.reduce((sum, d) => sum + d.units, 0);

    // 4️ Blood group summary
    const bloodGroupSummary = {};
    donations.forEach(d => {
      const group = d.bloodGroup;
      bloodGroupSummary[group] = (bloodGroupSummary[group] || 0) + d.units;
    });

    // 5️ Prepare history
    const history = donations.map(d => ({
      date: d.donationDate,
      donorName: d.donor.name,
      bloodGroup: d.bloodGroup,
      units: d.units,
    }));

    return res.status(200).json({
      success: true,
      profile: { name: req.user.name },
      stats: {
        totalUnitsReceived: totalUnits,
        bloodGroupSummary,
      },
      history,
    });
  } catch (error) {
    console.error(" getHospitalDashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
