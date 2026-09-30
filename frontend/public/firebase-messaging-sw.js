importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDP4pFPmSwIQPyWNaO1JfM8IXxNo66Dmis",
  authDomain: "confessionvault.firebaseapp.com",
  projectId: "confessionvault",
  messagingSenderId: "982214862364",
  appId: "1:982214862364:web:9edefcb6ed3279e72561d9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // User pushes are data-only
  if (payload.data && payload.data.title) {
    const { title, body, url, tag } = payload.data;
    return self.registration.showNotification(title, {
      body,
      tag,            // same tag = replaces the old notification
      renotify: true,
      icon: "/favicon.svg",
      data: { url },
    });
  }
  // Admin pushes (unchanged behavior)
  if (payload.notification) {
    self.registration.showNotification(payload.notification.title, {
      body: payload.notification.body,
      icon: "/favicon.svg",
      data: {
        url: "https://sayitfreely.vercel.app/admin",
        fallbackUrl: "https://wit-tbh.vercel.app/admin",
      },
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || event.notification.data?.fallbackUrl || "/inbox",
    self.location.origin
  ).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && "focus" in c) {
          c.navigate(target);
          return c.focus();
        }
      }
      return clients.openWindow(target);
    })
  );
});