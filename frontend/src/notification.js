import { getToken } from "firebase/messaging";
import { messaging } from "./firebase.js";

const API = import.meta.env.VITE_BACKEND_URL;

export const enableAdminNotifications = async () => {
  const permission =
    await Notification.requestPermission();

  if (permission !== "granted") {
    alert("Notification permission denied");
    return;
  }

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
  });

  const adminToken =
    localStorage.getItem("adminToken");

  await fetch(`${API}/api/v1/notifications/admin-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ token })
  });

  alert("Admin notifications enabled");
};