import { getToken } from "firebase/messaging";
import { messaging } from "./firebase.js";

const API = import.meta.env.VITE_BACKEND_URL;

export const enableAdminNotifications = async () => {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    alert("Notification permission denied");
    return;
  }

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
  });

  console.log("FCM TOKEN:", token);

  const adminToken = localStorage.getItem("adminToken");

  const res = await fetch(
    `${API}/api/v1/notifications/admin-token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ token })
    }
  );

  const data = await res.json();
  console.log(data);

  alert("Notifications enabled");
};