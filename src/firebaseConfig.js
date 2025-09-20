// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Fallback configuration for development or if environment variables are not set
const fallbackConfig = {
  apiKey: "AIzaSyDNKqvmC6GqfGgRc_CrwXlTmgIVuRIiSQ4",
  authDomain: "clarity-legal-6bda6.firebaseapp.com",
  projectId: "clarity-legal-6bda6",
  storageBucket: "clarity-legal-6bda6.firebasestorage.app",
  messagingSenderId: "495984648211",
  appId: "1:495984648211:web:d0a81b1c7287ecff961fe6",
  measurementId: "G-VN345QMN5W"
};

// Use environment variables if available, otherwise use fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export auth so you can use it in login.jsx & AuthContext.jsx
export const auth = getAuth(app);

// ✅ Export Firestore database
export const db = getFirestore(app);

// (Optional) Analytics — only works in browsers with measurement enabled
export const analytics = getAnalytics(app);
