# Troubleshooting Checklist for Clarity Legal

This document outlines key steps to troubleshoot the "Failed to fetch" errors and document processing issues in both local development and Vercel deployment.

## Local Development Environment Setup

### Frontend Environment Variables
- Create a `.env.local` file in the project root:
```
VITE_API_BASE_URL=http://localhost:3001
```

### Backend Environment Variables
- Create a `.env` file in the backend directory:
```
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### Local Development Workflow
1. Start the backend server:
```
cd backend
npm install
npm start
```

2. In a separate terminal, start the frontend:
```
npm install
npm run dev
```

## Vercel Deployment Environment Variables

### Frontend Environment Variables
Ensure these are set in your Vercel frontend project:

- `VITE_API_BASE_URL`: Should point to your backend URL (e.g., `https://clarity-legal-api.vercel.app`)
  - Check: This must match EXACTLY where your backend is deployed

## Backend Environment Variables

Ensure these are set in your Vercel backend project:

- `FRONTEND_URL`: Should point to your frontend URL (e.g., `https://clarity-legal.vercel.app`)
  - Check: This is critical for CORS - must match your actual frontend URL exactly

- Firebase credentials (required for document storage and retrieval):
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_PRIVATE_KEY` (Make sure line breaks are preserved as `\n`)
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_STORAGE_BUCKET` (should be `${FIREBASE_PROJECT_ID}.appspot.com`)

- Google AI credentials (for document processing):
  - `GOOGLE_AI_API_KEY` (for Gemini)
  - `GEMINI_MODEL` (should be `gemini-1.5-flash`)
  - `DOCUMENT_AI_PROCESSOR_ID` (if using Document AI)
  - `GOOGLE_CLOUD_PROJECT_ID` (same as your Firebase project ID)

## CORS Issues

The backend server is configured to only accept requests from the specified `FRONTEND_URL`:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

If this doesn't match your actual frontend URL, requests will fail with CORS errors.

## API Base URL Mismatch

Your frontend makes API calls using the `getApiUrl()` function, which depends on `VITE_API_BASE_URL`:

```javascript
export const getApiBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};
```

If this is not set correctly in Vercel, API calls will fail.

## Common Local Development Issues

1. **Backend Not Starting**
   - Check for error messages in the terminal when starting the backend
   - Ensure Node.js v16+ is installed: `node --version`
   - Check if port 3001 is already in use: `netstat -ano | findstr :3001`
   - Verify all dependencies are installed: `npm install` in the backend directory

2. **Route Refresh 404 Errors**
   - This happens when refreshing a non-root route like `/dashboard` directly
   - To fix, create a `vercel.json` in the project root:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/" }
     ]
   }
   ```
   - For local development, update `vite.config.js`:
   ```javascript
   server: {
     historyApiFallback: true,
   }
   ```

3. **CORS Errors in Local Development**
   - Verify backend `.env` has `FRONTEND_URL=http://localhost:5173`
   - Confirm the Vite dev server runs on port 5173 (default)
   - If using a different port, update FRONTEND_URL accordingly
   - Try disabling CORS temporarily for testing:
   ```javascript
   // In server.js, temporarily change to:
   app.use(cors({
     origin: '*', // WARNING: Use only for debugging
     credentials: true
   }));
   ```

4. **Document Upload Errors**
   - Check if the `uploads` directory exists in the backend folder
   - Ensure the directory has write permissions
   - Verify file size limits (default: 10MB)
   - Check allowed file formats (PDF, DOCX, TXT)

## Debugging Steps

1. **Check Network Requests in Browser DevTools**
   - Open Chrome DevTools (F12)
   - Go to Network tab
   - Look for failed requests with status 4xx or CORS errors
   - The error details will help pinpoint the issue

2. **Test Health Endpoint**
   - Local: `http://localhost:3001/api/health`
   - Vercel: `https://clarity-legal-api.vercel.app/api/health`
   - This should return service status information

3. **Verify Environment Variables**
   - For local: Check `.env` and `.env.local` files
   - For Vercel: Check all environment variables in both frontend and backend projects
   - Ensure they match the URLs actually used in deployment

4. **Firebase Storage Permissions**
   - Ensure your Firebase Storage rules allow the operations
   - Default rules often block production access

## Common Problems & Solutions

1. **"Failed to fetch" errors:**
   - CORS misconfiguration: Fix FRONTEND_URL to match exact frontend URL
   - Backend not running: Check if backend service is actually running
   - Network issues: Check if the backend URL is accessible

2. **Document processing issues:**
   - Missing API keys: Ensure all Google AI and Firebase keys are properly set
   - Permission issues: Check Firebase rules and IAM permissions
   - Document format issues: Ensure uploaded documents are in supported formats

3. **Document storage/retrieval issues:**
   - Firebase credential issues: Verify all Firebase environment variables
   - Storage path errors: Check that storage paths match in upload/download code
   - CORS issues: Add your domains to Firebase Storage CORS configuration

## Next Steps

1. Update all environment variables in Vercel
2. Verify backend service is running correctly
3. Test the `/api/health` endpoint directly
4. Monitor network requests during document upload