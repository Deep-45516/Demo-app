//connect to firebase then connect to storage bucket
import admin from "firebase-admin";
import serviceAccount from "./firebase-key.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "confessionvault.firebasestorage.app"
});

const bucket = admin.storage().bucket();

export { bucket };