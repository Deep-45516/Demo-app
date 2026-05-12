import mongoose from "mongoose";

const confessionSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      default: "Someone",
      trim: true,
    },
    from: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrls: {
      type: [String],
      default: [],
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },
    caption: {
      type: String,
      default: "Here is our next confession 👀",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "posted"],
      default: "pending",
    },
    postedAt: {
      type: Date,
      default: null,
    },

    instagramPostId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Confession", confessionSchema);
