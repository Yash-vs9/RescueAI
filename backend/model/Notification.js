import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bloodRequest: { type: mongoose.Schema.Types.ObjectId, ref: "BloodRequest", required: true },
  hospital: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    location: String
  },
  bloodGroup: String,
  units: Number,
  urgency: String,
  isDelivered: { type: Boolean, default: false }, // Has donor received it yet?
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
