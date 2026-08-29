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

    readAt: {
  type: Date,
  default: null,
},

    visibility: {
      type: String,
      enum: ["private", "anonymous", "public"],
      default: "private",
    },

        // ==========================
    // Public Posting Consent
    // ==========================
    // Sender agrees that the recipient
    // may choose to publish this confession publicly.
    publicConsent: {
      type: Boolean,
      default: false,
    },

    // True after the recipient actually
    // chooses to publish the confession.
    publicPosted: {
      type: Boolean,
      default: false,
    },

    publicPostedAt: {
      type: Date,
      default: null,
    },

    publicPostedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
    theme: {
  type: String,
  enum: ["signal", "love", "funny"],
  default: "signal",
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