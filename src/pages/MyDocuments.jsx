import React from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import './ComingSoon.css';

export default function MyDocuments() {
  return (
    <div className="app-container">
      <DashboardHeader />
      
      <div className="coming-soon-container">
        <div className="coming-soon-content">
          <div className="coming-soon-icon">📄</div>
          <h1 className="coming-soon-title">My Documents</h1>
          <h2 className="coming-soon-subtitle">Coming Soon</h2>
          <p className="coming-soon-description">
            We're working hard to build an advanced document management system that will allow you 
            to organize, search, and access all your legal documents in one place. Stay tuned for 
            this exciting feature!
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