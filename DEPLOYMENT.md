# Clarity Legal Deployment Configuration Guide

This guide provides detailed instructions for configuring your Clarity Legal application on Vercel.

## Frontend Deployment Setup (Vercel)

1. **Create a new Vercel Project**
   - Connect your GitHub repository
   - Select the frontend directory (root of the project)
   - Set build settings:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`

2. **Configure Environment Variables**
   - In your Vercel project settings, add:

   | Variable Name | Value | Description |
   |---------------|-------|-------------|
   | `VITE_API_BASE_URL` | Your backend URL (e.g., `https://clarity-legal-api.vercel.app`) | URL of your deployed backend API |
   
3. **Add Custom Domain (Optional)**
   - If using a custom domain, add it in the "Domains" section
   - Update the `VITE_API_BASE_URL` if using a custom domain for the backend

## Backend Deployment Setup (Vercel)

1. **Create a new Vercel Project**
   - Connect your GitHub repository
   - Select the backend directory (`backend` folder)
   - Set build settings:
     - Framework Preset: Other
     - Build Command: `npm install`
     - Output Directory: `.` (root)
     - Install Command: `npm install`

2. **Configure Environment Variables**
   - In your Vercel project settings, add:

   | Variable Name | Value | Description |
   |---------------|-------|-------------|
   | `FRONTEND_URL` | Your frontend URL (e.g., `https://clarity-legal.vercel.app`) | Frontend URL for CORS |
   | `FIREBASE_PROJECT_ID` | Your Firebase project ID | From Firebase console |
   | `FIREBASE_PRIVATE_KEY` | Your Firebase private key (with quotes) | From Firebase service account |
   | `FIREBASE_CLIENT_EMAIL` | Your Firebase client email | From Firebase service account |
   | `GOOGLE_AI_API_KEY` | Your Google AI API key | For Gemini AI integration |
   | `GEMINI_MODEL` | `gemini-1.5-flash` | Model name for Gemini |

   > **Important:** For `FIREBASE_PRIVATE_KEY`, make sure to:
   > 1. Include the entire key with newlines as `\n`
   > 2. Include the surrounding quotes (e.g., `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`)

3. **Configure Vercel Settings**
   - Set the Node.js version to 18.x or higher
   - In "Settings" > "General" > "Build & Development Settings":
     - Set output directory to `.`

## Firebase Configuration

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one

2. **Set up Firebase Authentication**
   - Enable Email/Password authentication
   - Add any test users as needed

3. **Configure Firestore Database**
   - Create a Firestore database
   - Set up security rules:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read/write for all documents (modify for production)
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

4. **Configure Firebase Storage**
   - Create a Firebase Storage bucket
   - Set up CORS configuration:
     - Go to Firebase Console > Storage > Rules
     - Add your frontend domain to the CORS configuration
   - Set up security rules:

   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if true;
       }
     }
   }
   ```

5. **Create Firebase Service Account**
   - Go to Project Settings > Service Accounts
   - Generate new private key (JSON)
   - Extract these values for Vercel environment variables:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_PRIVATE_KEY`
     - `FIREBASE_CLIENT_EMAIL`

## Google AI API Setup

1. **Enable Google AI API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Gemini API
   - Create API key
   - Copy to `GOOGLE_AI_API_KEY` environment variable

2. **Set up Document AI (Optional)**
   - Enable Document AI API
   - Create a processor for text extraction
   - Note the processor ID for `DOCUMENT_AI_PROCESSOR_ID`

## Troubleshooting Common Issues

### "Failed to fetch" Errors

1. **Check CORS Configuration**
   - Ensure `FRONTEND_URL` matches exactly the URL users use to access frontend
   - Frontend domain must match the request origin exactly (including `https://` and any trailing slashes)

2. **Test Backend Health**
   - Try accessing `<backend-url>/api/health` directly in browser
   - Should return a JSON with service status information

3. **Network Request Issues**
   - In browser console, check Network tab for details of failed requests
   - Look for CORS errors or status codes like 401, 403, 404, or 500

### Firebase Connection Issues

1. **Private Key Format**
   - Ensure `FIREBASE_PRIVATE_KEY` includes all newlines as `\n`
   - Include the surrounding quotes from the JSON file

2. **Project ID**
   - Verify the `FIREBASE_PROJECT_ID` matches your Firebase project exactly

3. **Storage Rules**
   - Check Firebase Storage rules allow your operations

### Document Processing Issues

1. **File Format Support**
   - Ensure uploaded files are in supported formats (PDF, DOCX, TXT)
   - For PDFs, ensure they contain selectable text (not scanned images)

2. **API Keys**
   - Verify Google AI API key is correct and has proper permissions
   - If API key is missing, fallback processing will be used

## Deployment Checklist

Before finalizing your deployment, verify:

- [ ] Frontend can connect to backend (`/api/health` works)
- [ ] Document uploads work
- [ ] Firebase storage is accessible
- [ ] AI analysis functions correctly
- [ ] Document comparison works
- [ ] CORS is properly configured
- [ ] All environment variables are set correctly

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Google AI Gemini API Documentation](https://ai.google.dev/)