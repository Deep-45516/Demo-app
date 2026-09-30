import admin from "firebase-admin";
import UserNotificationToken from "../models/userNotificationToken.model.js";
import { getIO } from "../socket/socket.js";

export const sendUserNotification = async (
  userId,
  { title, body, url = "/inbox", tag, skipIfOnline = true }
) => {
  try {
    const docs = await UserNotificationToken.find({ user: userId }).select("token");
    if (!docs.length) return;
    const tokens = docs.map((d) => d.token);

    const res = await admin.messaging().sendEachForMulticast({
      tokens,
      // data-only: the service worker builds the notification (no duplicates)
      data: { title, body, url, tag: tag || "general" },
      webpush: { headers: { TTL: "86400", Urgency: "high" } },
    });

    // Clean dead tokens
    const dead = [];
    res.responses.forEach((r, i) => {
      const code = r.error?.code;
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) dead.push(tokens[i]);
    });
    if (dead.length) await UserNotificationToken.deleteMany({ token: { $in: dead } });
  } catch (err) {
    console.error("USER PUSH ERROR:", err.message);
  }
};