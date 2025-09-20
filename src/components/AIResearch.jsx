import React, { useState, useRef, useEffect } from 'react';
import './AIResearch.css';
import { getApiUrl } from '../utils/apiUtils';

// Typing effect component for research results
const TypingResearchResult = ({ content, onComplete }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    
    useEffect(() => {
        if (!content || content === displayedContent) {
            setIsTyping(false);
            onComplete?.();
            return;
        }
        
        const baseTypingSpeed = 8; // Faster for research results
        let currentIndex = 0;
        
        const typeCharacter = () => {
            if (currentIndex < content.length) {
                const currentChar = content[currentIndex];
                let charsToAdd = 1;
                let speed = baseTypingSpeed;
                
                // Type faster for certain characters
                if (currentChar === ' ') {
                    speed = baseTypingSpeed * 0.2;
                    charsToAdd = Math.min(3, content.length - currentIndex);
                } else if (['.', ',', '!', '?', ':', ';'].includes(currentChar)) {
                    speed = baseTypingSpeed * 1.3;
                } else if (currentChar === '\n') {
                    speed = baseTypingSpeed * 1.8;
                }
                
                // Faster typing bursts for research data
                if (Math.random() > 0.6) {
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
            {formatResearchContent(displayedContent)}
            {isTyping && <span className="research-typing-cursor">█</span>}
        </div>
    );
};

const AIResearch = ({ isOpen, onToggle }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [sessionId, setSessionId] = useState('');
    const [typingResultId, setTypingResultId] = useState(null);
    const resultsEndRef = useRef(null);
    const inputRef = useRef(null);
    
    // Generate session ID on mount
    useEffect(() => {
        const newSessionId = `research_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        
        // Welcome message
        setSearchResults([{
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
    
    // Auto scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [searchResults]);
    
    const scrollToBottom = () => {
        resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    const performSearch = async () => {
        if (!searchQuery.trim() || isSearching) return;
        
        const searchEntry = {
            id: `search_${Date.now()}`,
            type: 'query',
            content: searchQuery.trim(),
            timestamp: new Date()
        };
        
        setSearchResults(prev => [...prev, searchEntry]);
        setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 9)]); // Keep last 10
        setSearchQuery('');
        setIsSearching(true);
        
        try {
            // Simulate API call - replace with actual research API
            const response = await fetch(getApiUrl('/research/search'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: searchEntry.content,
                    sessionId,
                    searchType: 'comprehensive'
                })
            });
            
            let resultContent;
            
            if (response.ok) {
                const data = await response.json();
                resultContent = data.results || generateMockResults(searchEntry.content);
            } else {
                // Fallback to mock results if API is not available
                resultContent = generateMockResults(searchEntry.content);
            }
            
            const resultEntry = {
                id: `result_${Date.now()}`,
                type: 'result',
                content: resultContent,
                timestamp: new Date(),
                query: searchEntry.content,
                isTyping: true
            };
            
            setSearchResults(prev => [...prev, resultEntry]);
            setTypingResultId(resultEntry.id);
            
        } catch (error) {
            console.error('Research error:', error);
            const errorResult = {
                id: `error_${Date.now()}`,
                type: 'error',
                content: `⚠️ **Research Error**

Unable to complete your search at the moment. Please try rephrasing your query or try again.

*Tip: Be specific about the legal concept you want to research (e.g., "contract breach remedies", "copyright fair use doctrine")*`,
                timestamp: new Date()
            };
            setSearchResults(prev => [...prev, errorResult]);
        } finally {
            setIsSearching(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };
    
    const generateMockResults = (query) => {
        // Generate comprehensive mock legal research results
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
• Consider carve-outs for payment obligations

**📋 Recommended Clause Language:**
"Neither party shall be liable for any failure or delay in performance which is due to fire, flood, earthquake, pandemic, governmental action, war, terrorism, or other causes beyond the reasonable control of such party..."`;
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
• Consider defensive patent portfolios in competitive markets

**⚠️ Common Pitfalls:**
• Inadequate invention disclosure in patent applications
• Failure to maintain trademark use requirements
• Missing copyright registration deadlines
• Insufficient confidentiality agreements for trade secrets`;
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

**⚠️ Risk Factors:**
• Ambiguous language may lead to costly disputes
• Changing regulatory landscape requires monitoring
• Enforcement challenges in certain jurisdictions

*For detailed case citations and specific legal advice, consult with qualified legal counsel.*`;
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            performSearch();
        }
    };
    
    const handleTypingComplete = (resultId) => {
        setTypingResultId(null);
        setSearchResults(prev => prev.map(result => 
            result.id === resultId ? { ...result, isTyping: false } : result
        ));
        setTimeout(() => inputRef.current?.focus(), 200);
    };
    
    const clearHistory = () => {
        setSearchResults([{
            id: 'welcome_new',
            type: 'welcome',
            content: `🔄 **Research cleared!** Start a new legal research session.`,
            timestamp: new Date(),
            isWelcome: true
        }]);
        setSearchHistory([]);
    };
    
    const getQuickSearches = () => [
        "Force Majeure clause",
        "Non-compete enforceability", 
        "Contract breach remedies",
        "Copyright fair use",
        "Trade secret protection",
        "Liability limitations"
    ];
    
    const handleQuickSearch = (query) => {
        setSearchQuery(query);
        setTimeout(() => performSearch(), 100);
    };
    
    if (!isOpen) {
        return (
            <div className="ai-research-toggle" onClick={onToggle}>
                <div className="research-icon">
                    <span>🔍</span>
                </div>
                <div className="research-toggle-text">
                    <strong>AI Research</strong>
                    <br />
                    <small>Legal precedents & concepts</small>
                </div>
            </div>
        );
    }
    
    return (
        <div className="ai-research-panel">
            <div className="ai-research-header">
                <div className="research-title">
                    <div className="research-avatar">🔍</div>
                    <div className="title-content">
                        <h3>Legal Research</h3>
                        <span className="subtitle">AI-Powered Legal Intelligence</span>
                    </div>
                </div>
                <div className="research-controls">
                    <button 
                        className="clear-history-btn"
                        onClick={clearHistory}
                        title="Clear research history"
                    >
                        🗑️
                    </button>
                    <button 
                        className="close-research-btn"
                        onClick={onToggle}
                        title="Close research panel"
                    >
                        ✕
                    </button>
                </div>
            </div>
            
            <div className="ai-research-results">
                {searchResults.map((result) => (
                    <div key={result.id} className={`research-item ${result.type}`}>
                        <div className="result-avatar">
                            {result.type === 'query' ? '👤' : '🔍'}
                        </div>
                        <div className="result-content">
                            {result.type === 'result' && result.isTyping ? (
                                <TypingResearchResult 
                                    content={result.content} 
                                    onComplete={() => handleTypingComplete(result.id)}
                                />
                            ) : (
                                <div className="research-result-text">
                                    {formatResearchContent(result.content)}
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
                
                {isSearching && (
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
                
                <div ref={resultsEndRef} />
            </div>
            
            {getQuickSearches().length > 0 && searchResults.length <= 1 && (
                <div className="quick-searches">
                    <div className="quick-searches-label">Popular searches:</div>
                    <div className="quick-search-buttons">
                        {getQuickSearches().map((query, index) => (
                            <button
                                key={index}
                                className="quick-search-btn"
                                onClick={() => handleQuickSearch(query)}
                                disabled={isSearching}
                            >
                                {query}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="ai-research-input">
                <div className="input-container">
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter legal term or concept (e.g., 'Force Majeure clause')"
                        disabled={isSearching}
                        className="research-input"
                    />
                    <button 
                        onClick={performSearch}
                        disabled={!searchQuery.trim() || isSearching}
                        className="search-button"
                        title="Research legal concept"
                    >
                        {isSearching ? '⏳' : '🔍'}
                    </button>
                </div>
                <div className="input-hint">
                    <small>💡 Example searches: "Contract breach remedies", "Copyright fair use doctrine", "Trade secret protection"</small>
                </div>
            </div>
        </div>
    );
};

// Helper function to format research content with professional styling
const formatResearchContent = (content) => {
    if (!content) return '';
    
    const lines = content.split('\n');
    const elements = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (!line.trim()) {
            elements.push(<br key={`br-${i}`} />);
            continue;
        }
        
        // Main headers (lines starting with ** and ending with **)
        if (line.match(/^\*\*.*\*\*:?$/)) {
            elements.push(
                <h4 key={`header-${i}`} className="research-header">
                    {line.replace(/\*\*/g, '')}
                </h4>
            );
        }
        // Subheaders (lines starting with emojis and **)
        else if (line.match(/^[🔍📚⚖️🏛️📖💼💡⚠️📊📋🔄].*\*\*.*\*\*:?$/)) {
            elements.push(
                <h5 key={`subheader-${i}`} className="research-subheader">
                    {line.replace(/\*\*/g, '')}
                </h5>
            );
        }
        // Bullet points
        else if (line.match(/^[•-]/) || line.match(/^[🏛️⚖️📖💼💡⚠️📊]\s+\*\*/)) {
            elements.push(
                <li key={`bullet-${i}`} className="research-bullet">
                    {line.replace(/^[•-]\s*/, '')}
                </li>
            );
        }
        // Case names or important legal concepts (text in bold)
        else if (line.includes('**') && !line.match(/^\*\*.*\*\*$/)) {
            elements.push(
                <p key={`emphasis-${i}`} className="research-emphasis">
                    {line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').split('<strong>').map((part, idx) => {
                        if (part.includes('</strong>')) {
                            const [boldText, rest] = part.split('</strong>');
                            return <span key={idx}><strong>{boldText}</strong>{rest}</span>;
                        }
                        return part;
                    })}
                </p>
            );
        }
        // Regular paragraphs
        else {
            elements.push(
                <p key={`para-${i}`} className="research-paragraph">
                    {line}
                </p>
            );
        }
    }
    
    return <div className="formatted-research-content">{elements}</div>;
};

export default AIResearch;
