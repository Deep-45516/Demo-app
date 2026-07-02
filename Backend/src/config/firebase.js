import admin from "firebase-admin";

import serviceAccountFile from "./firebase-key.json" assert { type: "json" };

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : serviceAccountFile;

console.log("Firebase project:", serviceAccount.project_id);
console.log("Firebase email:", serviceAccount.client_email);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "confessionvault"
});

const bucket = admin.storage().bucket();

export { bucket };