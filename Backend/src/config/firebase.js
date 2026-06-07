import admin from "firebase-admin";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

console.log("Firebase project:", serviceAccount.project_id);
console.log("Firebase email:", serviceAccount.client_email);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "confessionvault.firebasestorage.app"
});

const bucket = admin.storage().bucket();

export { bucket };