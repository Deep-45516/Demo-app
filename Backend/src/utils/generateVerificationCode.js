import crypto from "crypto";

export const generateVerificationCode = () => {
  return `CV-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};//It uses the crypto module to create a random 4-byte hexadecimal string, converts it to uppercase, and prefixes it with "CV-".