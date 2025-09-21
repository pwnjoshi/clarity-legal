# Firebase Configuration Guide for Render Deployment

This guide will help you properly configure Firebase credentials in your Render environment to enable cloud storage functionality in your Clarity Legal application.

## Required Environment Variables

You need to set the following Firebase environment variables in your Render dashboard:

1. **`FIREBASE_PROJECT_ID`** - Your Firebase project ID
2. **`FIREBASE_PRIVATE_KEY`** - Your Firebase private key (must include BEGIN/END markers and newlines)
3. **`FIREBASE_CLIENT_EMAIL`** - Your Firebase client email

## How to Set Up Firebase Credentials Correctly

### Step 1: Get Your Firebase Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon (⚙️) next to "Project Overview" to access Project Settings
4. Go to the "Service accounts" tab
5. Click "Generate new private key" 
6. Save the JSON file securely

### Step 2: Format the Private Key Correctly for Render

The most common issue with Firebase initialization on Render is improper formatting of the private key. The key must be provided as a single line with `\n` characters to represent newlines.

1. Open the downloaded JSON file
2. Copy the `private_key` value (including the `"-----BEGIN PRIVATE KEY-----"` and `"-----END PRIVATE KEY-----"` markers)
3. When adding to Render, keep the quotes and make sure it's all on one line with `\n` representing line breaks

For example, your private key should be formatted like this:
```
"-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC1t8esXrLntBUX\n1WPzBiVvdEJi...(rest of the key)...1mkF8Oo=\n-----END PRIVATE KEY-----\n"
```

### Step 3: Configure Environment Variables in Render

1. Go to your Render dashboard
2. Select your Clarity Legal backend service
3. Click on "Environment"
4. Add the following environment variables:

   - `FIREBASE_PROJECT_ID`: Your Firebase project ID from the JSON file
   - `FIREBASE_CLIENT_EMAIL`: The client_email value from the JSON file 
   - `FIREBASE_PRIVATE_KEY`: The entire private_key string including quotes and \n characters

5. Click "Save Changes"

### Step 4: Verify Configuration

After updating the environment variables and allowing your service to redeploy, verify the configuration:

1. Visit your backend's health endpoint: `https://clarity-legal.onrender.com/api/health`
2. Check if the `services.firebase` property is `true`
3. If it's `false`, check the Render logs for more details on what might be wrong

## Troubleshooting

If Firebase initialization fails, check these common issues:

1. **Private Key Format**: Make sure the private key includes the BEGIN/END markers and all newline characters are represented as `\n`
2. **Quote Escaping**: If you're using double quotes around your private key, Render might need you to escape internal quotes
3. **Check Render Logs**: Detailed error messages about Firebase initialization will appear in your Render logs
4. **Project ID**: Ensure the project ID matches exactly what's in your Firebase console

## Testing Firebase Connection

Once you've set up your environment variables, you can test the Firebase connection:

1. Upload a new document from your frontend
2. Check the Render logs for successful Firebase initialization messages
3. Try reanalyzing or deleting documents - these operations should now work properly

If you continue to encounter issues, the app will operate in "local mode" which stores documents temporarily in memory and local files.