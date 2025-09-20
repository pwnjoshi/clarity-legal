import React from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import './ComingSoon.css';

export default function Settings() {
  return (
    <div className="app-container">
      <DashboardHeader />
      
      <div className="coming-soon-container">
        <div className="coming-soon-content">
          <div className="coming-soon-icon">⚙️</div>
          <h1 className="coming-soon-title">Settings</h1>
          <h2 className="coming-soon-subtitle">Coming Soon</h2>
          <p className="coming-soon-description">
            Customize your Clarity Legal experience with our comprehensive settings panel. 
            Adjust notification preferences, personalize your interface, manage account details, 
            and configure AI assistant behavior to suit your specific needs.
          </p>
          
          <Link to="/dashboard" className="dashboard-link">
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="coming-soon-progress">
            <div className="coming-soon-progress-bar"></div>
          </div>
        </div>
      </div>
    </div>
  );
}