import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // --------------------
    // Instagram Identity (Primary)
    // --------------------
    instagramScopedId: {
      type: String,
      unique: true,
      sparse: true,
    },

    instagramUsername: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },

    instagramName: {
      type: String,
      default: null,
    },

    instagramVerified: {
      type: Boolean,
      default: false,
    },

    // --------------------
    // Google Identity (Secondary)
    // --------------------
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      // default: null,
    },

 email: {
  type: String,
  unique: true,
  sparse: true,
  lowercase: true,
  trim: true,
},

    name: {
      type: String,
      default: null,
    },

    profilePicture: {
      type: String,
      default: null,
    },

    // --------------------
    // Platform
    // --------------------
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    college: {
      type: String,
      default: "WIT_SOLAPUR",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("User", userSchema);
