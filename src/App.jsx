import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import About from "./pages/about";
import "./index.css"; // global css

function App() {
  return (
    <Router>
      <div>
        {/* ✅ Routes decide which page to render */}
        <Routes>
          {/* Default route -> About page */}
          <Route path="/" element={<About />} />

          {/* Home page */}
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
