import { getIO } from "./socket.js";

export function notifyPublicPostUpdated(
  userId,
  data
) {
  try {
    const io = getIO();

    io.to(`user:${userId}`).emit(
      "public-post-updated",
      data
    );
  } catch (error) {
    // Socket notification must never
    // break the actual Instagram posting.
    console.error(
      "PUBLIC POST SOCKET ERROR:",
      error.message
    );
  }
}