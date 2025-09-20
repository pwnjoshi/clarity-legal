import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import DocumentDisplay from '../components/DocumentDisplay';
import DocumentComparison from '../components/DocumentComparison';
import './DocumentViewer.css';
import { getApiUrl } from '../utils/apiUtils';

// --- Typing Effect Component for Research ---
const TypingResearchResult = ({ content, onComplete, renderContent }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    
    useEffect(() => {
        if (!content || content === displayedContent) {
            setIsTyping(false);
            onComplete?.();
            return;
        }
        
        const baseTypingSpeed = 8; // Fast typing for research
        let currentIndex = 0;
        
        const typeCharacter = () => {
            if (currentIndex < content.length) {
                const currentChar = content[currentIndex];
                let charsToAdd = 1;
                let speed = baseTypingSpeed;
                
                // Variable typing speed
                if (currentChar === ' ') {
                    speed = baseTypingSpeed * 0.3;
                    charsToAdd = Math.min(3, content.length - currentIndex);
                } else if (['.', ',', '!', '?', ':', ';'].includes(currentChar)) {
                    speed = baseTypingSpeed * 1.2;
                } else if (currentChar === '\n') {
                    speed = baseTypingSpeed * 1.5;
                }
                
                // Occasional faster bursts
                if (Math.random() > 0.7) {
                    charsToAdd = Math.min(4, content.length - currentIndex);
                    speed *= 0.4;
                }
                
                currentIndex += charsToAdd;
                setDisplayedContent(content.substring(0, currentIndex));
                
                if (currentIndex < content.length) {
                    setTimeout(typeCharacter, speed);
                } else {
                    setIsTyping(false);
                    onComplete?.();
                }
            }
        };
        
        const timer = setTimeout(typeCharacter, 30);
        return () => clearTimeout(timer);
    }, [content, displayedContent, onComplete]);
    
    return (
        <div className="research-result-text">
            {renderContent(displayedContent)}
            {isTyping && <span className="research-typing-cursor">█</span>}
        </div>
    );
};

