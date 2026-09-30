import { getToken } from "firebase/messaging";
import { messaging } from "./firebase.js";

const API = import.meta.env.VITE_BACKEND_URL;

/* ================= ADMIN (unchanged) ================= */

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

/* ================= USERS ================= */

// Set this to the localStorage key your normal login uses
// (same one your inbox.js reads for the Authorization header)
const USER_TOKEN_KEY = "token";

const userAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem(USER_TOKEN_KEY)}`,
});

export const notificationSupported = () =>
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

// Gets the FCM token and saves it on the backend for the logged-in user.
export const syncUserToken = async () => {
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  });
  if (!token) return null;

  await fetch(`${API}/api/v1/notifications/user-token`, {
    method: "POST",
    headers: userAuthHeaders(),
    body: JSON.stringify({ token }),
  });

  localStorage.setItem("fcmToken", token);
  return token;
};

// Only call this from a button tap (shows the browser permission popup).
export const enableUserNotifications = async () => {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  await syncUserToken();
  return "granted";
};

export const disableUserNotifications = async () => {
  const token = localStorage.getItem("fcmToken");
  if (!token) return;

  await fetch(`${API}/api/v1/notifications/user-token`, {
    method: "DELETE",
    headers: userAuthHeaders(),
    body: JSON.stringify({ token }),
  });

  localStorage.removeItem("fcmToken");
};