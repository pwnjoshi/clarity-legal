import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { Mail, Lock } from "lucide-react";
import "./login.css"; 
import { auth } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      if (isLogin) {
        // Login existing user
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Sign up new user
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate("/home"); // ✅ redirect to home
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <Lock size={24} />
          </div>
          <h1>{isLogin ? "Welcome Back" : "Create Account"}</h1>
          <p>{isLogin ? "Sign in to continue" : "Sign up to get started"}</p>
        </div>

        {/* Error Message */}
        {error && <div className="login-error">{error}</div>}

        {/* Google Login */}
        <button
          className="google-btn"
          disabled={loading}
          onClick={handleGoogleLogin}
        >
          <FcGoogle size={22} />{" "}
          {isLogin ? "Login with Google" : "Sign up with Google"}
        </button>

        {/* Divider */}
        <div className="divider">
          <span>or continue with</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="login-field">
              <label className="login-label">Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className="login-input"
                required
              />
            </div>
          )}

          <div className="login-field">
            <label className="login-label">Email</label>
            <div style={{ position: "relative" }}>
              <Mail
                size={18}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "0.75rem",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                }}
              />
              <input
                type="email"
                name="email"   // ✅ added name for access in handleSubmit
                placeholder="Enter your email"
                className="login-input"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "0.75rem",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                }}
              />
              <input
                type="password"
                name="password"   // ✅ added name
                placeholder="Enter your password"
                className="login-input"
                required
              />
            </div>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading
              ? isLogin
                ? "Logging in..."
                : "Signing up..."
              : isLogin
              ? "Login"
              : "Sign Up"}
          </button>
        </form>

        {/* Toggle link */}
        <div className="login-toggle">
          {isLogin ? (
            <>
              Don’t have an account?
              <button onClick={() => setIsLogin(false)}>Sign up</button>
            </>
          ) : (
            <>
              Already have an account?
              <button onClick={() => setIsLogin(true)}>Login</button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="login-footer">
          <a href="#">Forgot your password?</a>
        </div>
      </div>
    </div>
  );
}
