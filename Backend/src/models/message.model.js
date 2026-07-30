import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    confession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Confession",
      required: true,
      // index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    seenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Fast:
// messages for confession ABC
// ordered oldest → newest
messageSchema.index({
  confession: 1,
  createdAt: 1,
});

export default mongoose.model(
  "Message",
  messageSchema
);