import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hospitalName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  units: { type: Number, required: true }, 
  urgency: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  location: {
    address: { type: String, required: true },
    coordinates: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], required: true }
    }
  },
  createdAt: { type: Date, default: Date.now },
});

// 2dsphere index for geo queries
bloodRequestSchema.index({ "location.coordinates": "2dsphere" });

export default mongoose.model("BloodRequest", bloodRequestSchema);

