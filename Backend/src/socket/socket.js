import { Server } from "socket.io";
import { authenticateSocket } from "./auth.socket.js";
import { joinUserRoom } from "./room.socket.js";

let io;

export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "https://sayitfreely.vercel.app"],
      credentials: true,
    },
  });
  //This is the Socket.IO middleware,like app.use for express
  io.use(authenticateSocket);
  //on means whever someonesends event, it listnes,here, when new user connect this runs and give it a alocated socket
  io.on("connection", (socket) => {
    console.log(
      `Socket connected:
      ${socket.id}
      User:
      ${socket.user.instagramUsername}`,
    );

    //it creates a unique room,so same user will get join that room even with diffrent devices,becuz it creates a diffrent socket in same room,so we can send message to all devices of same user
    joinUserRoom(socket);
    socket.onAny((event, ...args) => {
      console.log("Received Event:", event, args);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}
//when someone receive confession,we not send it to socket id , we send it to room,so room decides which socket receives it(send toall devices of that user)
export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized.");
  }

  return io;
}
/*Creates Socket.IO server
├── Registers middleware
├── Handles connect/disconnect
└── Exports io */