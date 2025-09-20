import React from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import './ComingSoon.css';

export default function History() {
  return (
    <div className="app-container">
      <DashboardHeader />
      
      <div className="coming-soon-container">
        <div className="coming-soon-content">
          <div className="coming-soon-icon">🕒</div>
          <h1 className="coming-soon-title">History</h1>
          <h2 className="coming-soon-subtitle">Coming Soon</h2>
          <p className="coming-soon-description">
            Our activity history feature will provide you with a comprehensive timeline of all your 
            document interactions, AI chat sessions, and document comparison activities. Track your 
            progress and easily revisit previous work.
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