//C:\Users\yashl\OneDrive\Desktop\clean-repo\frontend\src\components\InstagramVerification\NotificationToggle.jsx
import { useEffect, useState } from "react";
import {
  notificationSupported,
  enableUserNotifications,
  disableUserNotifications,
  syncUserToken,
} from "../../notifications.js";

export default function NotificationToggle() {
  const [state, setState] = useState("loading"); // unsupported | off | on | blocked

  useEffect(() => {
    if (!notificationSupported()) return setState("unsupported");
    if (Notification.permission === "denied") return setState("blocked");

    if (Notification.permission === "granted" && localStorage.getItem("fcmToken")) {
      setState("on");
      // tokens can rotate, so re-sync once per session (1 tiny request)
      if (!sessionStorage.getItem("fcmSynced")) {
        sessionStorage.setItem("fcmSynced", "1");
        syncUserToken().catch(() => {});
      }
    } else {
      setState("off");
    }
  }, []);

  const turnOn = async () => {
    try {
      const r = await enableUserNotifications();
      setState(r === "granted" ? "on" : r === "denied" ? "blocked" : "off");
    } catch (e) {
      console.error(e);
      setState("off");
    }
  };

  const turnOff = async () => {
    await disableUserNotifications();
    setState("off");
  };

  if (state === "loading") return null;

  return (
    <div className="notif-bar">
      {state === "unsupported" && (
        <span>🔔 On iPhone: tap Share → "Add to Home Screen" to get notifications.</span>
      )}
      {state === "blocked" && (
        <span>🔕 Notifications are blocked. Enable them in your browser's site settings.</span>
      )}
      {state === "off" && (
        <button onClick={turnOn}>🔔 Turn on notifications</button>
      )}
      {state === "on" && (
        <>
          <span>🔔 Notifications on</span>
          <button onClick={turnOff}>Turn off</button>
        </>
      )}
    </div>
  );
}