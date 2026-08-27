import mongoose from "mongoose";

const verificationSessionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    enteredUsername: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "expired", "username_mismatch"],
      default: "pending",
    },
    lastError: {
      type: String,
      default: null,
    },
    //permanent identifier
    instagramScopedId: {
      type: String,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    token: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Automatically remove expired sessions
verificationSessionSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  },
);

export default mongoose.model("VerificationSession", verificationSessionSchema);