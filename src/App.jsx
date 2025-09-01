import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/home";
import About from "./pages/about";
import "./index.css"; // global css

function App() {
  return (
    <Router>
      <div>
        {/* ✅ Navbar stays global */}
        <nav className="navbar">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>

        {/* ✅ Routes decide which page to render */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
