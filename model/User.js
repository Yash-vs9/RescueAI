import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ["donor", "hospital"], default: "donor" },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: function() {
        // Blood group is required only if role is "donor"
        return this.role === "donor";
      },
      validate: {
        validator: function(value) {
          // Blood group should NOT exist if role is "hospital"
          if (this.role === "hospital" && value) {
            return false;
          }
          return true;
        },
        message: "Blood group should not be set for hospitals"
      }
    },

    isAvailable: { type: Boolean, default: true },

    location: {
      address: { type: String, required: true },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [lng, lat]
          required: true,
        },
      },
    },
  },
  { timestamps: true }
);

// ✅ CORRECT geo index
userSchema.index({ "location.coordinates": "2dsphere" });

export default mongoose.model("User", userSchema);