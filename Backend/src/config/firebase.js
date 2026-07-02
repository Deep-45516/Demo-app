import admin from "firebase-admin";

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const module = await import("./firebase-key.json", {
    with: { type: "json" }
  });

  serviceAccount = module.default;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "confessionvault",
});

export const bucket = admin.storage().bucket();