// --- Child Component: Analysis Sidebar ---
const AnalysisSidebar = ({ analysis }) => (
    <aside className="viewer-sidebar analysis-sidebar">
        <div className="sidebar-sticky-content">
            <div className="sidebar-card">
                <div className="card-header"><h3>✨ Summary</h3></div>
                <div className="card-content">
                    {analysis?.simplifiedText ? (
                        <p className="summary-text">{analysis.simplifiedText}</p>
                    ) : (
                        <p className="placeholder-text">No summary available.</p>
                    )}
                </div>
            </div>
            {analysis?.clauses?.length > 0 && (
                <div className="sidebar-card">
                    <div className="card-header">
                        <h3>🔑 Key Points</h3>
                        <span className="card-badge">{analysis.clauses.length}</span>
                    </div>
                    <div className="card-content">
                        <div className="key-points-list">
                            {analysis.clauses.map((clause, index) => (
                                <div key={index} className={`key-point ${clause.importance}`}>
                                    <div className="point-header">
                                        <span className="point-title">{clause.title}</span>
                                        <span className={`importance-tag ${clause.importance}`}>{clause.importance}</span>
                                    </div>
                                    <p className="point-description">{clause.explanation}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </aside>
);

// --- Child Component: AI Tools Sidebar ---
const AITools = ({ document, onShowComparison }) => {
    const [currentTool, setCurrentTool] = useState('chat');
    const [chatMessages, setChatMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [researchQuery, setResearchQuery] = useState('');
    const [researchResults, setResearchResults] = useState([]);
    const [isResearching, setIsResearching] = useState(false);
    const [typingResultId, setTypingResultId] = useState(null);
    const [comparisonFile, setComparisonFile] = useState(null);
    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);
    const researchEndRef = useRef(null);
    const researchInputRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isTyping]);
    
    // Auto scroll for research results
    useEffect(() => {
        researchEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [researchResults, isResearching]);
    
    // Initialize research with welcome message
    useEffect(() => {
        setResearchResults([{
            id: 'welcome',
            type: 'welcome',
            content: `🔍 **Legal Research Assistant**

I can help you research:

📚 **Legal Precedents** - Find relevant case law and court decisions
📖 **Statutory Analysis** - Research laws and regulations  
🏛️ **Jurisprudence** - Explore legal principles and doctrines
📝 **Legal Concepts** - Deep-dive into complex legal terms

**Popular Searches:**
• Force Majeure clauses
• Intellectual Property disputes
• Contract termination rights
• Liability limitations
• Non-compete enforceability

*Enter any legal term or concept to begin your research...*`,
            timestamp: new Date(),
            isWelcome: true
        }]);
    }, []);

    const handleSendMessage = async () => {
        if (!currentMessage.trim()) return;
        
        const userMessage = { 
            sender: 'user', 
            text: currentMessage.trim(),
            timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, userMessage]);
        setCurrentMessage('');
        setIsTyping(true);
        
        try {
            const response = await fetch(getApiUrl('/ai/chat'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: currentMessage.trim(),
                    sessionId: 'viewer_session_' + Date.now(),
                    documentContext: {
                        text: document?.extractedText || '',
                        highlights: document?.analysis?.highlightedSections || []
                    },
                    analysisType: 'general'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                const aiMessage = {
                    sender: 'ai',
                    text: data.response,
                    timestamp: new Date(),
                    disclaimer: data.disclaimer
                };
                setChatMessages(prev => [...prev, aiMessage]);
            } else {
                throw new Error('Failed to get AI response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                sender: 'ai',
                text: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
                isError: true
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };
    
    const handleResearch = async () => {
        if (!researchQuery.trim() || isResearching) return;
        
        const searchEntry = {
            id: `search_${Date.now()}`,
            type: 'query',
            content: researchQuery.trim(),
            timestamp: new Date()
        };
        
        setResearchResults(prev => [...prev, searchEntry]);
        setResearchQuery('');
        setIsResearching(true);
        
        try {
            // Try backend API first, fall back to mock results
            let resultContent;
            
            try {
                const response = await fetch(getApiUrl('/research/search'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: searchEntry.content,
                        sessionId: 'research_session_' + Date.now(),
                        searchType: 'comprehensive'
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    resultContent = data.results;
                } else {
                    throw new Error('API not available');
                }
            } catch (apiError) {
                // Fallback to mock results
                resultContent = generateMockResearchResults(searchEntry.content);
            }
            
            const resultEntry = {
                id: `result_${Date.now()}`,
                type: 'result',
                content: resultContent,
                timestamp: new Date(),
                query: searchEntry.content,
                isTyping: true
            };
            
            setResearchResults(prev => [...prev, resultEntry]);
            setTypingResultId(resultEntry.id);
            
        } catch (error) {
            console.error('Research error:', error);
            const errorResult = {
                id: `error_${Date.now()}`,
                type: 'error',
                content: `⚠️ **Research Error**\n\nUnable to complete your search at the moment. Please try rephrasing your query or try again.\n\n*Tip: Be specific about the legal concept you want to research (e.g., "contract breach remedies", "copyright fair use doctrine")*`,
                timestamp: new Date()
            };
            setResearchResults(prev => [...prev, errorResult]);
        } finally {
            setIsResearching(false);
            // Auto-focus input after research completes
            setTimeout(() => researchInputRef.current?.focus(), 200);
        }
    };
    
    const handleTypingComplete = (resultId) => {
        setTypingResultId(null);
        setResearchResults(prev => prev.map(result => 
            result.id === resultId ? { ...result, isTyping: false } : result
        ));
        // Focus input after typing completes
        setTimeout(() => researchInputRef.current?.focus(), 300);
    };
    
    const clearResearchHistory = () => {
        setResearchResults([{
            id: 'welcome_new',
            type: 'welcome',
            content: '🔄 **Research cleared!** Start a new legal research session.',
            timestamp: new Date(),
            isWelcome: true
        }]);
    };
    
    const generateMockResearchResults = (query) => {
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('force majeure')) {
            return `📚 **Force Majeure Clause Research Results**

**Key Legal Definition:**
Force Majeure refers to unforeseeable circumstances that prevent a party from fulfilling a contract. Courts generally require three elements: the event must be unforeseeable, unavoidable, and beyond the control of the contracting party.

**📖 Leading Precedents:**

🏛️ **Kel Kim Corp v. Central Markets, Inc.** (1987)
Court held that force majeure clauses are narrowly construed. Events must be specifically listed or fall within the general categories mentioned.

🏛️ **Phibro Energy Inc. v. Empresa De Polimeros De Sines** (2002)  
Established that economic hardship alone does not constitute force majeure unless specifically included in the clause.

**⚖️ Current Legal Trends:**
• COVID-19 pandemic has led to increased litigation over force majeure interpretations
• Courts increasingly require specific language mentioning pandemics or government actions
• Material adverse change clauses being distinguished from force majeure

**💼 Practical Applications:**
• Include specific examples (pandemics, government orders, natural disasters)
• Define what constitutes "prevention" vs. "material impediment"  
• Specify notification requirements and mitigation obligations
• Consider carve-outs for payment obligations`;
        }
        
        if (lowerQuery.includes('intellectual property') || lowerQuery.includes('copyright') || lowerQuery.includes('patent')) {
            return `🏛️ **Intellectual Property Research Results**

**🔍 Legal Framework:**
Intellectual Property encompasses copyrights, patents, trademarks, and trade secrets. Each has distinct protection requirements, duration, and enforcement mechanisms.

**📖 Landmark Cases:**

⚖️ **Diamond v. Chakrabarty** (1980)
Supreme Court ruling that genetically modified organisms can be patented, establishing broad patentability standards.

⚖️ **Sony Corp. v. Universal City Studios** (1984)
"Betamax Case" - Established substantial non-infringing use defense for technology providers.

**📊 Recent Developments:**
• DMCA safe harbor provisions increasingly scrutinized
• AI-generated content challenging traditional authorship concepts  
• Trade secret protection gaining prominence in tech sector
• Fair use doctrine expanding for transformative works

**💡 Strategic Considerations:**
• File provisional patents early to establish priority dates
• Register trademarks in relevant classifications and jurisdictions
• Implement robust trade secret protection protocols
• Consider defensive patent portfolios in competitive markets`;
        }
        
        // Generic legal research result
        return `🔍 **Research Results: "${query}"**

**📚 Legal Overview:**
Comprehensive analysis of ${query} reveals several key considerations for legal practitioners and businesses.

**⚖️ Relevant Legal Standards:**
• Courts apply a fact-specific analysis to determine applicability
• Jurisdiction-specific variations may apply
• Recent regulatory changes have impacted interpretation

**📖 Key Precedents:**
• Multiple circuit court decisions have addressed this issue
• Supreme Court has provided general guidance on related matters
• State courts show varying approaches to enforcement

**💼 Practical Applications:**
• Draft clauses with specific, unambiguous language
• Consider jurisdiction-specific requirements
• Include appropriate dispute resolution mechanisms
• Regular review and updates recommended

*For detailed case citations and specific legal advice, consult with qualified legal counsel.*`;
    };
    
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setComparisonFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setComparisonFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };
    
    const renderMessageContent = (content) => {
        if (!content) return '';
        
        // Split content into lines and process each one for better formatting
        const lines = content.split('\n');
        const elements = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (!line.trim()) {
                elements.push(<br key={`br-${i}`} />);
                continue;
            }
            
            // Headers (lines starting with ** and ending with **)
            if (line.match(/^\*\*.*\*\*:?$/)) {
                elements.push(
                    <strong key={`header-${i}`} className="chat-header">
                        {line.replace(/\*\*/g, '')}
                    </strong>
                );
            }
            // Bullet points (lines starting with - or •)
            else if (line.match(/^[-•]\s+/)) {
                elements.push(
                    <div key={`bullet-${i}`} className="chat-bullet">
                        • {line.replace(/^[-•]\s+/, '')}
                    </div>
                );
            }
            // Numbered lists (lines starting with numbers)
            else if (line.match(/^\d+\.\s+/)) {
                elements.push(
                    <div key={`number-${i}`} className="chat-number">
                        {line}
                    </div>
                );
            }
            // Regular paragraphs
            else {
                elements.push(
                    <div key={`para-${i}`} className="chat-paragraph">
                        {line}
                    </div>
                );
            }
        }
        
        return elements;
    };

    const renderToolContent = () => {
        switch (currentTool) {
            case 'chat':
                return (
                    <div className="tool-panel chat-panel">
                        <div className="chat-messages">
                            {chatMessages.length === 0 ? (
                                <div className="chat-welcome">
                                    <h4>ClarityLegal AI Assistant</h4>
                                    <p>I'm your professional legal document analyst. Ask me about clauses, risks, compliance issues, or negotiation strategies for this document.</p>
                                    <div className="suggested-questions">
                                        <button onClick={() => setCurrentMessage('What are the main risks in this document?')}>"What are the main risks?"</button>
                                        <button onClick={() => setCurrentMessage('Explain the key clauses in plain English.')}>"Explain key clauses"</button>
                                        <button onClick={() => setCurrentMessage('Are there any compliance issues I should know about?')}>"Check compliance"</button>
                                        <button onClick={() => setCurrentMessage('What should I negotiate in this contract?')}>"Negotiation advice"</button>
                                    </div>
                                </div>
                            ) : (
                                chatMessages.map((msg, index) => (
                                    <div key={index} className={`message-bubble ${msg.sender} ${msg.isError ? 'error' : ''}`}>
                                        <div className="message-text">
                                            {renderMessageContent(msg.text)}
                                        </div>
                                        {msg.timestamp && (
                                            <div className="message-time">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        )}
                                        {msg.disclaimer && (
                                            <div className="message-disclaimer">
                                                ⚖️ <small>{msg.disclaimer}</small>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                            {isTyping && (
                                <div className="message-bubble ai"><div className="typing-indicator"><span /><span /><span /></div></div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="chat-input-area">
                            <input
                                type="text"
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask a question..."
                                className="chat-input"
                            />
                            <button onClick={handleSendMessage} className="send-button" disabled={!currentMessage.trim()}>➜</button>
                        </div>
                    </div>
                );
            case 'compare':
                return (
                    <div className="tool-panel compare-panel">
                        <div className="tool-content-area">
                            <h4>Document Comparison</h4>
                            <p>Compare documents side-by-side with AI-powered analysis</p>
                            
                            <div className="comparison-features">
                                <div className="feature-list">
                                    <div className="feature-item">
                                        <span className="feature-icon">🔍</span>
                                        <span>Change detection</span>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">⚖️</span>
                                        <span>Legal impact analysis</span>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">📈</span>
                                        <span>Visual highlighting</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                className="action-button primary comparison-launch-btn"
                                onClick={onShowComparison}
                            >
                                Compare Documents
                            </button>
                        </div>
                    </div>
                );
            case 'research':
                return (
                    <div className="tool-panel research-panel">
                        <div className="research-header">
                            <div className="research-title">
                                <div className="research-icon">🔍</div>
                                <div className="title-info">
                                    <h4>Legal Research</h4>
                                    <span className="subtitle">AI-Powered Legal Intelligence</span>
                                </div>
                            </div>
                            <div className="research-controls">
                                <button 
                                    className="clear-research-btn"
                                    onClick={clearResearchHistory}
                                    title="Clear research history"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                        
                        <div className="research-results">
                            {researchResults.map((result) => (
                                <div key={result.id} className={`research-item ${result.type}`}>
                                    <div className="result-avatar">
                                        {result.type === 'query' ? '👤' : '🔍'}
                                    </div>
                                    <div className="result-content">
                                        {result.type === 'result' && result.isTyping ? (
                                            <TypingResearchResult 
                                                content={result.content} 
                                                onComplete={() => handleTypingComplete(result.id)}
                                                renderContent={renderMessageContent}
                                            />
                                        ) : (
                                            <div className="research-result-text">
                                                {renderMessageContent(result.content)}
                                            </div>
                                        )}
                                        <div className="result-meta">
                                            <span className="result-time">
                                                {new Date(result.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                            {result.type === 'result' && (
                                                <span className="research-badge">Legal Research</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {isResearching && (
                                <div className="research-item loading">
                                    <div className="result-avatar">🔍</div>
                                    <div className="result-content">
                                        <div className="research-loading">
                                            <div className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                            <div className="loading-text">Researching legal precedents...</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div ref={researchEndRef} />
                        </div>
                        
                        {researchResults.length <= 1 && (
                            <div className="quick-research-suggestions">
                                <div className="suggestions-label">Popular searches:</div>
                                <div className="suggestion-buttons">
                                    {['Force Majeure clause', 'Intellectual Property', 'Contract breach'].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            className="suggestion-btn"
                                            onClick={() => {
                                                setResearchQuery(suggestion);
                                                setTimeout(() => handleResearch(), 100);
                                            }}
                                            disabled={isResearching}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="research-input-area">
                            <div className="input-container">
                                <input 
                                    ref={researchInputRef}
                                    type="text" 
                                    placeholder="Search legal concepts..."
                                    className="research-input"
                                    value={researchQuery}
                                    onChange={(e) => setResearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
                                    disabled={isResearching}
                                />
                                <button 
                                    className="research-submit-btn" 
                                    onClick={handleResearch}
                                    disabled={!researchQuery.trim() || isResearching}
                                    title="Research legal concept"
                                >
                                    {isResearching ? '⏳' : '🔍'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };
    
    return (
        <aside className="viewer-sidebar tools-sidebar">
            <div className="sidebar-sticky-content">
                <div className="tool-tabs">
                    <button onClick={() => setCurrentTool('chat')} className={currentTool === 'chat' ? 'active' : ''}>💬 AI Chat</button>
                    <button onClick={() => setCurrentTool('compare')} className={currentTool === 'compare' ? 'active' : ''}>📈 Compare</button>
                    <button onClick={() => setCurrentTool('research')} className={currentTool === 'research' ? 'active' : ''}>🔍 Research</button>
                </div>
                {renderToolContent()}
            </div>
        </aside>
    );
};

// Import our RawTextDisplay component
import RawTextDisplay from '../components/RawTextDisplay';

// --- Main Document Viewer Component ---
export default function DocumentViewer() {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showComparison, setShowComparison] = useState(false);
    const [showRawText, setShowRawText] = useState(false);

    useEffect(() => {
        const loadDocument = async () => {
            try {
                setLoading(true);
                
                // Check sessionStorage first
                const processedDoc = sessionStorage.getItem('processedDocument');
                if (processedDoc) {
                    try {
                        const parsed = JSON.parse(processedDoc);
                        setDocument({
                            id: documentId,
                            originalName: parsed.document?.originalName || 'Document.pdf',
                            extractedText: parsed.extractedText || '',
                            // Add path and size for DocumentComparison component
                            path: parsed.document?.path || null,
                            size: parsed.document?.size || 0,
                            analysis: {
                                simplifiedText: parsed.simplifiedText || '',
                                riskAnalysis: parsed.riskAnalysis || { overallRisk: 'unknown' },
                                highlightedSections: parsed.highlightedSections || [],
                                clauses: parsed.clauses || []
                            }
                        });
                        sessionStorage.removeItem('processedDocument');
                        setLoading(false);
                        return;
                    } catch (e) {
                        console.warn('Failed to parse sessionStorage document');
                    }
                }
                
                // Try Firebase
                try {
                    const docRef = doc(db, 'documents', documentId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const docData = docSnap.data();
                        setDocument({ 
                            id: docSnap.id, 
                            ...docData,
                            // Ensure path and size are included for comparison
                            path: docData.path || null,
                            size: docData.size || 0
                        });
                        setLoading(false);
                        return;
                    }
                } catch (fbError) {
                    console.warn('Firebase error, using mock data');
                }
                
                // Fallback mock data
                const mockText = `FAKE LEGAL DOCUMENT FOR TESTING PURPOSES ONLY

Clause 1: The Party of the First Part (hereinafter referred to as 'Alpha') shall indemnify and hold harmless the Party of the Second Part (hereinafter referred to as 'Beta') from and against any and all liabilities, claims, demands, actions, causes of action, losses, damages, costs, and expenses (including reasonable attorney fees) which may arise, directly or indirectly, from the execution of this Agreement.

Clause 2: Beta acknowledges and agrees that Alpha shall retain exclusive rights to any and all intellectual property, whether registered, unregistered, pending, or abandoned, arising from or in connection with the contractual relationship hereby established.

Clause 3: In the event of a Force Majeure, including but not limited to acts of God, natural disasters, strikes, government actions, embargoes, or pandemics, neither party shall be held liable for failure to perform its obligations under this Agreement. The affected party shall notify the other party within seven (7) business days of the occurrence.

Clause 4: Any disputes arising out of or relating to this Agreement shall be subject to binding arbitration conducted under the rules of the International Arbitration Tribunal. The venue for arbitration shall be New Delhi, India, and the language of arbitration shall be English.

Signed by: _______________________
Party of the First Part (Alpha)

Signed by: _______________________
Party of the Second Part (Beta)`;
                
                setDocument({
                    id: documentId,
                    originalName: 'Sample Legal Agreement.pdf',
                    extractedText: mockText,
                    // Add mock path and size for testing
                    path: '/mock/sample-legal-agreement.pdf',
                    size: mockText.length, // Use text length as approximate file size
                    analysis: {
                        simplifiedText: "This legal agreement includes indemnification clauses, IP rights retention, force majeure provisions, and arbitration requirements. Key risks include broad indemnification exposure.",
                        riskAnalysis: { overallRisk: "medium" },
                        highlightedSections: [
                            {
                                text: "shall indemnify and hold harmless",
                                type: "risk",
                                severity: "high",
                                explanation: "Broad indemnification clause creates significant financial exposure."
                            },
                            {
                                text: "exclusive rights to any and all intellectual property",
                                type: "right",
                                severity: "medium",
                                explanation: "Alpha retains all IP rights, limiting Beta's usage."
                            },
                            {
                                text: "binding arbitration",
                                type: "obligation",
                                severity: "medium",
                                explanation: "Disputes must be resolved through arbitration."
                            }
                        ],
                        clauses: [
                            {
                                title: "Indemnification",
                                importance: "high",
                                explanation: "Alpha covers all liabilities for Beta, creating financial exposure."
                            },
                            {
                                title: "IP Rights",
                                importance: "high",
                                explanation: "Alpha retains exclusive ownership of all intellectual property."
                            },
                            {
                                title: "Dispute Resolution",
                                importance: "medium",
                                explanation: "All disputes resolved through arbitration in New Delhi."
                            }
                        ]
                    }
                });
                
            } catch (err) {
                console.error('Error loading document:', err);
                setError('Failed to load document.');
            } finally {
                setLoading(false);
            }
        };
        
        loadDocument();
    }, [documentId]);
    
    if (loading) return <div className="viewer-status-page">🔄 Loading document...</div>;
    if (error || !document) {
        return (
            <div className="viewer-status-page">
                <h2>❌ Error</h2>
                <p>{error || 'Document not found.'}</p>
                <button onClick={() => navigate('/dashboard')} className="back-button">← Back to Dashboard</button>
            </div>
        );
    }

    const { originalName, extractedText, analysis } = document;
    const overallRisk = analysis?.riskAnalysis?.overallRisk || 'unknown';

    return (
        <div className="document-viewer-container">
            <header className="viewer-header">
                <button onClick={() => navigate('/dashboard')} className="back-button">← Dashboard</button>
                <h1 className="document-title" title={originalName}>{originalName}</h1>
                <div className={`risk-indicator ${overallRisk}`}>
                    Overall Risk: <span className="risk-text">{overallRisk}</span>
                </div>
            </header>
            
            <PanelGroup direction="horizontal" className="resizable-panel-group">
                <Panel defaultSize={25} minSize={20} collapsible={true}>
                    <AnalysisSidebar analysis={analysis} />
                </Panel>
                
                <PanelResizeHandle />
                
                <Panel defaultSize={45} minSize={30}>
                    <main className="document-main-content">
                        {/* Text view toggle with enhanced UI */}
                        <div className="view-toggle">
                            <button 
                                className={`toggle-btn ${!showRawText ? 'active' : ''}`}
                                onClick={() => setShowRawText(false)}
                                title="Switch to formatted document view with paragraph formatting and highlights"
                            >
                                <span role="img" aria-label="Format"></span> Formatted View
                                <div className="toggle-btn-tooltip">Enhanced document formatting</div>
                            </button>
                            <button 
                                className={`toggle-btn ${showRawText ? 'active' : ''}`}
                                onClick={() => setShowRawText(true)}
                                title="Switch to raw text view with line numbers and search functionality"
                            >
                                <span role="img" aria-label="Code"></span> Raw Text View
                                <div className="toggle-btn-tooltip">Line numbers and search</div>
                            </button>
                        </div>
                        
                        {/* Either show the formatted DocumentDisplay or the enhanced RawTextDisplay */}
                        {showRawText ? (
                            <RawTextDisplay text={extractedText} />
                        ) : (
                            <DocumentDisplay 
                                text={extractedText} 
                                highlights={analysis?.highlightedSections || []} 
                                title={originalName}
                            />
                        )}
                    </main>
                </Panel>

                <PanelResizeHandle />
                
                <Panel defaultSize={30} minSize={25} collapsible={true}>
                    <AITools 
                        document={document} 
                        onShowComparison={() => {
                            // Debug log the document before passing to comparison
                            console.log('📄 DocumentViewer - About to show comparison with document:', {
                                id: document?.id,
                                originalName: document?.originalName,
                                hasPath: !!document?.path,
                                path: document?.path,
                                size: document?.size,
                                sizeKB: document?.size ? Math.round(document.size / 1024) : 0,
                                keys: Object.keys(document || {})
                            });
                            setShowComparison(true);
                        }}
                    />
                </Panel>
            </PanelGroup>
            
            {/* Document Comparison Modal */}
            {showComparison && (
                <DocumentComparison 
                    originalDocument={document}
                    onClose={() => setShowComparison(false)}
                />
            )}
        </div>
    );
}
