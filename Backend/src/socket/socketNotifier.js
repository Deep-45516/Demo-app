//Sends realtime events
import { getIO } from "./socket.js";
import { SOCKET_EVENTS } from "./socketEvents.js";

export function notifyNewConfession(
  recipientUserId,
  confession
) {
  const io = getIO();

  io.to(
    `user:${recipientUserId}`
  ).emit(
    SOCKET_EVENTS.NEW_CONFESSION,
    {
      confessionId:
        confession._id,
    }
  );
}

export function notifyConfessionUpdated(
  userId,
  confessionId,
  recipientAction,
  conversationId
) {
  const io = getIO();

  io.to(`user:${userId}`).emit(
    SOCKET_EVENTS.CONFESSION_UPDATED,
    {
      confessionId,
      recipientAction,
      conversationId,
    }
  );
}