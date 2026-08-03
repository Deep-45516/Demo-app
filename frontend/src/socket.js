// This file becomes the manager of your WebSocket connection.
// Instead of creating sockets everywhere:
import { io } from "socket.io-client";

const API = import.meta.env.VITE_BACKEND_URL;

let socket = null;

export function connectSocket() {
    if (socket?.connected) {
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
    console.log("✅ Connected to socket:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("🚨 Socket connection failed:", error.message);
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