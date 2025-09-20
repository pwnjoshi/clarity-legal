# Local Development Troubleshooting Guide for Clarity Legal

This guide specifically addresses common issues when running Clarity Legal in a local development environment and provides step-by-step solutions.

## Initial Setup Verification

Before troubleshooting specific issues, verify your basic setup:

### 1. Required Files Check

- **Frontend Environment**:
  ```powershell
  # Check if frontend environment file exists
  Test-Path .\.env.local
  
  # If it doesn't exist, create it
  if (-not (Test-Path .\.env.local)) {
    Set-Content -Path .\.env.local -Value "VITE_API_BASE_URL=http://localhost:3001"
    Write-Host ".env.local created successfully"
  }
  ```

- **Backend Environment**:
  ```powershell
  # Check if backend environment file exists
  Test-Path .\backend\.env
  
  # If it doesn't exist, create a basic one
  if (-not (Test-Path .\backend\.env)) {
    Set-Content -Path .\backend\.env -Value @"
PORT=3001
FRONTEND_URL=http://localhost:5173
"@
    Write-Host ".env created successfully in backend folder"
  }
  ```

### 2. Directory Structure Check

```powershell
# Check if uploads directory exists
if (-not (Test-Path .\backend\uploads)) {
  New-Item -Path .\backend\uploads -ItemType Directory
  Write-Host "Created uploads directory"
}

# Check if uploads/comparisons directory exists
if (-not (Test-Path .\backend\uploads\comparisons)) {
  New-Item -Path .\backend\uploads\comparisons -ItemType Directory
  Write-Host "Created uploads/comparisons directory"
}
```

## Common Issues and Solutions

### 1. "Failed to fetch" Errors

**Problem**: API calls from the frontend to the backend are failing with "Failed to fetch" errors.

**Step-by-Step Diagnosis and Solution**:

1. **Verify Backend is Running**:
   ```powershell
   # From the backend directory
   cd backend
   npm start
   ```
   ✅ **Success Check**: You should see "🚀 Clarity Legal Backend running on port 3001" in the console.

2. **Check Environment Variables**:
   - Frontend (`.env.local` in root directory):
     ```powershell
     # View the content of .env.local
     Get-Content .\.env.local
     ```
     ✅ **Expected**: Should contain `VITE_API_BASE_URL=http://localhost:3001`
     
   - Backend (`.env` in backend directory):
     ```powershell
     # View the content of backend/.env
     Get-Content .\backend\.env
     ```
     ✅ **Expected**: Should contain `FRONTEND_URL=http://localhost:5173` and `PORT=3001`

3. **Test Backend Health Directly**:
   Open `http://localhost:3001/api/health` in your browser or run:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3001/api/health" | ConvertTo-Json
   ```
   ✅ **Success Check**: You should see a JSON response with `"status": "healthy"` and service information.

4. **Diagnose CORS Issues**:
   - Open browser developer tools (F12)
   - Go to Network tab and make any request to the API
   - If you see errors like "Access-Control-Allow-Origin", it's a CORS issue
   
   **Solution**:
   Temporarily modify `backend/server.js`:
   ```javascript
   // Find this code
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:5173',
     credentials: true
   }));
   
   // Temporarily change to this for debugging
   app.use(cors({
     origin: '*', // WARNING: For local debugging only
     credentials: true
   }));
   ```
   
   ⚠️ **Important**: Remember to revert this change before deployment. Using `origin: '*'` is a security risk in production.

### 2. 404 Errors on Route Refresh

**Problem**: You see a 404 error when refreshing pages like `/dashboard` directly.

**Solution**:
This issue has been fixed with recent changes to `vite.config.js` and `vercel.json`.

If you're still experiencing this issue:
1. Ensure you have the latest `vite.config.js`:
   ```javascript
   server: {
     historyApiFallback: true,
   }
   ```

2. Verify `vercel.json` contains:
   ```json
   {
     "routes": [
       { "handle": "filesystem" },
       { "src": "/.*", "dest": "/index.html" }
     ]
   }
   ```

3. Restart both the frontend and backend development servers.

### 3. Document Upload and Processing Issues

**Problem**: Document uploads fail or documents don't process correctly.

**Step-by-Step Diagnosis and Solution**:

1. **Check Uploads Directory Structure**:
   ```powershell
   # From backend directory
   cd backend
   
   # Create uploads directory if it doesn't exist
   if (-not (Test-Path .\uploads)) {
     New-Item -Path .\uploads -ItemType Directory
     Write-Host "Created uploads directory"
   }
   
   # Create comparisons subdirectory
   if (-not (Test-Path .\uploads\comparisons)) {
     New-Item -Path .\uploads\comparisons -ItemType Directory
     Write-Host "Created uploads/comparisons directory"
   }
   
   # Check permissions (should show directory is writable)
   $acl = Get-Acl .\uploads
   Write-Host "Uploads directory permissions:"
   $acl.Access | Format-Table IdentityReference, FileSystemRights
   ```

2. **Test Simple Document Upload**:
   - Create a simple test file:
     ```powershell
     Set-Content -Path .\test-upload.txt -Value "This is a test document for upload."
     ```
   - Upload this file through the UI
   - Watch backend console for processing logs

3. **Backend Console Logs Analysis**:
   Common error patterns to look for:
   - `Error: ENOENT: no such file or directory`: Directory structure issue
   - `Error: EPERM: operation not permitted`: Permissions issue
   - `Failed to extract text from document`: Document processing issue
   - `Firebase initialization failed`: Firebase connection issue

4. **Verify Firebase Environment Variables**:
   ```powershell
   # Check if Firebase variables are set in .env
   $envFile = Get-Content .\backend\.env
   $firebaseVars = @(
     'FIREBASE_PROJECT_ID',
     'FIREBASE_PRIVATE_KEY',
     'FIREBASE_CLIENT_EMAIL'
   )
   
   foreach ($var in $firebaseVars) {
     if ($envFile -match $var) {
       Write-Host "$var: ✅ Set"
     } else {
       Write-Host "$var: ❌ Missing"
     }
   }
   ```
   
   If any variables are missing, add them to your `backend/.env` file:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   ```
   
   ⚠️ **Important**: Make sure the `FIREBASE_PRIVATE_KEY` includes all line breaks as `\n` and is surrounded by quotes.

