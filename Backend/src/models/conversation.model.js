import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // The confession that created/unlocked this conversation.
    confessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Confession",
      required: true,
      unique: true,
    },

    // User who originally sent the confession.
    senderUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // User who received the confession.
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Conversation state.
    status: {
      type: String,
      enum: ["active", "blocked", "closed"],
      default: "active",
    },

    // Useful later for inbox/chat-list preview.
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helps find conversations belonging to a sender,
// ordered from newest to oldest.
conversationSchema.index({
  senderUser: 1,
  updatedAt: -1,
});

// Helps find conversations belonging to a recipient,
// ordered from newest to oldest.
conversationSchema.index({
  recipientUser: 1,
  updatedAt: -1,
});

export default mongoose.model(
  "Conversation",
  conversationSchema
);