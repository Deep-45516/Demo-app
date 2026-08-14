// This file becomes the manager of your WebSocket connection.
// Instead of creating sockets everywhere:
import { io } from "socket.io-client";

const API = import.meta.env.VITE_BACKEND_URL;

let socket = null;

export function connectSocket() {
  console.log("connectSocket called");

  if (socket) {
    return socket;
  }

  const token = localStorage.getItem("token");

  if (!token) return null;

  socket = io(API, {
    auth: {
      token,
    },
  });

  socket.on("connect", () => {
    console.log(
      "✅ Connected:",
      socket.id
    );
  });

  socket.on("disconnect", () => {
    console.log(
      "❌ Disconnected"
    );
  });

  socket.on("connect_error", (err) => {
    console.error(err.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

//instead of writing socket.on(..) we use this as a helper sunscribeToNewConfession
export function subscribeToNewConfession(callback) {
  console.log("Listener attached");
  const currentSocket = connectSocket();
  if (!currentSocket) return;
  console.log("Subscribing to new-confession");
  currentSocket.on("new-confession", callback);
}

export function unsubscribeFromNewConfession(callback) {
  if (!socket) return;

  socket.off(
    "new-confession",
    callback
  );
}