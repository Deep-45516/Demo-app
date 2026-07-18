import mongoose from "mongoose";

const adminNotificationTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model(
  "AdminNotificationToken",
  adminNotificationTokenSchema,
);
