// controllers/donationController.js
import Donation from "../model/Donation.js";
import User from "../model/User.js";
import BloodRequest from "../model/BloodRequest.js";
import Notification from "../model/Notification.js";
import mongoose from "mongoose";

/* ============================
   DONOR ACCEPTS BLOOD REQUEST
============================ */
export const acceptBloodRequest = async (req, res) => {
  try {
    // 1️⃣ Only donors
    if (req.user.role !== "donor") {
      return res.status(403).json({
        success: false,
        message: "Only donors can accept blood requests",
      });
    }

    const { bloodRequestId } = req.body;

    if (!bloodRequestId) {
      return res.status(400).json({
        success: false,
        message: "bloodRequestId is required",
      });
    }

    // 2️⃣ Fetch request
    const request = await BloodRequest.findById(bloodRequestId).populate(
      "hospital",
      "name phone"
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found",
      });
    }

    // 3️⃣ Validate request state
    if (request.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Blood request is not open for acceptance",
      });
    }

    if (request.acceptedDonor) {
      return res.status(400).json({
        success: false,
        message: "This request has already been accepted by another donor",
      });
    }

    // 4️⃣ Accept request
    request.acceptedDonor = req.user._id;
    request.acceptedAt = new Date();
    request.status = "in_progress";

    await request.save();

    // 5️⃣ Notify hospital via socket
    if (req.io) {
      const hospitalRoomId = `user:${request.hospital._id}`;
      req.io.to(hospitalRoomId).emit("donor_accepted", {
        requestId: request._id,
        donor: {
          _id: req.user._id,
          name: req.user.name,
          phone: req.user.phone,
          bloodGroup: req.user.bloodGroup,
        },
        bloodGroup: request.bloodGroup,
        units: request.units,
        acceptedAt: request.acceptedAt,
      });

      console.log(
        `✅ Notified hospital ${request.hospital.name} about donor acceptance`
      );
    }

    return res.status(200).json({
      success: true,
      message: "Blood request accepted successfully! The hospital has been notified.",
      request: {
        _id: request._id,
        hospital: request.hospital,
        bloodGroup: request.bloodGroup,
        units: request.units,
        status: request.status,
      },
    });
  } catch (error) {
    console.error("❌ acceptBloodRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/* ============================
   HOSPITAL CONFIRM DONATION
============================ */
export const confirmDonation = async (req, res) => {
  try {
    // 1️⃣ Only hospitals can confirm
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Only hospitals can confirm donations",
      });
    }

    const { donorId, bloodRequestId, units } = req.body;

    // 2️⃣ Validate input
    if (!donorId || !bloodRequestId || !units || units <= 0) {
      return res.status(400).json({
        success: false,
        message: "donorId, bloodRequestId, and units (>0) are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(donorId) ||
      !mongoose.Types.ObjectId.isValid(bloodRequestId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid donorId or bloodRequestId",
      });
    }

    // 3️⃣ Verify donor exists
    const donor = await User.findById(donorId);
    if (!donor || donor.role !== "donor") {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    // 4️⃣ Verify blood request exists and belongs to this hospital
    const request = await BloodRequest.findById(bloodRequestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found",
      });
    }

    if (request.hospital.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only confirm donations for your own requests",
      });
    }

    // 5️⃣ Ensure donor accepted this request
    if (
      !request.acceptedDonor ||
      request.acceptedDonor.toString() !== donorId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This donor did not accept this blood request. Only accepted donors can be confirmed.",
      });
    }

    // 🆕 6️⃣ CHECK IF DONATION ALREADY EXISTS FOR THIS BLOOD REQUEST
    const existingDonation = await Donation.findOne({
      bloodRequest: bloodRequestId,
      donor: donorId,
      hospital: req.user._id
    });

    if (existingDonation) {
      return res.status(400).json({
        success: false,
        message: "This donation has already been confirmed",
      });
    }

    // 🆕 7️⃣ CHECK IF REQUEST IS ALREADY COMPLETED
    if (request.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "This blood request has already been completed",
      });
    }

    // 7️⃣ Create donation record
    const donation = await Donation.create({
      donor: donorId,
      hospital: req.user._id,
      bloodGroup: donor.bloodGroup,
      units,
      donationDate: new Date(),
      bloodRequest: bloodRequestId,
    });

    // 8️⃣ Update blood request status to completed
    request.status = "completed";
    await request.save();

    // 9️⃣ Create notification for donor
    const notification = await Notification.create({
      donor: donorId,
      bloodRequest: bloodRequestId,
      hospital: {
        id: req.user._id,
        name: req.user.name,
      },
      bloodGroup: donor.bloodGroup,
      units,
      urgency: "confirmed",
      isDelivered: false,
    });

    // 🔟 Socket.io: notify donor in real-time
    if (req.io) {
      const donorRoomId = `user:${donorId}`;
      req.io.to(donorRoomId).emit("donation_confirmed", {
        donationId: donation._id,
        hospitalName: req.user.name,
        units,
        bloodGroup: donor.bloodGroup,
        donationDate: donation.donationDate,
        bloodRequestId,
        message: `Thank you for your donation! ${req.user.name} has confirmed receiving ${units}ml of ${donor.bloodGroup} blood.`,
      });

      // Mark notification as delivered
      notification.isDelivered = true;
      await notification.save();

      console.log(`✅ Notified donor ${donor.name} about donation confirmation`);
    }

    return res.status(201).json({
      success: true,
      message:
        "Donation confirmed successfully! The donor has been notified and the request is now complete.",
      donation,
    });
  } catch (error) {
    console.error("❌ confirmDonation error:", error);
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
    if (req.user.role !== "donor") {
      return res.status(403).json({
        success: false,
        message: "Only donors can access this dashboard",
      });
    }

    const donations = await Donation.find({ donor: req.user._id })
      .populate("hospital", "name")
      .sort({ donationDate: -1 });

    const totalUnits = donations.reduce((sum, d) => sum + d.units, 0);
    const lastDonationDate =
      donations.length > 0 ? donations[0].donationDate : null;
    const nextEligibleDate = lastDonationDate
      ? new Date(
          new Date(lastDonationDate).getTime() + 90 * 24 * 60 * 60 * 1000
        )
      : null;

    const history = donations.map((d) => ({
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
    console.error("❌ getDonorDashboard error:", error);
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
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Only hospitals can access this dashboard",
      });
    }

    const donations = await Donation.find({ hospital: req.user._id })
      .populate("donor", "name bloodGroup")
      .sort({ donationDate: -1 });

    const totalUnits = donations.reduce((sum, d) => sum + d.units, 0);

    const bloodGroupSummary = {};
    donations.forEach((d) => {
      const group = d.bloodGroup;
      bloodGroupSummary[group] = (bloodGroupSummary[group] || 0) + d.units;
    });

    const history = donations.map((d) => ({
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
    console.error("❌ getHospitalDashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};