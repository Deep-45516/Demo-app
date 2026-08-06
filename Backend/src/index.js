import dotenv from "dotenv";
import http from "http";

import app from "./app.js";
import connectDB from "./db/connectDB.js";
import { createAdmins } from "./utils/createAdmin.js";
import { initializeSocket } from "./socket/socket.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Express handles HTTP requests
// Socket.IO also needs access to the underlying HTTP server.
//express->HTTP Server<-Socket.io
const httpServer = http.createServer(app);

// Attach Socket.IO to the SAME server.
initializeSocket(httpServer);

connectDB()
  .then(async () => {
    await createAdmins();

    httpServer.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error(
      "MongoDB Connection Error",
      err
    );

    console.error(err.stack);
  });