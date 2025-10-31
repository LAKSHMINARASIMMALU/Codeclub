// firebase.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";
if (!fs.existsSync(serviceAccountPath)) {
  console.warn(`Service account file not found at ${serviceAccountPath}. Backend may not work correctly without it. Download it from your Firebase project settings.`);
}

try {
    const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), "utf8"));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    console.warn('Could not initialize Firebase Admin SDK. Did you forget to add the serviceAccountKey.json file? Some features may not work.');
}


export const db = admin.firestore();
export const auth = admin.auth();
