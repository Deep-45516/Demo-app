import mongoose from "mongoose";

const anonymousProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    anonymousName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    avatar: {
      type: String,
      default: null,
    },

    reputation: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "AnonymousProfile",
  anonymousProfileSchema
);