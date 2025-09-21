import React, { useState, useEffect } from "react";
// Using HashRouter for better compatibility with static hosting and direct URL access
// URLs will include a hash (#) symbol, e.g., http://localhost:5173/#/document/123
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Home from "./pages/home";
import Login from "./pages/login";
import Pricing from "./pages/pricing";
import DocumentViewer from "./pages/DocumentViewer";
import MyDocuments from "./pages/MyDocuments";
import History from "./pages/History";
import Settings from "./pages/Settings";
import { AuthProvider } from "./pages/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import APIDebugger from "./components/APIDebugger.jsx";
import "./index.css";

function App() {
  // Show API debugger in development or when URL param is present
  const [showDebugger, setShowDebugger] = useState(false);
  
  useEffect(() => {
    // Show debugger in development mode or if debug param is present
    const isDevelopment = import.meta.env.MODE === 'development';
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    
    setShowDebugger(isDevelopment || debugParam === 'true');
    
    console.log('🔧 API Debugger:', { 
      enabled: isDevelopment || debugParam === 'true',
      environment: import.meta.env.MODE,
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'Not defined'
    });
  }, []);

  return (
    <Router>
      <AuthProvider>   {/* ✅ wrap everything inside AuthProvider */}
        <div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/document/:documentId" element={
              <ProtectedRoute>
                <DocumentViewer />
              </ProtectedRoute>
            } />
            <Route path="/documents" element={
              <ProtectedRoute>
                <MyDocuments />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
          </Routes>
          
          {/* API Debugger (only shown in development or with ?debug=true URL param) */}
          {showDebugger && <APIDebugger />}
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