### 4. API Response Format Errors

**Problem**: Backend API returns data but frontend can't process it correctly.

**Solution**:
1. Check browser console for specific errors about unexpected properties
2. Compare the response format with what frontend components expect
3. Use browser developer tools to inspect network responses

### 5. Port Conflicts

**Problem**: "Port already in use" errors when starting servers.

**Step-by-Step Diagnosis and Solution**:

1. **Check Which Process is Using the Port**:
   ```powershell
   # Find process using port 3001 (backend)
   netstat -ano | findstr :3001
   
   # Find process using port 5173 (frontend)
   netstat -ano | findstr :5173
   ```
   
   The output will look like: `TCP    127.0.0.1:3001    0.0.0.0:0    LISTENING    1234`
   The last number (1234) is the Process ID (PID).

2. **Identify the Process Name**:
   ```powershell
   # Replace 1234 with the PID you found
   Get-Process -Id 1234
   ```

3. **Kill the Process**:
   ```powershell
   # Replace 1234 with the PID you found
   taskkill /PID 1234 /F
   ```

4. **Alternative: Change the Port**:
   - For backend: Edit `backend/.env` and change `PORT=3001` to another port
   - For frontend: Update `vite.config.js` to use a different port:
     ```javascript
     server: {
       historyApiFallback: true,
       port: 5174 // Change to an available port
     }
     ```
   - Remember to also update `FRONTEND_URL` in `backend/.env` and `VITE_API_BASE_URL` in `.env.local`

## Comprehensive Debugging Guide

### 1. Systematic API Connectivity Testing

1. **Test Backend Service Directly**:
   ```powershell
   # Using PowerShell
   Invoke-RestMethod -Uri "http://localhost:3001/api/health" | ConvertTo-Json -Depth 4
   ```
   
   ✅ **Success**: You should get a JSON response with health status and service information.
   
   ❌ **Failure**: "Unable to connect to the remote server" means backend is not running or port is wrong.

2. **Test from Browser Console**:
   ```javascript
   // Basic health check
   fetch('http://localhost:3001/api/health')
     .then(r => r.json())
     .then(console.log)
     .catch(error => {
       console.error('API Error:', error);
       console.log('This might be a CORS issue if the error mentions "blocked by CORS policy"');
     })
   ```

3. **Run the Health Check Utility**:
   ```powershell
   # From project root
   node src/utils/healthCheck.js
   ```
   This will test all connections and provide a detailed report.

### 2. Browser Developer Tools Investigation

1. **Network Tab Analysis**:
   - Open Chrome DevTools (F12) → Network tab
   - Filter by "Fetch/XHR" to see API calls
   - Look for:
     - Red failed requests
     - Status codes (4xx/5xx indicate errors)
     - Request/response headers (check for CORS headers)

2. **Console Error Pattern Recognition**:
   - CORS errors: `Access to fetch at 'http://localhost:3001/api/health' from origin 'http://localhost:5173' has been blocked by CORS policy`
   - Network errors: `Failed to fetch` or `NetworkError when attempting to fetch resource`
   - Firebase errors: `FirebaseError: ...`

3. **Storage Inspection**:
   - Check if local storage has any tokens or state that might be invalid

### 3. Environment Variable Verification Tool

Run this in your browser console to verify frontend environment variables:

```javascript
// Environment variable checker
(() => {
  const envVars = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
  };
  
  console.log('Environment Variables:', envVars);
  
  // Validation
  const issues = [];
  if (!envVars.apiBaseUrl) issues.push('VITE_API_BASE_URL is not set');
  if (envVars.apiBaseUrl && !envVars.apiBaseUrl.startsWith('http')) issues.push('VITE_API_BASE_URL does not start with http');
  
  if (issues.length === 0) {
    console.log('✅ Environment variables look good');
  } else {
    console.error('❌ Environment variable issues detected:', issues);
  }
  
  return envVars;
})();
```

## Quick Reference

### Start the Application
```powershell
# Terminal 1: Backend
cd backend
npm install
npm start

# Terminal 2: Frontend
# From project root
npm install
npm run dev
```

### Test Endpoints
- Frontend: http://localhost:5173
- Backend Health: http://localhost:3001/api/health
- Backend API: http://localhost:3001/api/documents