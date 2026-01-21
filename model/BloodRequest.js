import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hospitalName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  units: { type: Number, required: true }, 
  urgency: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  // ADDED: To store the AI-generated summary for the UI
  aiDescription: { type: String }, 
  // ADDED: To manage the lifecycle of the request
  status: { type: String, enum: ["open", "completed", "expired"], default: "open" },
  location: {
    address: { type: String, required: true },
    coordinates: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    }
  },
  createdAt: { type: Date, default: Date.now },
});

bloodRequestSchema.index({ "location.coordinates": "2dsphere" });

export default mongoose.model("BloodRequest", bloodRequestSchema);