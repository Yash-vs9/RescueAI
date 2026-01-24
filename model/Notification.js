// model/Notification.js
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
  message: { type: String }, // ✅ Added message field
  type: { 
    type: String, 
    enum: ["blood_request", "donation_confirmed", "general"],
    default: "blood_request" 
  }, // ✅ Added notification type
  isDelivered: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false }, // ✅ Added read status
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;