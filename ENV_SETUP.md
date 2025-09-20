# Environment Variable Setup for Clarity Legal API

This document provides instructions for setting up environment variables for the Clarity Legal application to work seamlessly in both local development and production environments.

## Local Development

1. In the project root directory, create a `.env.local` file with the following content:

```
VITE_API_BASE_URL=http://localhost:3001
```

2. Start the development server:

```bash
npm run dev
```

## Production Deployment (Vercel)

1. In your Vercel project settings, go to the "Environment Variables" tab.

2. Add the following environment variable:
   - Name: `VITE_API_BASE_URL`
   - Value: Your production API URL (e.g., `https://we-are-clarity-legal.vercel.app`)

3. Ensure the `vercel.json` file exists in your project root with the following content to handle client-side routing and prevent 404 errors on page refresh:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

4. Save the changes and redeploy your application.

## How It Works

The application uses the `getApiUrl()` function from `src/utils/apiUtils.js` to construct API URLs based on the environment:

```javascript
export const getApiBaseUrl = () => {
  // Access the environment variable provided by Vite
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  
  // Remove any trailing slashes for consistency
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

export const getApiUrl = (path) => {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Always ensure path starts with /api/
  const apiPath = normalizedPath.startsWith('/api/') ? normalizedPath : `/api${normalizedPath}`;
  
  return `${baseUrl}${apiPath}`;
};
```

This ensures that API calls work correctly regardless of the environment.