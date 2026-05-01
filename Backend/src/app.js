import express from "express";
import cors from "cors";

const app = express();

// middlewares
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// test route
app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

// routes
import authRouter from "./Routes/auth.route.js";
import healthRouter from "./Routes/healthcheck.route.js";
import confessionRouter from "./routes/confession.route.js";

app.use("/api/v1/confessions", confessionRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/healthcheck", healthRouter);

export default app;