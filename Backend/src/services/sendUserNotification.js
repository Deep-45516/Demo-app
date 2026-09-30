import admin from "firebase-admin";
import UserNotificationToken from "../models/userNotificationToken.model.js";

export const sendUserNotification = async (
  userId,
  { title, body, url = "/inbox", tag }
) => {
  try {
    console.log("PUSH: start for user", String(userId));

    const docs = await UserNotificationToken.find({ user: userId }).select("token");
    console.log("PUSH: tokens found:", docs.length);
    if (!docs.length) return;

    const tokens = docs.map((d) => d.token);

    const res = await admin.messaging().sendEachForMulticast({
      tokens,
      data: { title, body, url, tag: tag || "general" },
      webpush: { headers: { TTL: "86400", Urgency: "high" } },
    });

    console.log("PUSH: success", res.successCount, "failed", res.failureCount);

    const dead = [];
    res.responses.forEach((r, i) => {
      if (r.error) {
        console.log("PUSH: error for token", i, r.error.code, r.error.message);
        const code = r.error.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) dead.push(tokens[i]);
      }
    });
    if (dead.length) await UserNotificationToken.deleteMany({ token: { $in: dead } });
  } catch (err) {
    console.error("PUSH ERROR:", err);
  }
};