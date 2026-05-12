import express from "express";
import cors from "cors";
import instagramRouter from "./routes/instagram.route.js";

const app = express();

// middlewares
app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://sayitfreely.vercel.app"
  ],
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));

// test route
app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

// routes
import authRouter from "./routes/auth.route.js";
import healthRouter from "./routes/healthcheck.route.js";
import confessionRouter from "./routes/confession.route.js";

app.use("/api/v1/instagram", instagramRouter);
app.use("/api/v1/confessions", confessionRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/healthcheck", healthRouter);

export default app;