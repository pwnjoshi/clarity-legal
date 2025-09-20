// Import the API URL utilities
import { getApiUrl, handleApiError } from '../utils/apiUtils';

// API Service for Clarity Legal Frontend
class ApiService {
  constructor() {
    // We no longer store baseURL directly, as we'll use the getApiUrl helper
    this.timeout = 30000; // 30 seconds timeout
  }

  // Generic request handler
  async request(endpoint, options = {}) {
    // Use the helper to get the full URL (ensures consistency across environments)
    const url = getApiUrl(endpoint);
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: this.timeout,
    };

    // Merge options
    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ API Response received');
      return data;

    } catch (error) {
      console.error('❌ API Request failed:', error);
      // Rethrow with improved error message for better debugging
      throw new Error(error.message || 'Network request failed');
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.request('/health');
      return response;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      throw error;
    }
  }

  // Upload document (Phase 2)
  async uploadDocument(file, documentType = 'Other') {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('docType', documentType);

      console.log(`📤 Uploading document: ${file.name} (${file.size} bytes)`);

      const response = await fetch(getApiUrl('/upload'), {
        method: 'POST',
        body: formData, // Don't set Content-Type, let browser set it for multipart/form-data
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      console.log('✅ Document upload successful');
      return data;

    } catch (error) {
      console.error('❌ Document upload failed:', error);
      throw error;
    }
  }

  // Process document with full pipeline (Phase 3)
  async processDocument(file, documentType = 'Other') {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('docType', documentType);

      console.log(`🔄 Processing document: ${file.name} with full pipeline`);

      const response = await fetch(getApiUrl('/process-document'), {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Document processing failed');
      }

      console.log('✅ Document processing successful');
      return data;

    } catch (error) {
      console.error('❌ Document processing failed:', error);
      throw error;
    }
  }

  // Get all documents
  async getDocuments() {
    try {
      const response = await this.request('/documents');
      return response;
    } catch (error) {
      console.error('❌ Failed to get documents:', error);
      throw error;
    }
  }

  // Delete document
  async deleteDocument(documentId) {
    try {
      console.log(`🗑️ Deleting document: ${documentId}`);
      
      const response = await this.request(`/documents/${documentId}`, {
        method: 'DELETE'
      });
      
      console.log('✅ Document deleted successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
      throw error;
    }
  }

  // Download document
  async downloadDocument(documentId) {
    try {
      console.log(`☁️ Getting download URL for document: ${documentId}`);
      
      const response = await this.request(`/documents/${documentId}/download`);
      
      if (response.success && response.downloadURL) {
        console.log('✅ Download URL obtained');
        return response.downloadURL;
      } else {
        throw new Error(response.error || 'Failed to get download URL');
      }
    } catch (error) {
      console.error('❌ Failed to get download URL:', error);
      throw error;
    }
  }

  // Test all services
  async testAllServices() {
    const results = {
      backend: false,
      firebase: false,
      gemini: false,
      documentAI: false
    };

    try {
      const health = await this.healthCheck();
      results.backend = true;
      results.firebase = health.services?.firebase || false;
      results.gemini = health.services?.gemini || false;
      results.documentAI = health.services?.documentAI || false;
      
      return {
        success: true,
        results,
        message: 'Service tests completed',
        details: health
      };

    } catch (error) {
      return {
        success: false,
        results,
        message: 'Backend connection failed',
        error: error.message
      };
    }
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validate file before upload
  validateFile(file, maxSize = 10 * 1024 * 1024) {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!file) {
      throw new Error('No file selected');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type not supported. Allowed types: PDF, TXT, DOC, DOCX`);
    }

    if (file.size > maxSize) {
      throw new Error(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`);
    }

    if (file.size === 0) {
      throw new Error('File is empty');
    }

    return true;
  }
}

// Create singleton instance
const apiService = new ApiService();

// Export default service
export default apiService;

// Export specific methods for convenience
export const {
  healthCheck,
  uploadDocument,
  processDocument,
  getDocuments,
  deleteDocument,
  downloadDocument,
  testAllServices,
  validateFile,
  formatFileSize
} = apiService;
