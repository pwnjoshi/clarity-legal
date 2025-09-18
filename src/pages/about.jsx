import React, { useState, useEffect } from "react";
import {
  Star,
  FileText,
  Zap,
  Shield,
  Smartphone,
  CopyCheck,
  Columns,
  Globe,
  Clock,
  Headset,
  Timer,
  Percent,
  BookOpen,
  Users,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";  // ✅
import "./about.css";
import logoImg from "../assets/clarity-legal-logo.png"; // ✅ Import the new logo image

export default function About() {
  const navigate = useNavigate();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { isLoggedIn, user, logout } = useAuth(); // ✅ get logged-in user and logout function

  // Enable scrolling on About page
  useEffect(() => {
    document.body.classList.add('about-page');
    return () => {
      document.body.classList.remove('about-page');
    };
  }, []);

  const handleTryForFree = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="dark-container">
      {/* Logo + Auth Section */}
      <div className="about-header">
        <div className="logo">
          {/* ✅ Only image + text side by side */}
          <img src={logoImg} alt="Clarity Legal Logo" className="logo-image" />
          <div className="logo-content">
          </div>
        </div>
        <div className="auth-buttons">
          {isLoggedIn ? (
            <>
              <button 
                className="auth-btn profile-btn"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </button>
              <button 
                className="auth-btn login-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="auth-btn login-btn"
                onClick={() => navigate("/login")}
              >
                Log In
              </button>
              <button
                className="auth-btn signup-btn"
                onClick={() => navigate("/login")}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>

      <main className="about-main">
        <h1 className="heading">Welcome to Clarity Legal</h1>

        {/* ✅ Updated navigation logic */}
        <button className="try-btn" onClick={handleTryForFree}>
          ✨ Try for Free
        </button>

        <p className="description">
          Clarity Legal is your AI-powered{" "}
          <span className="highlight">Legal Document Decoder</span>. We simplify
          complex legal documents into clear and concise language, so you always
          know what you’re signing or agreeing to.
        </p>

        {/* ✅ Intro Section inside a tile */}
        <div className="feature-card intro-tile">
          <h2 className="intro-title">Why Clarity Legal Matters</h2>
          <p className="intro-text">
            Clarity Legal simplifies complex legal documents, making them clear,
            accessible, and trustworthy. Whether you’re a student, professional,
            or business owner, our tool saves time, prevents costly mistakes,
            and helps you make confident, informed decisions. By translating
            jargon into everyday language, we empower everyone to understand
            their rights and obligations—without needing a law degree.
          </p>
        </div>

        {/* ✅ Added Tiles for Intro Section */}
        <div className="features-grid">
          <div className="feature-card">
            <BookOpen className="feature-icon" />
            <h3 className="feature-title">Simplified Learning</h3>
            <p className="feature-desc">
              Understand contracts and agreements in plain, easy-to-read
              language—no legal background needed.
            </p>
          </div>

          <div className="feature-card">
            <Users className="feature-icon" />
            <h3 className="feature-title">For Everyone</h3>
            <p className="feature-desc">
              Whether you’re a student, freelancer, or business owner, Clarity
              Legal makes law accessible to all.
            </p>
          </div>

          <div className="feature-card">
            <Lightbulb className="feature-icon" />
            <h3 className="feature-title">Informed Decisions</h3>
            <p className="feature-desc">
              By clarifying obligations and rights, you can make smarter,
              well-informed choices confidently.
            </p>
          </div>
        </div>

        {/* Features section */}
        <h2 className="section-title">Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <FileText className="feature-icon" />
            <h3 className="feature-title">Document Upload</h3>
            <p className="feature-desc">
              Upload contracts, agreements, or any legal PDFs. Our system
              processes documents quickly and extracts only the relevant
              information—no manual searching needed.
            </p>
          </div>

          <div className="feature-card">
            <Zap className="feature-icon" />
            <h3 className="feature-title">Instant Summaries</h3>
            <p className="feature-desc">
              Get concise and easy-to-understand summaries within seconds. No
              more wasting hours decoding jargon—just the key points that matter
              to you.
            </p>
          </div>

          <div className="feature-card">
            <Shield className="feature-icon" />
            <h3 className="feature-title">Secure & Private</h3>
            <p className="feature-desc">
              Your documents remain safe and confidential. We use bank-level
              encryption and never store your sensitive files without your
              consent.
            </p>
          </div>

          {/* New Features */}
          <div className="feature-card">
            <Smartphone className="feature-icon" />
            <h3 className="feature-title">Multi-Platform</h3>
            <p className="feature-desc">
              Access our platform with a simple tap – available on the web, iOS,
              and Android. Your legal insights stay with you wherever you go.
            </p>
          </div>

          <div className="feature-card">
            <CopyCheck className="feature-icon" />
            <h3 className="feature-title">Document Comparison</h3>
            <p className="feature-desc">
              Compare two documents instantly to spot differences in terms,
              clauses, and obligations. Perfect for reviewing contract
              revisions.
            </p>
          </div>

          <div className="feature-card">
            <Columns className="feature-icon" />
            <h3 className="feature-title">Side-by-Side Analysis</h3>
            <p className="feature-desc">
              Get highlighted sentence-by-sentence comparisons in a clean
              side-by-side view, making it easy to catch even subtle changes.
            </p>
          </div>

          <div className="feature-card">
            <Globe className="feature-icon" />
            <h3 className="feature-title">Internet-Powered Research</h3>
            <p className="feature-desc">
              Backed by real-time web intelligence, Clarity Legal completes hours
              of research in seconds, giving you instant context and supporting
              insights.
            </p>
          </div>
        </div>

        {/* ✅ Why Choose Section inside a tile */}
        <section className="why-better">
          <div className="feature-card intro-tile">
            <h2 className="intro-title">Why Choose Clarity Legal?</h2>
            <p className="intro-text">
              Our LegalTech software is designed to be{" "}
              <b>quick, easy, and wallet-friendly</b>, ensuring you get the most
              value without the hassle of expensive consultations or
              time-consuming processes.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <Clock className="feature-icon" />
              <h3 className="feature-title">Fast</h3>
              <p className="feature-desc">
                The fastest online lawyer service, helping you avoid unnecessary
                expenses and long appointments.
              </p>
            </div>

            <div className="feature-card">
              <Headset className="feature-icon" />
              <h3 className="feature-title">24/7 Support</h3>
              <p className="feature-desc">
                Our dedicated customer support team is always available to
                assist you with any questions about the platform.
              </p>
            </div>

            <div className="feature-card">
              <Timer className="feature-icon" />
              <h3 className="feature-title">5 Seconds</h3>
              <p className="feature-desc">
                Summarize any document in just 5 seconds—get the clarity you
                need instantly.
              </p>
            </div>

            <div className="feature-card">
              <Percent className="feature-icon" />
              <h3 className="feature-title">90% Cost Reduction</h3>
              <p className="feature-desc">
                Save up to 90% compared to traditional legal services while
                still receiving high-quality, AI-driven insights.
              </p>
            </div>

            {/* ✅ Extra Why Choose Tiles */}
            <div className="feature-card">
              <TrendingUp className="feature-icon" />
              <h3 className="feature-title">Scalable</h3>
              <p className="feature-desc">
                Whether for individuals or enterprises, Clarity Legal adapts to
                your growing legal needs seamlessly.
              </p>
            </div>

            <div className="feature-card">
              <Shield className="feature-icon" />
              <h3 className="feature-title">Trusted</h3>
              <p className="feature-desc">
                Built with reliability in mind, offering peace of mind for every
                user who values accuracy and safety.
              </p>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <h2 className="section-title">What Our Users Say</h2>
        <div className="reviews">
          {[
            {
              stars: 5,
              text: "This tool saved me hours reviewing contracts!",
              author: "Priya S.",
            },
            {
              stars: 4,
              text: "The explanations are so clear and simple.",
              author: "Rahul K.",
            },
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

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>
            © 2025 Clarity Legal |{" "}
            <span className="disclaimer">DISCLAIMER:</span> This tool provides
            general information only, not legal advice.
          </p>
          <div className="footer-buttons">
            <button className="footer-btn">Terms of Service</button>
            <button className="footer-btn">Privacy Policy</button>
            <button className="footer-btn">About</button>

            {/* ✅ Language Dropdown */}
            <div className="language-dropdown">
              <button
                className="footer-btn"
                onClick={() => setShowLangMenu(!showLangMenu)}
              >
                🌐 Language
              </button>
              {showLangMenu && (
                <ul className="language-menu">
                  <li> English </li>
                  <li> हिन्दी </li>
                  <li> Español </li>
                  <li> Français </li>
                  <li> Deutsch </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
