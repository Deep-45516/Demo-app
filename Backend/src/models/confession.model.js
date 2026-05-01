import mongoose from "mongoose";

const confessionSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      default: "Someone",
      trim: true
    },
    from: {
      type: String,
      default: "Unknown",
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "posted"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Confession", confessionSchema);