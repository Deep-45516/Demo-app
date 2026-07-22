import mongoose from "mongoose";

const pendingConfessionSchema = new mongoose.Schema(
  {
    senderUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderAnonymousProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AnonymousProfile",
      required: true,
    },

    senderAnonymousName: {
      type: String,
      required: true,
    },

    recipientInstagramUsername: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
    },

    imageUrls: {
      type: [String],
      default: [],
    },

    delivered: {
      type: Boolean,
      default: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "PendingConfession",
  pendingConfessionSchema
);