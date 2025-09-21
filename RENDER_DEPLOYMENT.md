# Deploying Clarity Legal on Render

This document provides instructions for deploying the Clarity Legal application on the Render platform.

## Backend Deployment (Node.js Express Server)

1. **Log in to Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Sign in to your account or create one

2. **Create a New Web Service**
   - Click "New" and select "Web Service"
   - Connect to your GitHub repository
   - Search for and select your repository

3. **Configure the Web Service**
   - **Name**: `clarity-legal-backend` (or your preferred name)
   - **Root Directory**: `backend` (critical: specify this subfolder)
   - **Environment**: `Node`
   - **Region**: Choose the region closest to your users
   - **Branch**: `main` (or your deployment branch)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Choose Free or Paid based on your needs

4. **Environment Variables**
   Add all required environment variables from your `.env.example` file:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render uses this port internally)
   - `FIREBASE_PROJECT_ID`: Your Firebase Project ID
   - `FIREBASE_PRIVATE_KEY`: Your Firebase Private Key (be sure to include the full key including newlines)
   - `FIREBASE_CLIENT_EMAIL`: Your Firebase Client Email
   - And all other variables from your `.env` file

5. **Create Web Service**
   - Click "Create Web Service"
   - Wait for the deployment to complete
   
6. **Verify Deployment**
   - Once deployed, visit `https://your-service-name.onrender.com/api/health` 
   - You should see a JSON response with status information

## Frontend Deployment (React)

For the frontend, you should deploy to Vercel for best performance:

1. **Connect your repository to Vercel**
   - Vercel will auto-detect that it's a Vite React app

2. **Set Environment Variables in Vercel**
   - `VITE_API_BASE_URL`: Your Render backend URL (e.g., `https://clarity-legal-backend.onrender.com`)

3. **Deploy**
   - Let Vercel handle the build and deployment
   - It will use the `.env.production` file for environment variables

## Common Issues

1. **CORS Errors**
   - If you encounter CORS issues, check that your backend's `FRONTEND_URL` environment variable is set to your Vercel frontend URL

2. **Missing Environment Variables**
   - Double-check all required environment variables are set in Render
   - Firebase credentials must be properly formatted with escaped newlines

3. **File Upload Issues**
   - Render's ephemeral filesystem means uploaded files may disappear
   - Ensure your app is using Firebase Storage for persistent file storage

## Monitoring and Logs

- Use Render's logging interface to troubleshoot backend issues
- Set up proper error handling and logging in your application code

## Support

If you encounter issues with the deployment, check:
1. Render logs for backend errors
2. Vercel build logs for frontend issues
3. Browser console for client-side errors