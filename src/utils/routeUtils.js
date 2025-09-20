/**
 * Route Utility for Clarity Legal
 * 
 * This utility provides functions for working with routes consistently across the app,
 * ensuring they work correctly with the HashRouter setup.
 */

/**
 * Creates an absolute URL with proper hash routing for external navigation
 * (like window.open or direct href links)
 * 
 * @param {string} path - The route path (with or without leading slash)
 * @returns {string} The complete URL with proper hash routing
 */
export const getExternalUrl = (path) => {
  // Normalize the path to always have a leading slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Get the base URL of the app (without hash part)
  const baseUrl = window.location.origin;
  
  // Return the full URL in hash router format
  return `${baseUrl}/#${normalizedPath}`;
};

/**
 * Helper function to determine if we're in a HashRouter environment
 * (useful for debugging or conditional logic)
 * 
 * @returns {boolean} True if using HashRouter
 */
export const isUsingHashRouter = () => {
  // Our app is configured to use HashRouter, but this can help with future changes
  return true;
};

// Export all utilities
export default {
  getExternalUrl,
  isUsingHashRouter
};