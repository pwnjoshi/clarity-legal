import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";  // global CSS
import "./text-overflow-fixes.css"; // fixes for text overflow
import "./document-text-fix.css"; // simplified document text formatting fixes
import "./view-toggle.css"; // styles for view toggle buttons
import "./utils/debugEnv"; // Import debug utility for environment variables

// Add error boundary for production debugging
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          color: '#e0e0e0', 
          backgroundColor: '#1a1a1a',
          fontFamily: 'Arial, sans-serif',
          maxWidth: '800px',
          margin: '0 auto',
          borderRadius: '8px',
          marginTop: '50px'
        }}>
          <h1>Something went wrong</h1>
          <p>The application encountered an error. Please try refreshing the page.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', color: '#ff9800' }}>Show Error Details</summary>
            <p style={{ color: '#ff5252' }}>{this.state.error && this.state.error.toString()}</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>Component Stack:</p>
            <pre style={{ 
              padding: '10px', 
              backgroundColor: '#2a2a2a', 
              overflowX: 'auto',
              fontSize: '14px'
            }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
