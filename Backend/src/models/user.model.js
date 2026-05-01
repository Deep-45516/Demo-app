import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);