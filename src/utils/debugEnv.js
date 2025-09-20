// src/utils/debugEnv.js

// This function can be called in the browser console to debug environment variables
export function debugEnvVars() {
  console.log('Environment Variables Status:');
  
  const envVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID',
    'VITE_API_BASE_URL'
  ];
  
  const results = {};
  
  for (const key of envVars) {
    const value = import.meta.env[key];
    results[key] = {
      defined: value !== undefined,
      isEmpty: value === '',
      value: value ? `${value.substring(0, 3)}...` : '(not set)'
    };
  }
  
  console.table(results);
  console.log('To resolve environment variable issues, make sure they are correctly set in Vercel Project Settings.');
}

// Add this function to the window object so it can be called from the console
if (typeof window !== 'undefined') {
  window.debugEnvVars = debugEnvVars;
}