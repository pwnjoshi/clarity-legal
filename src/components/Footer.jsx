import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Twitter, Linkedin, Github, Instagram, Globe, Heart, Shield, Zap } from 'lucide-react';
import logoImg from '../assets/clarity-legal-logo.png';
import './Footer.css';

export default function Footer() {
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <footer className="modern-footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logoImg} alt="Clarity Legal" className="footer-logo-img" />
              <h3 className="footer-brand-name">Clarity Legal</h3>
            </div>
            <p className="footer-tagline">
              Empowering everyone to understand legal documents with AI-powered insights.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="Twitter">
                <Twitter className="social-icon" />
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <Linkedin className="social-icon" />
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <Instagram className="social-icon" />
              </a>
              <a href="#" className="social-link" aria-label="GitHub">
                <Github className="social-icon" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="footer-section-title">Product</h4>
            <ul className="footer-links">
              <li><Link to="/" className="footer-link">Home</Link></li>
              <li><Link to="/pricing" className="footer-link">Pricing</Link></li>
              <li><a href="#" className="footer-link">Features</a></li>
              <li><a href="#" className="footer-link">API</a></li>
              <li><a href="#" className="footer-link">Enterprise</a></li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="footer-section">
            <h4 className="footer-section-title">Support</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Help Center</a></li>
              <li><a href="#" className="footer-link">Documentation</a></li>
              <li><a href="#" className="footer-link">Contact Us</a></li>
              <li><a href="#" className="footer-link">Status</a></li>
              <li><a href="#" className="footer-link">Community</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="footer-section">
            <h4 className="footer-section-title">Legal</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Privacy Policy</a></li>
              <li><a href="#" className="footer-link">Terms of Service</a></li>
              <li><a href="#" className="footer-link">Cookie Policy</a></li>
              <li><a href="#" className="footer-link">Security</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4 className="footer-section-title">Contact</h4>
            <div className="contact-info">
              <div className="contact-item">
                <Mail className="contact-icon" />
                <span>support@claritylegal.com</span>
              </div>
              <div className="contact-item">
                <Phone className="contact-icon" />
                <span>+91 7818975366</span>
              </div>
              <div className="contact-item">
                <MapPin className="contact-icon" />
                <span>Bangalore, India</span>
              </div>
            </div>
            
            {/* Language Dropdown */}
            <div className="language-dropdown">
              <button
                className="language-btn"
                onClick={() => setShowLangMenu(!showLangMenu)}
              >
                <Globe className="globe-icon" />
                Language
              </button>
              {showLangMenu && (
                <ul className="language-menu">
                  <li>English</li>
                  <li>हिन्दी</li>
                  <li>தமிழ்</li>
                  <li>తెలుగు</li>
                  <li>বাংলা</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p className="copyright">
              © 2025 Clarity Legal. All rights reserved.
            </p>
            <div className="security-badges">
              <div className="security-badge">
                <Shield className="security-icon" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="security-badge">
                <Zap className="security-icon" />
                <span>AI Powered</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom-right">
            <p className="disclaimer">
              <span className="disclaimer-label">DISCLAIMER:</span> This tool provides general information only, not legal advice. 
              Always consult with qualified legal professionals for specific legal matters.
            </p>
            <p className="made-with-love">
              Made with <Heart className="heart-icon" /> in India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}