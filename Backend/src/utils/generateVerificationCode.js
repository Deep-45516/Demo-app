import crypto from "crypto";

export const generateVerificationCode = () => {
  return `CV-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};