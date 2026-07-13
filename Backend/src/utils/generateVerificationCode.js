import crypto from "crypto";

export const generateVerificationCode = () => {
  return `CV-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};//It uses the crypto module to create a random 4-byte hexadecimal string, converts it to uppercase, and prefixes it with "CV-".
//generated verification code will be unique each time the function is called because it uses random bytes to create the code, still there is a very small chance of collision, but for most practical purposes, it can be considered unique.