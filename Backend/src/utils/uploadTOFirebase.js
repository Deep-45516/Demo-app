import confessionRouter from "../routes/confession.route.js";
import { bucket } from "../config/firebase.js";
import crypto from "crypto";

export const uploadImage = async (filePath, to) => {

  const date =
    new Date().toISOString().split("T")[0];

  const cleanTo =
    typeof to === "string" && to.trim()
      ? to
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase()
      : "someone";

  const unique =
    crypto.randomUUID().slice(0, 8);

  const fileName =
    `confessions/${cleanTo}-${date}-${unique}.png`;

  await bucket.upload(filePath, {
    destination: fileName,
    public: true
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

  return publicUrl;
};