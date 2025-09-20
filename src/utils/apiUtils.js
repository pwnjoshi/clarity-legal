/**
 * API URL Utility for Clarity Legal
 * 
 * This utility provides functions for working with API endpoints across different environments.
 * 
 * Environment Variable Setup:
 * 1. Local Development:
 *    - Create a .env.local file in the project root
 *    - Add: VITE_API_BASE_URL=http://localhost:3001
 * 
 * 2. Vercel Production:
 *    - In your Vercel project settings, add an environment variable:
 *    - Name: VITE_API_BASE_URL
 *    - Value: Your production API URL (e.g., https://we-are-clarity-legal.vercel.app)
 *    
 * Note: Vite environment variables must be prefixed with VITE_ to be exposed to the client.
 * 
 * If no environment variable is set, the app will fall back to a localhost URL.
 */

/**
 * Get the base API URL from environment variables or fall back to localhost
 * @returns {string} The base API URL
 */
export const getApiBaseUrl = () => {
  // Access the environment variable provided by Vite
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  
  // Remove any trailing slashes for consistency
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

/**
 * Builds a full API URL by appending the path to the base URL
 * @param {string} path - API endpoint path (with or without leading slash)
 * @returns {string} The complete API URL
 */
export const getApiUrl = (path) => {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Always ensure path starts with /api/
  const apiPath = normalizedPath.startsWith('/api/') ? normalizedPath : `/api${normalizedPath}`;
  
  return `${baseUrl}${apiPath}`;
};

/**
 * Helper function to handle API errors in a consistent way
 * @param {Error} error - The error object
 * @param {string} fallbackMessage - Fallback message if no error message exists
 * @returns {void} - Logs error and shows user alert
 */
export const handleApiError = (error, fallbackMessage = 'An error occurred while connecting to the server.') => {
  // Log detailed error for debugging
  console.error('API Error:', error);
  
  // Show user-friendly message
  const userMessage = error.message || fallbackMessage;
  alert(userMessage);
  
  return { error: true, message: userMessage };
};

// Export all utilities
export default {
  getApiBaseUrl,
  getApiUrl,
  handleApiError
};