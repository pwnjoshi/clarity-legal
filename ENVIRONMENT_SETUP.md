# Setting Up Environment Variables for Clarity Legal

This document explains how to set up the required environment variables for both local development and deployment on Vercel.

## Frontend Environment Variables

### For Local Development

1. Create a `.env.local` file in the project root with:
   ```
   VITE_API_BASE_URL=http://localhost:3001
   ```

### For Vercel Deployment

Add the following environment variables in your Vercel project settings:

1. `VITE_API_BASE_URL` - Your production API URL (e.g., `https://clarity-legal-api.vercel.app`)

## Backend Environment Variables

### For Local Development

1. Create a `.env` file in the `backend` directory with the following variables:

```
# Server Configuration
PORT=3001
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account-email

# Google AI Configuration
GOOGLE_AI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash

# Google Cloud Document AI
GOOGLE_CLOUD_PROJECT_ID=your-document-ai-project
DOCUMENT_AI_PROCESSOR_ID=your-processor-id
DOCUMENT_AI_LOCATION=us

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,txt

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
```

### For Vercel Deployment (Backend)

Add the same environment variables to your backend Vercel project settings.

## Firebase Configuration

1. Create a file named `firebaseConfig.js` in the `src` directory with your Firebase configuration:

```javascript
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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
```

## Important Security Notes

1. Never commit sensitive credentials to your repository
2. Always use environment variables for secrets
3. Add all files containing credentials to `.gitignore`
4. For Firebase service accounts, use environment variables or secrets management