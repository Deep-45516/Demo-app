import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    name: {
      type: String,
      required: true
    },

    profilePicture: {
      type: String,
      default: null
    },

    instagramVerified: {
      type: Boolean,
      default: false
    },

    instagramSenderId: {
      type: String,
      default: null
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("User", userSchema);