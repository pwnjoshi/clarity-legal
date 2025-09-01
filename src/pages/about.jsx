import React from "react";
import { Star } from "lucide-react";
import "./About.css"; // unique css for About page

export default function About() {
  return (
    <div className="dark-container">
      <header className="navbar">
        <div className="logo-section">
          <span className="logo-icon">⚖️</span>
          <span className="logo-text">Clarity Legal</span>
          <span className="logo-tagline">Document Decoder</span>
        </div>

        <nav className="nav-links">
          {["Home", "About", "Pricing", "FAQ", "Help"].map((link) => (
            <a key={link} href="#" className="nav-link">
              {link}
            </a>
          ))}
        </nav>

        <div className="navbar-right">
          <span className="usage">2/3 Documents Used</span>
          <button className="upgrade-btn">Upgrade</button>
        </div>
      </header>

      <main className="about-main">
        <h1 className="heading">Welcome to Clarity Legal</h1>
        <p className="description">
          Clarity Legal is your AI-powered{" "}
          <span className="highlight">Legal Document Decoder</span>. We
          simplify complex legal documents...
        </p>

        <h2 className="section-title">Features</h2>
        <div className="features-grid">
          {[
            {
              title: "Document Upload",
              icon: "📑",
              desc: "Easily upload PDFs...",
            },
            {
              title: "Instant Summaries",
              icon: "⚡",
              desc: "Get quick summaries...",
            },
            {
              title: "Secure & Private",
              icon: "🔒",
              desc: "Your data stays confidential.",
            },
          ].map((f) => (
            <div key={f.title} className="feature-card">
              <h3 className="feature-title">
                {f.icon} {f.title}
              </h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="section-title">What Our Users Say</h2>
        <div className="reviews">
          {[
            { stars: 5, text: "…saved me hours…", author: "Priya S." },
            { stars: 4, text: "…clear explanations…", author: "Rahul K." },
          ].map((r, i) => (
            <div key={i} className="review-card">
              <div className="stars">
                {[...Array(r.stars)].map((_, j) => (
                  <Star key={j} className="star-icon" />
                ))}
              </div>
              <p className="review-text">{r.text}</p>
              <p className="review-author">– {r.author}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="footer">
        <p>
          © 2025 Clarity Legal | <span className="disclaimer">DISCLAIMER:</span>{" "}
          This tool provides general information only.
        </p>
        <p className="footer-links">
          <a href="#">Terms of Service</a> | <a href="#">Privacy Policy</a>
        </p>
      </footer>
    </div>
  );
}
