import { getIO } from "./socket.js";

export function notifyRevealUpdated(
  userId,
  data
) {
  const io = getIO();

  io.to(`user:${userId}`).emit(
    "reveal-updated",
    data
  );
}