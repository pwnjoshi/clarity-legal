// Debug file to log API connection issues
import { getApiBaseUrl, getApiUrl } from './apiUtils';

// Simple function to test the API connection
export const testApiConnection = async () => {
  const baseUrl = getApiBaseUrl();
  
  console.log('===== API CONNECTION DEBUGGER =====');
  console.log(`API Base URL: ${baseUrl}`);
  console.log(`Environment: ${import.meta.env.MODE}`);
  console.log(`VITE_API_BASE_URL: ${import.meta.env.VITE_API_BASE_URL}`);
  
  // Test simple fetch
  try {
    console.log(`Testing connection to ${baseUrl}/api/health...`);
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Connection successful!');
      console.log('Response:', data);
      return { success: true, data };
    } else {
      console.error(`❌ Response not OK: ${response.status} ${response.statusText}`);
      return { 
        success: false, 
        status: response.status, 
        statusText: response.statusText 
      };
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return { 
      success: false, 
      error: error.message,
      baseUrl,
      fullUrl: `${baseUrl}/api/health`
    };
  }
};

// Test specific to document upload
export const testDocumentUpload = async (file) => {
  if (!file) {
    console.error('No file provided for testing');
    return { success: false, error: 'No file provided' };
  }
  
  const baseUrl = getApiBaseUrl();
  console.log(`Testing document upload to ${baseUrl}/api/upload...`);
  
  try {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('docType', 'Test');
    
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Upload test successful!');
      console.log('Response:', data);
      return { success: true, data };
    } else {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = errorData.error || '';
      } catch (e) {}
      
      console.error(`❌ Upload failed: ${response.status} ${response.statusText} ${errorText}`);
      return { 
        success: false, 
        status: response.status, 
        statusText: response.statusText,
        errorText
      };
    }
  } catch (error) {
    console.error('❌ Upload test failed:', error.message);
    return { 
      success: false, 
      error: error.message,
      baseUrl,
      fullUrl: `${baseUrl}/api/upload`
    };
  }
};

export default {
  testApiConnection,
  testDocumentUpload
};