import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import About from "./pages/about";
import Login from "./pages/login";
import DocumentViewer from "./pages/DocumentViewer";
import { AuthProvider } from "./pages/AuthContext.jsx";
import "./index.css";

function App() {
  return (
    <Router>
      <AuthProvider>   {/* ✅ wrap everything inside AuthProvider */}
        <div>
          <Routes>
            <Route path="/" element={<About />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/document/:documentId" element={<DocumentViewer />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
