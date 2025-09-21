import React, { useState, useEffect } from 'react';
import { testApiConnection, testDocumentUpload } from '../utils/apiDebugger';

const APIDebugger = () => {
  const [connectionStatus, setConnectionStatus] = useState({ testing: false, result: null });
  const [fileUploadStatus, setFileUploadStatus] = useState({ testing: false, result: null });
  const [selectedFile, setSelectedFile] = useState(null);
  
  useEffect(() => {
    // Test connection on component mount
    handleTestConnection();
  }, []);
  
  const handleTestConnection = async () => {
    setConnectionStatus({ testing: true, result: null });
    try {
      const result = await testApiConnection();
      setConnectionStatus({ testing: false, result });
      console.log('API Connection Test:', result);
    } catch (error) {
      setConnectionStatus({ 
        testing: false, 
        result: { 
          success: false, 
          error: error.message,
          details: 'Connection test threw an exception' 
        }
      });
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleTestFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }
    
    setFileUploadStatus({ testing: true, result: null });
    try {
      const result = await testDocumentUpload(selectedFile);
      setFileUploadStatus({ testing: false, result });
      console.log('File Upload Test:', result);
    } catch (error) {
      setFileUploadStatus({ 
        testing: false, 
        result: { 
          success: false, 
          error: error.message,
          details: 'File upload test threw an exception' 
        }
      });
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '16px',
      width: '350px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, color: '#00aaff' }}>🔧 API Connection Debugger</h3>
        <div style={{
          fontSize: '10px',
          background: '#333',
          color: '#aaa',
          padding: '2px 6px',
          borderRadius: '10px'
        }}>DEBUG TOOL</div>
      </div>
      
      {/* Connection Test */}
      <div style={{ marginBottom: '16px', background: '#222', borderRadius: '6px', padding: '12px' }}>
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#eee' }}>Backend Connection:</div>
          <button 
            onClick={handleTestConnection}
            disabled={connectionStatus.testing}
            style={{
              background: '#00aaff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: connectionStatus.testing ? 'wait' : 'pointer'
            }}
          >
            {connectionStatus.testing ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
        
        {connectionStatus.result && (
          <div style={{
            background: connectionStatus.result.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${connectionStatus.result.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '4px',
            padding: '8px',
            fontSize: '13px',
            overflow: 'auto',
            maxHeight: '120px',
            wordBreak: 'break-word'
          }}>
            <div style={{ 
              color: connectionStatus.result.success ? '#22c55e' : '#ef4444',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              {connectionStatus.result.success ? 'Connection Success' : 'Connection Failed'}
            </div>
            <div style={{ color: '#ddd', fontSize: '12px' }}>
              {connectionStatus.result.success ? (
                <>
                  API Base URL: {connectionStatus.result.baseUrl}<br />
                  Environment: {connectionStatus.result.data?.debug?.environment || 'Unknown'}
                </>
              ) : (
                <>
                  Error: {connectionStatus.result.error}<br />
                  URL: {connectionStatus.result.fullUrl || 'Unknown'}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* File Upload Test */}
      <div style={{ background: '#222', borderRadius: '6px', padding: '12px' }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#eee' }}>File Upload Test:</div>
        
        <div style={{ marginBottom: '12px' }}>
          <input 
            type="file" 
            onChange={handleFileChange} 
            style={{ 
              color: '#ddd',
              fontSize: '13px',
              width: '100%'
            }}
          />
        </div>
        
        <button 
          onClick={handleTestFileUpload}
          disabled={!selectedFile || fileUploadStatus.testing}
          style={{
            background: !selectedFile ? '#555' : '#00aaff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: !selectedFile ? 'not-allowed' : fileUploadStatus.testing ? 'wait' : 'pointer',
            width: '100%',
            marginBottom: '8px'
          }}
        >
          {fileUploadStatus.testing ? 'Testing Upload...' : 'Test File Upload'}
        </button>
        
        {fileUploadStatus.result && (
          <div style={{
            background: fileUploadStatus.result.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${fileUploadStatus.result.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '4px',
            padding: '8px',
            fontSize: '13px',
            overflow: 'auto',
            maxHeight: '120px',
            wordBreak: 'break-word'
          }}>
            <div style={{ 
              color: fileUploadStatus.result.success ? '#22c55e' : '#ef4444',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              {fileUploadStatus.result.success ? 'Upload Success' : 'Upload Failed'}
            </div>
            <div style={{ color: '#ddd', fontSize: '12px' }}>
              {fileUploadStatus.result.success ? (
                <>Success: File uploaded and processed</>
              ) : (
                <>
                  Error: {fileUploadStatus.result.error}<br />
                  {fileUploadStatus.result.status && `Status: ${fileUploadStatus.result.status}`}<br />
                  {fileUploadStatus.result.errorText && `Details: ${fileUploadStatus.result.errorText}`}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '12px', fontSize: '11px', color: '#888', textAlign: 'center' }}>
        API Debugger v1.0 - Open browser console for detailed logs
      </div>
    </div>
  );
};

export default APIDebugger;