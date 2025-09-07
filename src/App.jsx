import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import About from "./pages/about";
import Login from "./pages/login";
import { AuthProvider } from "./pages/AuthContext.jsx";
import "./index.css";

function App() {
  return (
    <Router>
      <AuthProvider>   {/* ✅ wrap everything inside AuthProvider */}
        <div>
          <Routes>
            <Route path="/" element={<About />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
