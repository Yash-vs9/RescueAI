// Donation.js
import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    units: { type: Number, required: true, min: 1 },
    donationDate: { type: Date, default: Date.now },
    bloodRequest: { type: mongoose.Schema.Types.ObjectId, ref: "BloodRequest" }, // optional reference
  },
  { timestamps: true }
);

//  fast querying in dashboard
donationSchema.index({ donor: 1 });
donationSchema.index({ hospital: 1 });
donationSchema.index({ donationDate: -1 });

export default mongoose.model("Donation", donationSchema);