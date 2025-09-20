// src/firebaseConfig.example.js
// Create a file called firebaseConfig.js with your actual credentials
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth so you can use it in login.jsx & AuthContext.jsx
export const auth = getAuth(app);

// Export Firestore database
export const db = getFirestore(app);

// (Optional) Analytics — only works in browsers with measurement enabled
export const analytics = getAnalytics(app);