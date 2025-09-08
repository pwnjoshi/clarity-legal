// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNKqvmC6GqfGgRc_CrwXlTmgIVuRIiSQ4",
  authDomain: "clarity-legal-6bda6.firebaseapp.com",
  projectId: "clarity-legal-6bda6",
  storageBucket: "clarity-legal-6bda6.firebasestorage.app",
  messagingSenderId: "495984648211",
  appId: "1:495984648211:web:d0a81b1c7287ecff961fe6",
  measurementId: "G-VN345QMN5W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export auth so you can use it in login.jsx & AuthContext.jsx
export const auth = getAuth(app);

// ✅ Export Firestore database
export const db = getFirestore(app);

// (Optional) Analytics — only works in browsers with measurement enabled
export const analytics = getAnalytics(app);
