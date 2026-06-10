import admin from "firebase-admin";

import AdminNotificationToken
from "../models/adminNotificationToken.model.js";

export const sendAdminNotification =
async ({ title, body }) => {

  const tokens =
    await AdminNotificationToken.find();

  for (const item of tokens) {

    try {

      await admin.messaging().send({
        token: item.token,

        notification: {
          title,
          body
        },

        webpush: {
          fcmOptions: {
            link: "https://sayitfreely.vercel.app/admin"
          }
        }
      });

      console.log("Notification sent");

    } catch (error) {

      console.log(
        "Notification failed:",
        error.message
      );
      console.error(error);

      if (
  error.code === "messaging/registration-token-not-registered" ||
  error.code === "messaging/invalid-registration-token" ||
  error.code === "messaging/mismatched-credential"
) {
  await AdminNotificationToken.deleteOne({
    token: item.token
  });

  console.log("Deleted invalid FCM token");
      }
    }
  }
};