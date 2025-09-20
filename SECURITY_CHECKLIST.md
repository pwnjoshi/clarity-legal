# GitHub Security Checklist for Clarity Legal

This checklist ensures your repository is properly secured before pushing to GitHub, preventing sensitive credentials from being exposed.

## ✅ Environment Variables

### Frontend
- [x] Created `.env.local` with all required variables:
  - API Base URL
  - Firebase Configuration (apiKey, authDomain, projectId, etc.)
- [x] Created `.env.example` with placeholders (no real values)
- [x] Added `.env.local` to `.gitignore`

### Backend
- [x] Created `backend/.env` with all required variables:
  - Firebase credentials
  - Google AI API Key
  - Document AI configuration
  - Other service credentials
- [x] Created `backend/.env.example` with placeholders (no real values)
- [x] Added `backend/.env` to `.gitignore`

### Vercel Deployment
- [x] Created `vercel-frontend.env` for frontend deployment
- [x] Created `vercel-backend.env` for backend deployment
- [x] Added both Vercel env files to `.gitignore`

## ✅ Sensitive Files Secured

- [x] Updated `src/firebaseConfig.js` to use environment variables
- [x] Added `src/firebaseConfig.js` to `.gitignore` (original with hardcoded values)
- [x] Ensured Firebase service account files are in `.gitignore`
- [x] Checked for any API keys in code files
- [x] Verified `.gitignore` excludes all sensitive files

## ✅ Example Files Provided

- [x] Frontend environment example (`.env.example`)
- [x] Backend environment example (`backend/.env.example`)
- [x] Added documentation on environment setup

## ✅ Security Review

- [x] Removed hardcoded credentials from code files
- [x] Moved sensitive values to environment variables
- [x] Protected private keys and service account information
- [x] Updated documentation to reflect environment variable usage

## 📋 Next Steps Before Pushing to GitHub

1. Double-check that your `.gitignore` file is working:
   ```powershell
   git status
   ```
   (Confirm that `.env.local`, `backend/.env`, `vercel-*.env` files are NOT listed)

2. Make a test commit locally:
   ```powershell
   git add .
   git commit -m "Test commit - checking for sensitive data"
   ```

3. Review what would be pushed:
   ```powershell
   git diff --stat origin/main
   ```

4. If you find any sensitive data that would be committed:
   - Fix the issue by moving data to environment files
   - Update `.gitignore` if needed
   - Amend the commit: `git commit --amend`

5. When everything is secured, push to GitHub:
   ```powershell
   git push origin main
   ```

## 🔐 Vercel Deployment Instructions

1. **Frontend Deployment**:
   - Go to Vercel project settings
   - Use the "Import" button to upload `vercel-frontend.env`
   - This will set all required environment variables

2. **Backend Deployment**:
   - Create a separate Vercel project for the backend
   - Use the "Import" button to upload `vercel-backend.env`
   - Set the root directory to `backend`

---

Remember, NEVER commit sensitive credentials to GitHub. Always use environment variables and keep the actual values out of the repository.