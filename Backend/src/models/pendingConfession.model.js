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
      lowercase: true,
      trim: true,
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

    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },

    delivered: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model(
  "PendingConfession",
  pendingConfessionSchema,
);