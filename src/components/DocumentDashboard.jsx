import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { getApiUrl, handleApiError } from '../utils/apiUtils';
import './DocumentDashboard.css';

export default function DocumentDashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [libraryMenuOpen, setLibraryMenuOpen] = useState(false);
  const libraryMenuRef = useRef(null);

  // Fetch documents from backend API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      console.log('Fetching documents from backend...');
      
      const response = await apiService.getDocuments();
      
      if (response.success) {
        console.log(`Fetched ${response.documents.length} documents`);
        setDocuments(response.documents || []);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error.message);
      
      // Try Firebase fallback
      try {
        const documentsRef = collection(db, 'documents');
        const q = query(documentsRef, orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, 
          (querySnapshot) => {
            const docs = [];
            querySnapshot.forEach((doc) => {
              docs.push({
                id: doc.id,
                ...doc.data()
              });
            });
            setDocuments(docs);
            console.log(`Fallback: Fetched ${docs.length} documents from Firebase`);
          },
          (firebaseError) => {
            console.error('Firebase fallback failed:', firebaseError);
            // Use empty array if both backend and Firebase fail
            setDocuments([]);
          }
        );
        
        return () => unsubscribe();
      } catch (firebaseError) {
        console.error('Firebase fallback failed:', firebaseError);
        setDocuments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    
    // Set up polling to refresh documents every 30 seconds
    const pollInterval = setInterval(fetchDocuments, 30000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  // Close library menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (libraryMenuRef.current && !libraryMenuRef.current.contains(event.target)) {
        setLibraryMenuOpen(false);
      }
    };

    if (libraryMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [libraryMenuOpen]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return '#4CAF50';
      case 'processing': return '#ff9800';
      case 'error': return '#ff4444';
      case 'uploading': return '#61dafb';
      default: return '#666';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return '#ff4444';
      case 'medium': return '#ff9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const handleDocumentClick = (doc) => {
    if (doc.status === 'processed') {
      navigate(`/document/${doc.id}`);
    }
  };

  const handleDownloadDocument = async (documentId) => {
    try {
      console.log('Downloading document:', documentId);
      
      const response = await fetch(getApiUrl(`/documents/${documentId}/download`));
      const data = await response.json();
      
      if (data.success && data.downloadURL) {
        // Open download URL in new tab
        window.open(data.downloadURL, '_blank');
      } else {
        console.error('Failed to get download URL:', data.error);
        alert('Failed to download document: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Download error:', error);
      handleApiError(error, 'Failed to download document');
    }
  };

  const handleDeleteDocument = async (documentId, documentName) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${documentName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      console.log('Deleting document:', documentId);
      
      const response = await fetch(getApiUrl(`/documents/${documentId}`), {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Document deleted successfully');
        
        // Remove document from local state immediately for better UX
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
        
        // Refresh the list from backend
        setTimeout(() => {
          fetchDocuments();
        }, 1000);
        
        alert('✅ Document deleted successfully!');
      } else {
        throw new Error(data.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      handleApiError(error, '❌ Failed to delete document');
    }
  };

  const handleClearAllDocuments = async (forceMode = false) => {
    if (documents.length === 0) {
      alert('📂 No documents to clear!');
      return;
    }

    const modeText = forceMode ? 'FORCE CLEAR' : 'Clear All Documents';
    const warningText = forceMode ? 
      `💥 ${modeText} (AGGRESSIVE MODE)\n\n` +
      `This will AGGRESSIVELY delete ALL ${documents.length} documents using force methods.\n\n` +
      `This bypasses normal safety checks and is more thorough.\n\n` +
      `USE ONLY IF NORMAL CLEAR FAILS!\n\n` +
      `This action CANNOT be undone!` :
      `⚠️ ${modeText}\n\n` +
      `This will permanently delete ALL ${documents.length} documents from your library.\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Are you absolutely sure you want to continue?`;

    // Show strong confirmation dialog
    const confirmed = window.confirm(warningText);
    
    if (!confirmed) return;

    // Double confirmation for safety
    const doubleConfirmed = window.confirm(
      `🚨 FINAL CONFIRMATION - ${modeText.toUpperCase()}\n\n` +
      `You are about to ${forceMode ? 'FORCE ' : ''}delete ${documents.length} documents permanently.\n\n` +
      `Click OK to proceed, or Cancel to abort.`
    );
    
    if (!doubleConfirmed) return;

    try {
      console.log(`🗑️ ${modeText}...`);
      
      // Call appropriate backend API endpoint
      const endpoint = forceMode ? 
        getApiUrl('/documents/force-clear') : 
        getApiUrl('/documents/clear-all');
      
      const response = await fetch(endpoint, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${modeText} completed successfully`);
        
        // Clear local state immediately
        setDocuments([]);
        
        // Close the menu
        setLibraryMenuOpen(false);
        
        const successMessage = forceMode ?
          `💥 Force clear completed!\n\nAggressively deleted: ${data.deletedCount || documents.length} documents\n\nAll data has been destroyed.` :
          `✅ Successfully cleared all documents!\n\nDeleted: ${data.deletedCount || documents.length} documents`;
        
        alert(successMessage);
        
        // Force refresh to ensure sync
        setTimeout(() => {
          fetchDocuments();
        }, 500);
      } else {
        throw new Error(data.error || `Failed to ${modeText.toLowerCase()}`);
      }
    } catch (error) {
      console.error(`❌ ${modeText} error:`, error);
      const errorMessage = forceMode ?
        `❌ Force clear failed: ${error.message}\n\nTry manual cleanup or contact support.` :
        `❌ Clear all failed: ${error.message}\n\nTry Force Clear option if normal clear keeps failing.`;
      // Use our error handling utility
      handleApiError(error, errorMessage);
    }
  };

  const handleReAnalyzeDocument = async (documentId) => {
    try {
      console.log('Re-analyzing document:', documentId);
      
      // Show confirmation dialog
      const confirmed = window.confirm(
        'Re-analyze this document?\n\nThis will process the document again with the latest AI improvements and may take a few minutes.'
      );
      
      if (!confirmed) return;
      
      // Update document status to processing immediately for better UX
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === documentId 
            ? { ...doc, status: 'processing' }
            : doc
        )
      );
      
      const response = await fetch(getApiUrl(`/documents/${documentId}/reanalyze`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Document re-analysis started! Processing may take a few minutes.');
        
        // Refresh the document list to get updated status
        setTimeout(() => {
          fetchDocuments();
        }, 1000);
      } else {
        // Revert status on error
        setDocuments(prevDocs => 
          prevDocs.map(doc => 
            doc.id === documentId 
              ? { ...doc, status: 'processed' }
              : doc
          )
        );
        throw new Error(data.error || 'Re-analysis failed');
      }
      
    } catch (error) {
      console.error('Re-analysis error:', error);
      handleApiError(error, 'Failed to re-analyze document');
      
      // Revert status on error
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === documentId 
            ? { ...doc, status: 'processed' }
            : doc
        )
      );
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesSearch = doc.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Display actual documents from backend only
  const displayDocuments = documents;

  if (loading) {
    return (
      <div className="document-dashboard">
        <div className="library-header">
          <h3 className="sidebar-title">📂 Document Library</h3>
          <div className="library-menu-container">
            <button 
              className="library-menu-btn"
              disabled
              title="Loading..."
            >
              ⋯
            </button>
          </div>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#61dafb' }}>
          🔄 Loading documents...
        </div>
      </div>
    );
  }

  return (
    <div className="document-dashboard">
      <div className="library-header">
        <h3 className="sidebar-title">📂 Document Library</h3>
        <div className="library-menu-container" ref={libraryMenuRef}>
          <button 
            className="library-menu-btn"
            onClick={() => setLibraryMenuOpen(!libraryMenuOpen)}
            title="Document library options"
          >
            ⋯
          </button>
          {libraryMenuOpen && (
            <div className="library-dropdown-menu">
              <button 
                className="library-menu-item danger"
                onClick={() => {
                  setLibraryMenuOpen(false);
                  handleClearAllDocuments(false);
                }}
                title="Permanently delete all documents (safe method)"
              >
                🗑️ Clear All Documents
              </button>
              <button 
                className="library-menu-item danger-force"
                onClick={() => {
                  setLibraryMenuOpen(false);
                  handleClearAllDocuments(true);
                }}
                title="Aggressively delete all documents (use if normal clear fails)"
              >
                💥 Force Clear All
              </button>
              <div className="menu-separator"></div>
              <button 
                className="library-menu-item"
                onClick={() => {
                  setLibraryMenuOpen(false);
                  fetchDocuments();
                }}
                title="Refresh document list"
              >
                🔄 Refresh Library
              </button>
            </div>
          )}
        </div>
      </div>
      <ul className="doc-list">
        {displayDocuments.map((doc) => (
          <li 
            key={doc.id} 
            className={`doc-card ${doc.status === 'processed' ? 'clickable' : ''}`}
            onClick={() => doc.status === 'processed' && handleDocumentClick(doc)}
            style={{
              cursor: doc.status === 'processed' ? 'pointer' : 'default'
            }}
          >
            <p className="doc-title">{doc.originalName || doc.fileName || 'Untitled Document'}</p>
            <p className="doc-type">{doc.fileType || 'Unknown Type'}</p>
            <p className="doc-date">{formatDate(doc.uploadedAt || doc.createdAt)}</p>

            {doc.status !== "none" && (
              <span className={`status ${doc.status}`}>{doc.status}</span>
            )}

            {doc.status === "processed" && (
              <div className="doc-actions">
                <button 
                  className="reanalyze-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReAnalyzeDocument(doc.id);
                  }}
                  title="Re-analyze this document with latest AI"
                >
                  Re-Analyze
                </button>
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDocument(doc.id, doc.originalName || doc.fileName || 'this document');
                  }}
                  title="Delete this document permanently"
                >
                  Delete
                </button>
              </div>
            )}

            {doc.status === "processing" && (
              <div style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.8rem', 
                color: '#ff9800',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>Processing...</span>
              </div>
            )}

            {doc.status === "error" && (
              <div style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.8rem', 
                color: '#ff4444' 
              }}>
                Processing failed
                <div className="doc-actions">
                  <button 
                    className="reanalyze-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReAnalyzeDocument(doc.id);
                    }}
                    title="Try processing this document again"
                  >
                    Retry
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(doc.id, doc.originalName || doc.fileName || 'this document');
                    }}
                    title="Delete this failed document"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        
        {documents.length === 0 && !loading && (
          <li className="doc-card" style={{ textAlign: 'center', color: '#888' }}>
            <p>No documents uploaded yet</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Upload your first document to get started</p>
          </li>
        )}
      </ul>
    </div>
  );
}
