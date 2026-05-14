import admin from "firebase-admin";
import AdminNotificationToken from
"../models/adminNotificationToken.model.js";

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
        }
      });
    } catch (error) {
      console.log(
        "Notification failed:",
        error.message
      );
    }
  }
};