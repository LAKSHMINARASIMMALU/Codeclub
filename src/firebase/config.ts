// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfqdhD1lL1ggsD-OQJAvcZycktrMg3uAs",
  authDomain: "studio-7202384570-392a7.firebaseapp.com",
  projectId: "studio-7202384570-392a7",
  storageBucket: "studio-7202384570-392a7.appspot.com",
  messagingSenderId: "219874685275",
  appId: "1:219874685275:web:c0c2d6058c887a8db4aa7e"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let analytics;
if (typeof window !== 'undefined' && isSupported()) {
    analytics = getAnalytics(app);
}

export { app, auth, db, analytics };
