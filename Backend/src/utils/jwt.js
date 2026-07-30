import jwt from "jsonwebtoken";

export function verifyJWT(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}