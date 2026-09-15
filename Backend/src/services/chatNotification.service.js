import { getIO } from "../socket/socket.js";

export function notifyNewMessage(
  conversation,
  message,
  senderUserId
) {
  const senderId =
    senderUserId.toString();

  const recipientUserId =
    conversation.senderUser.toString() ===
    senderId
      ? conversation.recipientUser
      : conversation.senderUser;

  const io = getIO();

  const payload = {
  message,
  confessionId: conversation.confessionId,
  lastActivityAt: message.createdAt,
  senderUserId: senderId,
  unreadFor: recipientUserId,
};

io.to(`user:${recipientUserId}`).emit(
  "new-message",
  payload
);

io.to(`user:${senderId}`).emit(
  "new-message",
  payload
);
}