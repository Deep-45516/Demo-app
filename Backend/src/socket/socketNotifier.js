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

  const room = `user:${userId}`;

  console.log(
    "🔥 CONFESSION UPDATE SOCKET:",
    {
      room,
      confessionId,
      recipientAction,
      conversationId,
    }
  );

  console.log(
    "ROOM EXISTS:",
    io.sockets.adapter.rooms.has(room)
  );

  io.to(room).emit(
    SOCKET_EVENTS.CONFESSION_UPDATED,
    {
      confessionId,
      recipientAction,
      conversationId,
    }
  );
}