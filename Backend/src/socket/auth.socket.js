//Verifies JWT AND ALL AUTH OF SOCKET LOGIC
import User from "../models/user.model.js";
import { verifyJWT } from "../utils/jwt.js";

export async function authenticateSocket(
  socket,
  next
) {
  try {
    const token =
      socket.handshake.auth.token;

    if (!token) {
      return next(
        new Error("Authentication required")
      );
    }

    const decoded = verifyJWT(token);

    const user =
      await User.findById(decoded.id);

    if (!user) {
      return next(
        new Error("User not found")
      );
    }

    socket.user = user;

    next();

  } catch (error) {
    console.error(
      "Socket auth failed:",
      error.message
    );

    next(new Error("Invalid token"));
  }
}
