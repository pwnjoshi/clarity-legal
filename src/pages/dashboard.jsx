import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./dashboard.css";
import logoImg from "../assets/clarity-legal-logo.png"; //  Import the logo image
import apiService from "../services/apiService.js"; //  Backend integration
import DocumentDashboard from "../components/DocumentDashboard.jsx";

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileObject, setSelectedFileObject] = useState(null); //  Store actual file object
  const [docType, setDocType] = useState("Other");
  const [dropdownOpen, setDropdownOpen] = useState(false); //  profile dropdown toggle
  const profileRef = useRef(null); // ref to detect outside clicks
  
  // Backend integration state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [processedResult, setProcessedResult] = useState(null);

  // Documents are now managed by DynamicDashboard component

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file.name);
      setSelectedFileObject(file);
      // Clear previous results/errors
      setUploadError(null);
      setUploadSuccess(null);
      setProcessedResult(null);
    } else {
      setSelectedFile(null);
      setSelectedFileObject(null);
    }
  };

  // ✅ Handle document upload to backend
  const handleUploadDocument = async () => {
    if (!selectedFileObject) {
      setUploadError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // Validate file on frontend
      apiService.validateFile(selectedFileObject);
      
      // Upload to backend
      const result = await apiService.uploadDocument(selectedFileObject, docType);
      
      setUploadSuccess('Document processed successfully!');
      setProcessedResult(result.data);
      
      console.log('✅ Upload successful:', result);
      
    } catch (error) {
      setUploadError(error.message);
      console.error('❌ Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Close dropdown when clicking outside profile container
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo-section">
          <div className="logo">
            {/* ✅ Only image + text, no emoji */}
            <img src={logoImg} alt="Clarity Legal Logo" className="logo-image" />
          </div>
        </div>

        {/* Left Navbar */}
        <nav className="nav-left">
          <Link to="/dashboard" className="nav-btn">Home</Link>
          <a href="#" className="nav-btn">Pricing</a>
        </nav>

        {/* Right Navbar */}
        <div className="navbar-right">
          <span className="usage">2/3 Documents Used</span>
          <button className="upgrade-btn">
            <span className="upgrade-icon">👑</span> Upgrade
          </button>

          <div className="profile-container" ref={profileRef}>
            <div 
              className="profile" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              JD
            </div>
            {dropdownOpen && (
              <ul className="profile-dropdown">
                <li>My Profile</li>
                <li>Account</li>
                <li>Plans</li>
                <li>Log Out</li>
              </ul>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="dashboard-main">
        {/* Sidebar - Document Dashboard */}
        <aside className="sidebar">
          <DocumentDashboard />
        </aside>

        {/* Content */}
        <section className="content">
          <h1 className="page-title">Legal Document Decoder</h1>
          <p className="page-subtitle">
            Transform complex legal language into clear, human-readable text
          </p>

          {/* Upload */}
          <div className="upload-box">
            <p>📄 Drop your document here</p>
            <p className="upload-sub">or click below to browse your files</p>
            <input type="file" id="fileInput" hidden onChange={handleFileChange} />
            <button
              onClick={() => document.getElementById("fileInput").click()}
              className="choose-file-btn"
              disabled={isUploading}
            >
              Choose File
            </button>
            {selectedFile && <p className="file-selected">✅ Selected: {selectedFile}</p>}
            
            {/* ✅ Upload button - only show when file is selected */}
            {selectedFileObject && (
              <button
                onClick={handleUploadDocument}
                className="choose-file-btn"
                disabled={isUploading}
                style={{ marginTop: '10px', backgroundColor: '#4CAF50' }}
              >
                {isUploading ? '🔄 Processing...' : '🚀 Process Document'}
              </button>
            )}
            
            {/* ✅ Status messages */}
            {uploadError && (
              <p className="upload-error" style={{ color: '#ff4444', marginTop: '10px' }}>
                ❌ {uploadError}
              </p>
            )}
            {uploadSuccess && (
              <p className="upload-success" style={{ color: '#4CAF50', marginTop: '10px' }}>
                ✅ {uploadSuccess}
              </p>
            )}
            
            <p className="upload-info">
              Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
            </p>
          </div>

          {/* Config */}
          <div className="config-box">
            <h3 className="config-title">⚙️ Document Configuration</h3>
            <label className="config-label">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="config-select"
            >
              <option>Other</option>
              <option>Contract</option>
              <option>Privacy Policy</option>
              <option>Terms of Service</option>
            </select>
          </div>

          {/* ✅ Results Display - only show when we have results */}
          {processedResult && (
            <div className="results-box" style={{
              marginTop: '20px',
              padding: '20px',
              border: '1px solid #333',
              borderRadius: '10px',
              backgroundColor: '#1a1a1a'
            }}>
              <h3 className="results-title" style={{ color: '#4CAF50', marginBottom: '15px' }}>
                🎆 Document Analysis Results
              </h3>
              
              {/* Document Info */}
              <div className="document-info" style={{ marginBottom: '20px' }}>
                <p><strong>Document:</strong> {processedResult.document?.originalName}</p>
                <p><strong>Type:</strong> {processedResult.document?.fileType}</p>
                <p><strong>Status:</strong> 
                  <span style={{ 
                    color: processedResult.document?.status === 'processed' ? '#4CAF50' : '#ff9800',
                    marginLeft: '5px'
                  }}>
                    {processedResult.document?.status}
                  </span>
                </p>
              </div>

              {/* Simplified Text */}
              {processedResult.simplifiedText && (
                <div className="simplified-text" style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#61dafb', marginBottom: '10px' }}>📝 Plain English Summary:</h4>
                  <div style={{
                    backgroundColor: '#2a2a2a',
                    padding: '15px',
                    borderRadius: '8px',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6'
                  }}>
                    {processedResult.simplifiedText}
                  </div>
                </div>
              )}

              {/* Risk Analysis */}
              {processedResult.riskAnalysis && (
                <div className="risk-analysis">
                  <h4 style={{ color: '#ff9800', marginBottom: '10px' }}>🚦 Risk Assessment:</h4>
                  <div style={{
                    backgroundColor: '#2a2a2a',
                    padding: '15px',
                    borderRadius: '8px'
                  }}>
                    <p><strong>Overall Risk:</strong> 
                      <span style={{
                        color: processedResult.riskAnalysis.overallRisk === 'high' ? '#ff4444' :
                               processedResult.riskAnalysis.overallRisk === 'medium' ? '#ff9800' : '#4CAF50',
                        marginLeft: '5px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold'
                      }}>
                        {processedResult.riskAnalysis.overallRisk}
                      </span>
                    </p>
                    
                    {processedResult.riskAnalysis.riskFactors && processedResult.riskAnalysis.riskFactors.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <strong>Risk Factors:</strong>
                        <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                          {processedResult.riskAnalysis.riskFactors.slice(0, 5).map((factor, index) => (
                            <li key={index} style={{
                              color: factor.level === 'high' ? '#ff4444' :
                                     factor.level === 'medium' ? '#ff9800' : '#4CAF50',
                              marginBottom: '5px'
                            }}>
                              {factor.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {/* View Full Analysis Button */}
                <button
                  onClick={() => {
                    if (processedResult.document?.id) {
                      // Store the processed result in sessionStorage for the document viewer
                      sessionStorage.setItem('processedDocument', JSON.stringify(processedResult));
                      window.open(`/document/${processedResult.document.id}`, '_blank');
                    } else {
                      alert('⚠️ Document ID not available for detailed analysis');
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#45a049';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#4CAF50';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  📄 View Full Analysis
                </button>
                
                {/* Download Button (if cloud stored) */}
                {processedResult.document?.storageInfo?.cloudStored && (
                  <button
                    onClick={async () => {
                      try {
                        const downloadURL = await apiService.downloadDocument(processedResult.document.id);
                        window.open(downloadURL, '_blank');
                      } catch (error) {
                        alert('Failed to download: ' + error.message);
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#61dafb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#4fc3f7';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#61dafb';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    ☁️ Download Original
                  </button>
                )}
                
                {/* Clear Results Button */}
                <button
                  onClick={() => {
                    setProcessedResult(null);
                    setUploadSuccess(null);
                    setSelectedFile(null);
                    setSelectedFileObject(null);
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#777';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#666';
                  }}
                >
                  ✖️ Clear Results
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
