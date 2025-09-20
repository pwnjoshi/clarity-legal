import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../pages/AuthContext.jsx';
import logoImg from '../assets/clarity-legal-logo.png';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isHomePage = location.pathname === '/';
  const isDashboard = location.pathname === '/dashboard';
  const isPricingPage = location.pathname === '/pricing';
  const isDocumentViewer = location.pathname.startsWith('/document/');

  return (
    <header className={`shared-header ${isHomePage ? 'home-style' : 'app-style'}`}>
      <div className="header-content">
        {/* Logo Section */}
        <div className="logo-section">
          <Link to={isLoggedIn ? '/dashboard' : '/'} className="logo-link">
            <img src={logoImg} alt="Clarity Legal Logo" className="logo-image" />
          </Link>
        </div>

        {/* Navigation */}
        {(isDashboard || isHomePage || isPricingPage) && (
          <nav className="header-nav">
            {isDashboard ? (
              <>
                <Link to="/dashboard" className="nav-btn active">Home</Link>
                <Link to="/pricing" className="nav-btn">Pricing</Link>
              </>
            ) : (
              <>
                <Link to="/" className={`nav-btn ${isHomePage ? 'active' : ''}`}>Home</Link>
                <Link to="/pricing" className={`nav-btn ${isPricingPage ? 'active' : ''}`}>Pricing</Link>
              </>
            )}
          </nav>
        )}

        {/* Document Viewer Navigation */}
        {isDocumentViewer && (
          <div className="viewer-nav">
            <button onClick={() => navigate('/dashboard')} className="back-button">
              ← Dashboard
            </button>
          </div>
        )}

        {/* Right Section */}
        <div className="header-right">
          {isLoggedIn ? (
            <>
              {/* Usage indicator - only on dashboard */}
              {isDashboard && (
                <>
                  <span className="usage-indicator">2/3 Documents Used</span>
                  <button className="upgrade-btn">
                    <span className="upgrade-icon">👑</span> Upgrade
                  </button>
                </>
              )}
              
              {/* Profile Dropdown */}
              <div className="profile-container" ref={profileRef}>
                <div 
                  className="profile-avatar"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                {dropdownOpen && (
                  <ul className="profile-dropdown">
                    <li onClick={() => navigate('/dashboard')}>Dashboard</li>
                    <li>My Profile</li>
                    <li>Account</li>
                    <li>Plans</li>
                    <li onClick={handleLogout}>Log Out</li>
                  </ul>
                )}
              </div>
            </>
          ) : (
            /* Auth buttons for non-logged in users */
            <div className="auth-buttons">
              <button
                className="auth-btn login-btn"
                onClick={() => navigate('/login')}
              >
                Log In
              </button>
              <button
                className="auth-btn signup-btn"
                onClick={() => navigate('/login')}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}