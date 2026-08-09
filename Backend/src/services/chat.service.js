import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { moderateMessage } from "./moderation.service.js";

export async function sendMessage(
  conversationId,
  userId,
  text
) {
  // Find the conversation and make sure
  // the current user is one of its participants.
  const conversation =
    await Conversation.findOne({
      _id: conversationId,
      status: "active",
      $or: [
        { senderUser: userId },
        { recipientUser: userId },
      ],
    });

  if (!conversation) {
    const error = new Error(
      "Conversation not found or access denied."
    );

    error.statusCode = 403;

    throw error;
  }

  // Local zero-cost moderation.
  const moderation =
    moderateMessage(text);

  if (!moderation.allowed) {
    const error = new Error(
      moderation.reason
    );

    error.statusCode = 400;

    throw error;
  }

  // Save the message FIRST.
  // Socket notification will happen later.
  const message = await Message.create({
    conversationId:
      conversation._id,

    senderUser: userId,

    text: text.trim(),
  });

  // Update conversation metadata.
  conversation.lastMessageAt =
    message.createdAt;

  await conversation.save();

  return message;
}