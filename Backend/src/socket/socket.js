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
    /*React will later send,THIS STORED IN TOKEN
io(API, {
    auth: {
        token
    }
}); */
    if (!token) {
      return next(new Error("Authentication required"));
    }
//SAME FUNTION ,THAT REST APU USED
    const decoded = verifyJWT(token);
//DONT JUST RELAY ON JWT, ALSO VERIFY WHO IS USER
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error("User not found"));
    }
//SAME AS REQ.USER,SO LATER WE CAN ACCESS IT LIKE SOCKET.USER.INSTAGRAMUSERNAME
    socket.user = user;

    next();
  } catch (error) {
    console.error("Socket auth failed:", error.message);
    next(new Error("Invalid token"));
}
});

  io.on("connection", (socket) => {
    console.log(
  `Socket connected:
${socket.id}
User:
${socket.user.instagramUsername}`
);

//it creates a unique room,so same user will get join that room even with diffrent devices,becuz it creates a diffrent socket in same room,so we can send message to all devices of same user
socket.join(`user:${socket.user._id}`);
console.log(
  `${socket.user.instagramUsername}
joined room:
user:${socket.user._id}`
);
 socket.onAny((event, ...args) => {
    console.log("Received Event:", event, args);
  });

    socket.on("disconnect", () => {
      console.log(
        "Socket disconnected:",
        socket.id
      );
    });
  });

  return io;
}
//when someone receive confession,we not send it to socket id , we send it to room,so room decides which socket receives it(send toall devices of that user)
export function getIO() {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized."
    );
  }

  return io;
}