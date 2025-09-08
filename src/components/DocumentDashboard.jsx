import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import './DocumentDashboard.css';

export default function DocumentDashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch documents from backend API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching documents from backend...');
      
      const response = await apiService.getDocuments();
      
      if (response.success) {
        console.log(`✅ Fetched ${response.documents.length} documents`);
        setDocuments(response.documents || []);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to fetch documents');
      }
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
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
            console.log(`✅ Fallback: Fetched ${docs.length} documents from Firebase`);
          },
          (firebaseError) => {
            console.error('❌ Firebase fallback failed:', firebaseError);
            // Use empty array if both backend and Firebase fail
            setDocuments([]);
          }
        );
        
        return () => unsubscribe();
      } catch (firebaseError) {
        console.error('❌ Firebase fallback failed:', firebaseError);
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
      
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}/download`);
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
      alert('Failed to download document: ' + error.message);
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
      
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}`, {
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
      alert('❌ Failed to delete document: ' + error.message);
    }
  };

  const handleReAnalyzeDocument = async (documentId) => {
    try {
      console.log('Re-analyzing document:', documentId);
      // TODO: Implement re-analysis API endpoint
      alert('🔄 Re-analysis feature coming soon!');
    } catch (error) {
      console.error('Re-analysis error:', error);
      alert('Failed to re-analyze document: ' + error.message);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesSearch = doc.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: '#61dafb' }}>🔄 Loading your documents...</div>
      </div>
    );
  }

  return (
    <div className="document-dashboard">
      <div className="dashboard-header">
        <h3 className="sidebar-title">📂 Document Library ({documents.length})</h3>
        
        {/* Search and Filter */}
        <div className="dashboard-controls">
          <input
            type="text"
            placeholder="🔍 Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="processed">✅ Processed</option>
            <option value="processing">🔄 Processing</option>
            <option value="uploading">📤 Uploading</option>
            <option value="error">❌ Error</option>
          </select>
        </div>
      </div>
      
      {error && (
        <div className="offline-warning">
          ⚠️ Using offline mode - {error}
        </div>
      )}
      
      <ul className="doc-list">
        {filteredDocuments.length === 0 ? (
          <li className="empty-state">
            {searchTerm || filterStatus !== 'all' ? (
              <>
                <div>🔍</div>
                <div>No documents match your search</div>
                <button 
                  onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                  className="clear-filters"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <div>📄</div>
                <div>No documents uploaded yet</div>
                <div>Upload your first document to get started</div>
              </>
            )}
          </li>
        ) : (
          filteredDocuments.map((doc) => (
            <li 
              key={doc.id} 
              className={`doc-card ${doc.status === 'processed' ? 'clickable' : ''}`}
              style={{
                borderLeft: `4px solid ${getStatusColor(doc.status)}`
              }}
              onClick={() => handleDocumentClick(doc)}
            >
              <div className="doc-header">
                <div className="doc-info">
                  <p className="doc-title">{doc.originalName || doc.fileName || 'Untitled Document'}</p>
                  <p className="doc-meta">
                    <span className="doc-type">{doc.fileType || 'Unknown Type'}</span>
                    <span className="doc-date">{formatDate(doc.uploadedAt || doc.createdAt)}</span>
                  </p>
                </div>
                {doc.status === 'processed' && (
                  <div className="view-indicator">
                    👁️
                  </div>
                )}
              </div>
              
              <div className="doc-status-row">
                <div className="doc-badges">
                  <span 
                    className={`status-badge ${doc.status || 'unknown'}`}
                    style={{ 
                      backgroundColor: getStatusColor(doc.status) + '20',
                      color: getStatusColor(doc.status),
                      border: `1px solid ${getStatusColor(doc.status)}30`
                    }}
                  >
                    {doc.status === 'processed' ? '✅' : 
                     doc.status === 'processing' ? '🔄' : 
                     doc.status === 'error' ? '❌' : 
                     doc.status === 'uploading' ? '📤' : '⏳'}
                    {doc.status || 'pending'}
                  </span>
                  
                  {doc.riskLevel && doc.status === 'processed' && (
                    <span 
                      className={`risk-badge ${doc.riskLevel}`}
                      style={{ 
                        backgroundColor: getRiskColor(doc.riskLevel) + '20',
                        color: getRiskColor(doc.riskLevel),
                        border: `1px solid ${getRiskColor(doc.riskLevel)}30`
                      }}
                    >
                      {doc.riskLevel === 'high' ? '🔴' : 
                       doc.riskLevel === 'medium' ? '🟡' : '🟢'}
                      {doc.riskLevel} risk
                    </span>
                  )}
                  
                  {/* Cloud storage indicator */}
                  {doc.storageInfo?.cloudStored && (
                    <span 
                      className="cloud-badge"
                      style={{ 
                        backgroundColor: 'rgba(97, 218, 251, 0.2)',
                        color: '#61dafb',
                        border: '1px solid rgba(97, 218, 251, 0.3)',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Document stored in cloud"
                    >
                      ☁️ Cloud
                    </span>
                  )}
                </div>
                
                {doc.fileSize && (
                  <span className="file-size">
                    {apiService.formatFileSize(doc.fileSize)}
                  </span>
                )}
              </div>

              {/* Document Actions - Always show for processed documents */}
              {doc.status === 'processed' && (
                <div className="doc-actions">
                  <div className="action-row">
                    <button 
                      className="action-btn primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/document/${doc.id}`);
                      }}
                      title="View detailed analysis of this document"
                    >
                      📄 View Analysis
                    </button>
                    
                    <button 
                      className="action-btn secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReAnalyzeDocument(doc.id);
                      }}
                      title="Re-analyze this document with latest AI"
                    >
                      🔄 Re-Analyze
                    </button>
                    
                    {/* Download button for cloud-stored documents */}
                    {doc.storageInfo?.cloudStored && (
                      <button 
                        className="action-btn cloud"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadDocument(doc.id);
                        }}
                        title="Download original document from cloud"
                        style={{
                          backgroundColor: 'rgba(97, 218, 251, 0.1)',
                          color: '#61dafb',
                          border: '1px solid rgba(97, 218, 251, 0.3)'
                        }}
                      >
                        ☁️ Download
                      </button>
                    )}
                  </div>
                  
                  <div className="action-row secondary-actions">
                    <button 
                      className="action-btn danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc.id, doc.originalName || doc.fileName || 'this document');
                      }}
                      title="Permanently delete this document"
                      style={{
                        backgroundColor: 'rgba(255, 68, 68, 0.1)',
                        color: '#ff4444',
                        border: '1px solid rgba(255, 68, 68, 0.3)',
                        fontSize: '0.85rem'
                      }}
                    >
                      🗑️ Delete
                    </button>
                    
                    <span className="doc-id" title="Document ID">
                      ID: {doc.id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              )}
              
              {/* Actions for other statuses */}
              {doc.status === 'processing' && (
                <div className="doc-actions">
                  <div className="processing-indicator">
                    <div className="spinner"></div>
                    <span>Processing document...</span>
                  </div>
                </div>
              )}
              
              {doc.status === 'error' && (
                <div className="doc-actions">
                  <button 
                    className="action-btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(doc.id, doc.originalName || doc.fileName || 'this document');
                    }}
                    title="Remove failed document"
                    style={{
                      backgroundColor: 'rgba(255, 68, 68, 0.1)',
                      color: '#ff4444',
                      border: '1px solid rgba(255, 68, 68, 0.3)'
                    }}
                  >
                    🗑️ Remove
                  </button>
                </div>
              )}

              {doc.status === 'error' && (
                <div style={{ 
                  marginTop: '8px', 
                  color: '#ff4444', 
                  fontSize: '0.8rem' 
                }}>
                  ❌ Processing failed: {doc.error || 'Unknown error'}
                </div>
              )}
            </li>
          ))
        )}
      </ul>

      {/* Quick stats */}
      <div className="dashboard-stats">
        <h4 className="stats-title">📊 Document Stats</h4>
        <div className="stats-grid">
          <div className="stat-item processed">
            <div className="stat-number">
              {documents.filter(d => d.status === 'processed').length}
            </div>
            <div className="stat-label">✅ Processed</div>
          </div>
          <div className="stat-item processing">
            <div className="stat-number">
              {documents.filter(d => d.status === 'processing').length}
            </div>
            <div className="stat-label">🔄 Processing</div>
          </div>
          <div className="stat-item total">
            <div className="stat-number">
              {documents.length}
            </div>
            <div className="stat-label">📄 Total</div>
          </div>
          {documents.filter(d => d.riskLevel === 'high').length > 0 && (
            <div className="stat-item high-risk">
              <div className="stat-number">
                {documents.filter(d => d.riskLevel === 'high').length}
              </div>
              <div className="stat-label">🔴 High Risk</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
