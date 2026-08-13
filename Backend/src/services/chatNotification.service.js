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

  io.to(
    `user:${recipientUserId}`
  ).emit(
    "new-message",
    {
      message,
    }
  );
}