import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

const REVEAL_AFTER_MESSAGES = 7;
const REVEAL_REQUEST_HOURS = 24;

function getOtherUser(conversation, userId) {
  if (
    String(conversation.senderUser) ===
    String(userId)
  ) {
    return conversation.recipientUser;
  }

  return conversation.senderUser;
}

export async function requestReveal(
  conversationId,
  userId
) {
  const conversation =
    await Conversation.findOne({
      _id: conversationId,
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

  if (
    conversation.identityRevealStatus ===
    "revealed"
  ) {
    const error = new Error(
      "Identity has already been revealed."
    );
    error.statusCode = 400;
    throw error;
  }

  // If an old request expired, allow a new one.
  if (
    conversation.identityRevealStatus ===
      "pending" &&
    conversation.identityRevealExpiresAt &&
    conversation.identityRevealExpiresAt <=
      new Date()
  ) {
    conversation.identityRevealStatus =
      "none";

    conversation.identityRevealRequestedBy =
      null;

    conversation.identityRevealRequestedAt =
      null;

    conversation.identityRevealExpiresAt =
      null;

    await conversation.save();
  }

  if (
    conversation.identityRevealStatus ===
    "pending"
  ) {
    const error = new Error(
      "A reveal request is already waiting for a response."
    );
    error.statusCode = 400;
    throw error;
  }

  const messageCount =
    await Message.countDocuments({
      conversationId,
    });

  if (
    messageCount < REVEAL_AFTER_MESSAGES
  ) {
    const remaining =
      REVEAL_AFTER_MESSAGES -
      messageCount;

    const error = new Error(
      `Reveal becomes available after ${REVEAL_AFTER_MESSAGES} messages. ${remaining} more message${remaining === 1 ? "" : "s"} to go.`
    );

    error.statusCode = 400;
    throw error;
  }

  const now = new Date();

  const expiresAt = new Date(
    now.getTime() +
      REVEAL_REQUEST_HOURS *
        60 *
        60 *
        1000
  );

  conversation.identityRevealStatus =
    "pending";

  conversation.identityRevealRequestedBy =
    userId;

  conversation.identityRevealRequestedAt =
    now;

  conversation.identityRevealExpiresAt =
    expiresAt;

  await conversation.save();

  return {
    status: "pending",
    requestedBy: userId,
    requestedFrom: getOtherUser(
      conversation,
      userId
    ),
    expiresAt,
  };
}

export async function respondToReveal(
  conversationId,
  userId,
  decision
) {
  const conversation =
    await Conversation.findOne({
      _id: conversationId,
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
  const requestedBy =
  conversation.identityRevealRequestedBy;

const otherUserId =
  getOtherUser(conversation, userId);

  if (
    conversation.identityRevealStatus !==
    "pending"
  ) {
    const error = new Error(
      "There is no pending reveal request."
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    String(
      conversation.identityRevealRequestedBy
    ) === String(userId)
  ) {
    const error = new Error(
      "You cannot respond to your own reveal request."
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    conversation.identityRevealExpiresAt &&
    conversation.identityRevealExpiresAt <=
      new Date()
  ) {
    conversation.identityRevealStatus =
      "none";

    conversation.identityRevealRequestedBy =
      null;

    conversation.identityRevealRequestedAt =
      null;

    conversation.identityRevealExpiresAt =
      null;

    await conversation.save();

    const error = new Error(
      "This reveal request has expired."
    );
    error.statusCode = 400;
    throw error;
  }

  if (decision === "not_yet") {
    conversation.identityRevealStatus =
      "none";

    conversation.identityRevealRequestedBy =
      null;

    conversation.identityRevealRequestedAt =
      null;

    conversation.identityRevealExpiresAt =
      null;

    await conversation.save();

return {
  status: "none",
  decision: "not_yet",
  requestedBy,
  otherUserId,
};
  }

  if (decision === "reveal") {
    conversation.identityRevealStatus =
      "revealed";

    conversation.identityRevealedAt =
      new Date();

    conversation.identityRevealRequestedBy =
      null;

    conversation.identityRevealRequestedAt =
      null;

    conversation.identityRevealExpiresAt =
      null;

    await conversation.save();

return {
  status: "revealed",
  decision: "reveal",
  requestedBy,
  otherUserId,
  revealedAt:
    conversation.identityRevealedAt,
};
  }

  const error = new Error(
    "Invalid reveal decision."
  );
  error.statusCode = 400;
  throw error;
}