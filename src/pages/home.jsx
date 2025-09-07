import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./home.css";
import logoImg from "./logo new.jpg"; // ✅ Import the logo image

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState("Other");
  const [dropdownOpen, setDropdownOpen] = useState(false); // ✅ profile dropdown toggle
  const profileRef = useRef(null); // ref to detect outside clicks

  const documents = [
    { title: "Software License Agreement", type: "Terms of Service", date: "1/20/2025", status: "processed" },
    { title: "Employment Contract - Senior Developer", type: "Contract", date: "1/19/2025", status: "processed" },
    { title: "Privacy Policy Update", type: "Privacy Policy", date: "1/18/2025", status: "processing" },
    { title: "Apartment Lease Agreement", type: "Lease Agreement", date: "1/17/2025", status: "processed" },
    { title: "NDA - Client Project", type: "NDA", date: "1/16/2025", status: "none" },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file ? file.name : null);
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
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="logo-section">
          <div className="logo">
            {/* ✅ Only image + text, no emoji */}
            <img src={logoImg} alt="Clarity Legal Logo" className="logo-image" />
            <span className="logo-text">Clarity Legal</span>
          </div>
          <span className="logo-tagline">Document Decoder</span>
        </div>

        {/* Left Navbar */}
        <nav className="nav-left">
          <Link to="/" className="nav-btn">Home</Link>
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
      <div className="home-main">
        {/* Sidebar */}
        <aside className="sidebar">
          <h3 className="sidebar-title">📂 Document Library</h3>
          <ul className="doc-list">
            {documents.map((doc, i) => (
              <li key={i} className="doc-card">
                <p className="doc-title">{doc.title}</p>
                <p className="doc-type">{doc.type}</p>
                <p className="doc-date">{doc.date}</p>

                {doc.status !== "none" && (
                  <span className={`status ${doc.status}`}>{doc.status}</span>
                )}

                {doc.status === "processed" && (
                  <div className="doc-actions">
                    <button className="reanalyze-btn">Re-Analyze</button>
                    <button className="report-btn">Report</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
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
            >
              Choose File
            </button>
            {selectedFile && <p className="file-selected">✅ Selected: {selectedFile}</p>}
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
        </section>
      </div>
    </div>
  );
}
