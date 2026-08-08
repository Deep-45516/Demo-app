import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // Conversation this message belongs to.
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    // User who sent this particular message.
    senderUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Actual message content.
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // null = not seen yet.
    // Date = recipient has seen it.
    seenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Main chat query:
// "Give me messages for this conversation,
// newest/oldest in the required order."
messageSchema.index({
  conversationId: 1,
  createdAt: -1,
});

export default mongoose.model(
  "Message",
  messageSchema
);