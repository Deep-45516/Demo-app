import express from "express";
import cors from "cors";
import instagramRouter from "./routes/instagram.route.js";
import webhookRouter from "./routes/webhook.route.js";

const app = express();//creates the Express application instance.
app.set("trust proxy", 1);//trust request come from render for each ip address can send linmited req per min / sec i.e rate limiting

// middlewares
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(
  cors({
    origin: ["http://localhost:5173", "https://sayitfreely.vercel.app"],
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
// test route
app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

// routes
import authRouter from "./routes/auth.route.js";
import healthRouter from "./routes/healthcheck.route.js";
import confessionRouter from "./routes/confession.route.js";

import notificationRouter from "./routes/notification.route.js";
app.use("/api/v1/instagram", instagramRouter);
app.use("/api/v1/confessions", confessionRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/healthcheck", healthRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/webhook", webhookRouter);

export default app;
