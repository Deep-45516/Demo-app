import { Server } from "socket.io";
import { verifyJWT } from "../utils/jwt.js";
import User from "../models/user.model.js";

let io;

export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://sayitfreely.vercel.app",
      ],
      credentials: true,
    },
  });
//This is the Socket.IO middleware,like app.use for express
  io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = verifyJWT(token);

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;

    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

  io.on("connection", (socket) => {
    console.log(
      "Socket connected:",
      socket.id
    );

    socket.on("disconnect", () => {
      console.log(
        "Socket disconnected:",
        socket.id
      );
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized."
    );
  }

  return io;
}