import rateLimit from "express-rate-limit";

export const instagramVerificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    message: "Too many verification requests. Please try again in a minute.",
  },
});//One user (one IP address) can make only 5 requests per minute.
//windowMs = the time window (in milliseconds).
//60 * 1000 = 60,000 milliseconds = 1 minute.