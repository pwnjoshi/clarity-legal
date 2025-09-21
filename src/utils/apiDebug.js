// src/utils/apiDebug.js

/**
 * API Debug Utility for diagnosing "Failed to fetch" errors
 * This file provides functions that can be called from the browser console
 * to help diagnose API connectivity issues
 */

import { getApiBaseUrl, getApiUrl } from './apiUtils';

/**
 * Tests API connectivity to help diagnose "Failed to fetch" errors
 * @returns {Promise<Object>} Test results
 */
export async function testApiConnectivity() {
  console.log('🔍 Testing API connectivity...');
  console.log(`Current API Base URL: ${getApiBaseUrl()}`);

  const results = {
    apiBaseUrl: getApiBaseUrl(),
    corsEnabled: null,
    healthEndpoint: null,
    networkReachable: null,
    error: null
  };

  try {
    // Test if network is generally reachable
    try {
      await fetch('https://www.google.com');
      results.networkReachable = true;
      console.log('✅ Network is reachable');
    } catch (error) {
      results.networkReachable = false;
      console.log('❌ Network may be down:', error.message);
    }

    // Test API health endpoint
    const healthUrl = getApiUrl('/health');
    console.log(`🔍 Testing API health endpoint: ${healthUrl}`);
    
    try {
      const response = await fetch(healthUrl);
      results.healthEndpoint = response.ok;
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API health endpoint is working:', data);
        results.healthData = data;
      } else {
        console.log(`❌ API health endpoint returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      results.healthEndpoint = false;
      results.error = error.message;
      console.log('❌ Failed to connect to API health endpoint:', error.message);
    }

    console.log('📊 API Connectivity Test Results:', results);
    
    if (!results.healthEndpoint) {
      console.log('🔧 Troubleshooting suggestions:');
      console.log('1. Check if your backend API is running and accessible');
      console.log('2. Verify CORS is properly configured on the backend');
      console.log('3. Check for any network restrictions or firewalls');
      console.log('4. Verify the VITE_API_BASE_URL environment variable is set correctly');
      
      if (getApiBaseUrl().includes('localhost')) {
        console.log('⚠️ You are using a localhost API URL which will not work in production!');
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ API connectivity test failed:', error);
    results.error = error.message;
    return results;
  }
}

/**
 * Makes a test request to the API with detailed logging
 * @param {string} endpoint - API endpoint to test
 * @returns {Promise<Object>} Response data or error
 */
export async function testApiEndpoint(endpoint = '/health') {
  const url = getApiUrl(endpoint);
  console.log(`🔍 Testing API endpoint: ${url}`);
  
  try {
    const startTime = performance.now();
    const response = await fetch(url);
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    console.log(`⏱️ Response time: ${responseTime}ms`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint test successful:', data);
      return { success: true, data, responseTime };
    } else {
      console.log(`❌ Endpoint returned ${response.status}: ${response.statusText}`);
      return { 
        success: false, 
        status: response.status, 
        statusText: response.statusText,
        responseTime
      };
    }
  } catch (error) {
    console.error('❌ Endpoint test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Make these functions available in the browser console
if (typeof window !== 'undefined') {
  window.testApiConnectivity = testApiConnectivity;
  window.testApiEndpoint = testApiEndpoint;
  window.getApiBaseUrl = getApiBaseUrl;
  window.getApiUrl = getApiUrl;
}