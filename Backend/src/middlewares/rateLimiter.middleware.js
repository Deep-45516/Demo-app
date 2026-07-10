import rateLimit from "express-rate-limit";

export const instagramVerificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    message: "Too many verification requests. Please try again in a minute.",
  },
});