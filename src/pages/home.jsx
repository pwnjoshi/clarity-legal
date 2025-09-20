import React, { useState, useEffect } from "react";
import {
    Star, FileText, Zap, Shield, Smartphone, CopyCheck, Columns, Globe,
    Clock, Headset, Timer, Percent, BookOpen, Users, Lightbulb, TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "./home.css";

export default function Home() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        document.body.classList.add("home-page");
        return () => {
            document.body.classList.remove("home-page");
        };
    }, []);

    const handleTryForFree = () => {
        navigate(isLoggedIn ? "/dashboard" : "/login");
    };



    return (
        <div className="dark-container">
            <Header />

            <main className="home-main">
                <section className="hero-section">
                    <div className="container">
                        <h1 className="heading">Welcome to Clarity Legal</h1>
                        <p className="description">
                            Your AI-powered <span className="highlight">Legal Document Decoder</span>. We simplify complex legal jargon into clear language, so you always know what you’re signing.
                        </p>
                        <button className="try-btn" onClick={handleTryForFree}>
                            ✨ Try for Free
                        </button>
                    </div>
                </section>

                <section className="intro-section">
                    <div className="container">
                        <div className="feature-card intro-tile">
                            <h2 className="intro-title">Why Clarity Legal Matters</h2>
                            <p className="intro-text">
                                We translate dense legal documents into simple, actionable insights. Whether you’re a student, professional, or business owner, our tool saves time, prevents costly mistakes, and empowers you to make confident, informed decisions without needing a law degree.
                            </p>
                        </div>
                        <div className="features-grid">
                            <div className="feature-card">
                                <BookOpen className="feature-icon" />
                                <h3 className="feature-title">Simplified Learning</h3>
                                <p className="feature-desc">Understand contracts and agreements in plain language—no legal background needed.</p>
                            </div>
                            <div className="feature-card">
                                <Users className="feature-icon" />
                                <h3 className="feature-title">For Everyone</h3>
                                <p className="feature-desc">Whether you’re a student, freelancer, or business owner, Clarity Legal makes law accessible.</p>
                            </div>
                            <div className="feature-card">
                                <Lightbulb className="feature-icon" />
                                <h3 className="feature-title">Informed Decisions</h3>
                                <p className="feature-desc">By clarifying obligations and rights, you can make smarter, well-informed choices confidently.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="features-section">
                    <div className="container">
                        <h2 className="section-title">A Powerful Feature Set</h2>
                        <div className="features-grid">
                            <div className="feature-card">
                                <FileText className="feature-icon" /><h3 className="feature-title">Document Upload</h3>
                                <p className="feature-desc">Upload any legal PDF and our AI gets to work, extracting key information instantly.</p>
                            </div>
                            <div className="feature-card">
                                <Zap className="feature-icon" /><h3 className="feature-title">Instant Summaries</h3>
                                <p className="feature-desc">Get concise, easy-to-understand summaries in seconds. No more decoding jargon.</p>
                            </div>
                            <div className="feature-card">
                                <Shield className="feature-icon" /><h3 className="feature-title">Secure & Private</h3>
                                <p className="feature-desc">Your documents are protected with bank-level encryption and are never stored without consent.</p>
                            </div>
                            <div className="feature-card">
                                <CopyCheck className="feature-icon" /><h3 className="feature-title">Document Comparison</h3>
                                <p className="feature-desc">Instantly spot differences in terms, clauses, and obligations between two documents.</p>
                            </div>
                            <div className="feature-card">
                                <Columns className="feature-icon" /><h3 className="feature-title">Side-by-Side Analysis</h3>
                                <p className="feature-desc">Review highlighted, sentence-by-sentence comparisons in a clean, easy-to-read view.</p>
                            </div>
                            <div className="feature-card">
                                <Globe className="feature-icon" /><h3 className="feature-title">Internet-Powered Research</h3>
                                <p className="feature-desc">Our AI performs hours of research in seconds, giving you instant context and supporting insights.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="why-choose-section">
                    <div className="container">
                        <div className="value-prop-card">
                            <h2 className="section-subtitle">Why Choose Clarity Legal?</h2>
                            <p className="value-prop-text">
                                Our LegalTech software is <b>quick, easy, and wallet-friendly</b>, giving you maximum value without the hassle of expensive consultations.
                            </p>
                        </div>
                        <div className="features-grid">
                           <div className="feature-card">
                                <Clock className="feature-icon" /><h3 className="feature-title">Fast</h3>
                                <p className="feature-desc">The fastest online legal service, helping you avoid unnecessary expenses and long appointments.</p>
                            </div>
                            <div className="feature-card">
                                <Headset className="feature-icon" /><h3 className="feature-title">24/7 Support</h3>
                                <p className="feature-desc">Our dedicated customer support team is always available to assist you with any platform questions.</p>
                            </div>
                            <div className="feature-card">
                                <Timer className="feature-icon" /><h3 className="feature-title">5 Seconds</h3>
                                <p className="feature-desc">Summarize any document in just 5 seconds—get the clarity you need instantly.</p>
                            </div>
                            <div className="feature-card">
                                <Percent className="feature-icon" /><h3 className="feature-title">90% Cost Reduction</h3>
                                <p className="feature-desc">Save up to 90% compared to traditional legal services while getting high-quality, AI-driven insights.</p>
                            </div>
                             <div className="feature-card">
                                <TrendingUp className="feature-icon" /><h3 className="feature-title">Scalable</h3>
                                <p className="feature-desc">Whether for individuals or enterprises, Clarity Legal adapts to your growing legal needs seamlessly.</p>
                            </div>
                            <div className="feature-card">
                                <Shield className="feature-icon" /><h3 className="feature-title">Trusted</h3>
                                <p className="feature-desc">Built with reliability in mind, offering peace of mind for every user who values accuracy and safety.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="reviews-section">
                    <div className="container">
                        <h2 className="section-title">What Our Users Say</h2>
                        <div className="reviews-grid">
                            {[
                                { stars: 5, text: "This tool saved me hours reviewing contracts!", author: "Priya S." },
                                { stars: 4, text: "The explanations are so clear and simple.", author: "Rahul K." },
                                { stars: 5, text: "A must-have for any freelancer or small business owner.", author: "Amit R." },
                            ].map((r, i) => (
                                <div key={i} className="review-card">
                                    <div className="stars">{[...Array(r.stars)].map((_, j) => (<Star key={j} className="star-icon" />))}</div>
                                    <p className="review-text">"{r.text}"</p>
                                    <p className="review-author">– {r.author}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}