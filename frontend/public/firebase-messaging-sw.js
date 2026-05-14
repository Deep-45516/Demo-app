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
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/favicon.svg"
    }
  );
});