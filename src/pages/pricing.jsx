import React, { useEffect } from "react";
import { Check, X, Star, Zap, Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "./pricing.css";

export default function Pricing() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        document.body.classList.add("pricing-page");
        return () => {
            document.body.classList.remove("pricing-page");
        };
    }, []);

    const handleGetStarted = (plan) => {
        if (isLoggedIn) {
            navigate("/dashboard");
        } else {
            navigate("/login");
        }
    };

    const plans = [
        {
            name: "Starter",
            price: "Free",
            period: "Forever",
            description: "Perfect for trying out Clarity Legal",
            icon: <Sparkles className="plan-icon" />,
            features: [
                "5 document summaries per month",
                "Basic AI analysis",
                "Standard processing speed",
                "Email support",
                "Document upload up to 10MB"
            ],
            limitations: [
                "No document comparison",
                "No AI research features",
                "Limited chat history"
            ],
            popular: false,
            buttonText: "Get Started Free",
            buttonClass: "btn-outline",
            discount: null
        },
        {
            name: "Professional",
            price: "₹299",
            originalPrice: "₹399",
            period: "per month",
            weeklyPrice: "₹99",
            description: "Ideal for professionals and small businesses",
            icon: <Zap className="plan-icon" />,
            features: [
                "Unlimited document summaries",
                "Advanced AI analysis",
                "Document comparison tools",
                "AI research capabilities",
                "Priority processing",
                "24/7 chat support",
                "Document upload up to 50MB",
                "Export reports to PDF",
                "Advanced chat history"
            ],
            limitations: [],
            popular: true,
            buttonText: "Start Professional",
            buttonClass: "btn-primary",
            discount: "25% OFF"
        },
        {
            name: "Enterprise",
            price: "₹1,999",
            originalPrice: "₹2,499",
            period: "per month",
            weeklyPrice: "₹599",
            description: "For teams and large organizations",
            icon: <Crown className="plan-icon" />,
            features: [
                "Everything in Professional",
                "Team collaboration tools",
                "Custom AI training",
                "API access",
                "Dedicated account manager",
                "Custom integrations",
                "Document upload up to 500MB",
                "Advanced analytics",
                "White-label options",
                "SLA guarantees"
            ],
            limitations: [],
            popular: false,
            buttonText: "Contact Sales",
            buttonClass: "btn-enterprise",
            discount: "20% OFF"
        }
    ];

    return (
        <div className="dark-container">
            <Header />

            <main className="pricing-main">
                <section className="pricing-hero">
                    <div className="container">
                        <h1 className="pricing-heading">Simple, Transparent Pricing</h1>
                        <p className="pricing-description">
                            Choose the perfect plan for your legal document needs. 
                            <span className="highlight">Start free</span> and upgrade as you grow.
                        </p>
                    </div>
                </section>

                <section className="plans-section">
                    <div className="container">
                        <div className="plans-grid">
                            {plans.map((plan, index) => (
                                <div 
                                    key={index} 
                                    className={`plan-card ${plan.popular ? 'popular' : ''}`}
                                >
                                    {plan.popular && (
                                        <div className="popular-badge">
                                            <Star className="badge-icon" />
                                            Most Popular
                                        </div>
                                    )}
                                    
                                    {plan.discount && (
                                        <div className="discount-badge">
                                            {plan.discount}
                                        </div>
                                    )}
                                    
                                    <div className="plan-header">
                                        {plan.icon}
                                        <h3 className="plan-name">{plan.name}</h3>
                                        <div className="plan-pricing">
                                            {plan.originalPrice && (
                                                <span className="original-price">{plan.originalPrice}</span>
                                            )}
                                            <span className="plan-price">{plan.price}</span>
                                            <span className="plan-period">/{plan.period}</span>
                                            {plan.weeklyPrice && (
                                                <div className="weekly-pricing">
                                                    <span className="weekly-price">{plan.weeklyPrice}/week</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="plan-description">{plan.description}</p>
                                    </div>

                                    <div className="plan-features">
                                        <h4 className="features-title">What's included:</h4>
                                        <ul className="features-list">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="feature-item">
                                                    <Check className="feature-check" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        
                                        {plan.limitations.length > 0 && (
                                            <ul className="limitations-list">
                                                {plan.limitations.map((limitation, i) => (
                                                    <li key={i} className="limitation-item">
                                                        <X className="limitation-x" />
                                                        <span>{limitation}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <button 
                                        className={`plan-button ${plan.buttonClass}`}
                                        onClick={() => handleGetStarted(plan.name)}
                                    >
                                        {plan.buttonText}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="faq-section">
                    <div className="container">
                        <h2 className="section-title">Frequently Asked Questions</h2>
                        <div className="faq-grid">
                            <div className="faq-item">
                                <h3 className="faq-question">How accurate is the AI analysis?</h3>
                                <p className="faq-answer">Our AI achieves 95%+ accuracy in document analysis, trained on millions of legal documents with continuous improvements.</p>
                            </div>
                            <div className="faq-item">
                                <h3 className="faq-question">Can I pay weekly instead of monthly?</h3>
                                <p className="faq-answer">Yes! We offer flexible weekly payment options to make our service more accessible. Choose what works best for your budget.</p>
                            </div>
                            <div className="faq-item">
                                <h3 className="faq-question">Do you accept UPI and Indian payment methods?</h3>
                                <p className="faq-answer">Yes! We accept UPI, net banking, credit/debit cards, and all major Indian payment methods for your convenience.</p>
                            </div>
                            <div className="faq-item">
                                <h3 className="faq-question">Is my data secure?</h3>
                                <p className="faq-answer">Absolutely. We use bank-level encryption and never store your documents without explicit consent. All data is processed securely.</p>
                            </div>
                            <div className="faq-item">
                                <h3 className="faq-question">Can I cancel anytime?</h3>
                                <p className="faq-answer">Yes! Cancel your subscription anytime with no hidden fees or commitments. Your account remains active until the end of your billing period.</p>
                            </div>
                            <div className="faq-item">
                                <h3 className="faq-question">What file formats are supported?</h3>
                                <p className="faq-answer">We support PDF, DOC, DOCX, and TXT files. More formats are coming soon based on user feedback.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
