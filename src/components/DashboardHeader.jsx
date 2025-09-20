import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../pages/AuthContext.jsx';
import logoImg from '../assets/dashlogo.png';

export default function DashboardHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileRef = useRef(null);
  
  // Get current date and time for the greeting
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  
  // Update greeting based on time of day
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting('Good Morning');
      } else if (hour < 18) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
      
      // Format current time
      const now = new Date();
      const options = { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric'
      };
      setCurrentTime(now.toLocaleDateString('en-US', options));
    };
    
    updateGreeting();
    
    // Update time every minute
    const intervalId = setInterval(updateGreeting, 60000);
    return () => clearInterval(intervalId);
  }, []);

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

  // Calculate usage percentage for the progress bar
  const usagePercentage = 66; // 2 out of 3 documents (about 66%)

  return (
    <header className="dashboard-header">
      {/* Left Section: Logo & Greeting */}
      <div className="dashboard-header-left">
        <div className="header-logo">
          <Link to="/dashboard">
            <img src={logoImg} alt="Clarity Legal Logo" className="dashboard-logo-image" />
          </Link>
        </div>
        
        <div className="greeting-container">
          <h2 className="greeting">
            {greeting}, <span className="user-name">{user?.displayName || 'User'}</span>
          </h2>
          <p className="date-display">{currentTime}</p>
        </div>
      </div>
      
      {/* Center Section: Navigation */}
      <div className="dashboard-header-center">
        <nav className="dashboard-nav">
          <Link to="/dashboard" className={`dashboard-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Dashboard</span>
          </Link>
          <Link to="/documents" className={`dashboard-nav-item ${location.pathname === '/documents' ? 'active' : ''}`}>
            <span className="nav-icon">📄</span>
            <span className="nav-text">My Documents</span>
          </Link>
          <Link to="/history" className={`dashboard-nav-item ${location.pathname === '/history' ? 'active' : ''}`}>
            <span className="nav-icon">🕒</span>
            <span className="nav-text">History</span>
          </Link>
          <Link to="/settings" className={`dashboard-nav-item ${location.pathname === '/settings' ? 'active' : ''}`}>
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </Link>
        </nav>
      </div>
      
      {/* Right Section: Usage & Profile */}
      <div className="dashboard-header-right">
        {/* Usage Display */}
        <div className="usage-display">
          <span className="usage-text">2/3 Documents Used</span>
          <div className="usage-progress-bar">
            <div 
              className="usage-progress-fill" 
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Upgrade Button */}
        <button 
          className="upgrade-button"
          onClick={() => navigate('/pricing')}
          title="View pricing plans"
        >
          <span className="upgrade-icon">⭐</span>
          <span>Upgrade Plan</span>
        </button>
        
        {/* Profile Section */}
        <div className="profile-wrapper" ref={profileRef}>
          <div 
            className="profile-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="profile-avatar">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'P'}
            </div>
            <span className="profile-name">{user?.displayName || 'Pawan Joshi'}</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          
          {dropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-user-info">
                <div className="dropdown-avatar">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'P'}
                </div>
                <div className="dropdown-user-details">
                  <span className="dropdown-user-name">{user?.displayName || 'Pawan Joshi'}</span>
                  <span className="dropdown-user-email">{user?.email || 'user@example.com'}</span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <ul className="dropdown-menu">
                <li className="dropdown-item">
                  <span className="dropdown-item-icon">👤</span>
                  <span>My Profile</span>
                </li>
                <li className="dropdown-item">
                  <span className="dropdown-item-icon">�</span>
                  <span>Account Settings</span>
                </li>
                <li className="dropdown-item" onClick={handleLogout}>
                  <span className="dropdown-item-icon">🚪</span>
                  <span>Log Out</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}