//connect to firebase then connect to storage bucket
import admin from "firebase-admin";
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
};


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "confessionvault.firebasestorage.app"
});

const bucket = admin.storage().bucket();

export { bucket };