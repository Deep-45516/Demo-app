import mongoose from "mongoose";

const confessionSchema = new mongoose.Schema(
  {
    // ==========================
    // Sender
    // ==========================
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

    // ==========================
    // Recipient
    // ==========================
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipientInstagramUsername: {
      type: String,
      required: true,
    },

    // ==========================
    // Confession Content
    // ==========================
    message: {
      type: String,
      required: true,
      trim: true,
    },

    imageUrls: {
      type: [String],
      default: [],
    },

    caption: {
      type: String,
      default: "Here is our next confession 👀",
    },

    // ==========================
    // Recipient Interaction
    // ==========================
    deliveryStatus: {
      type: String,
      enum: ["sent", "seen"],
      default: "sent",
    },

    recipientAction: {
      type: String,
      enum: ["pending", "curious", "not_interested"],
      default: "pending",
    },

    visibility: {
      type: String,
      enum: ["private", "anonymous", "public"],
      default: "private",
    },

    // ==========================
    // Admin Moderation
    // ==========================
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "posted"],
      default: "pending",
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    // ==========================
    // Instagram Posting
    // ==========================
    postedAt: {
      type: Date,
      default: null,
    },

    instagramPostId: {
      type: String,
      default: null,
    },

    postError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
// Fast Received inbox
confessionSchema.index({
  recipientUser: 1,
  createdAt: -1,
});

// Fast Sent inbox
confessionSchema.index({
  senderUser: 1,
  createdAt: -1,
});

export default mongoose.model("Confession", confessionSchema);