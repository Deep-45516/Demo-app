import mongoose from "mongoose";

const confessionSchema = new mongoose.Schema(
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

    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    //to display
    recipientInstagramUsername: {
      type: String,
      required: true,
    },
    //to display
    senderAnonymousName: {
      type: String,
      required: true,
    },
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
    postError: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Confession", confessionSchema);
