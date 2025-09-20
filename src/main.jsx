import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";  // global CSS
import "./text-overflow-fixes.css"; // fixes for text overflow
import "./document-text-fix.css"; // simplified document text formatting fixes
import "./view-toggle.css"; // styles for view toggle buttons

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
