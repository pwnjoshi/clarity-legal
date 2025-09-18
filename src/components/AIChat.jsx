import React, { useState, useRef, useEffect } from 'react';
import './AIChat.css';

// Typing effect component for assistant messages
const TypingMessage = ({ content, onComplete }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    
    useEffect(() => {
        if (!content || content === displayedContent) {
            setIsTyping(false);
            onComplete?.();
            return;
        }
        
        const baseTypingSpeed = 12; // Base typing speed
        let currentIndex = 0;
        
        const typeCharacter = () => {
            if (currentIndex < content.length) {
                // Variable typing speed - faster for spaces and punctuation
                const currentChar = content[currentIndex];
                let charsToAdd = 1;
                let speed = baseTypingSpeed;
                
                // Type faster for certain characters
                if (currentChar === ' ') {
                    speed = baseTypingSpeed * 0.3; // Much faster for spaces
                    charsToAdd = Math.min(2, content.length - currentIndex); // Add space + next char
                } else if (['.', ',', '!', '?', ':', ';'].includes(currentChar)) {
                    speed = baseTypingSpeed * 1.5; // Slightly slower for punctuation
                } else if (currentChar === '\n') {
                    speed = baseTypingSpeed * 2; // Pause at line breaks
                }
                
                // Add multiple characters for faster overall effect
                if (Math.random() > 0.7) { // 30% chance to type faster
                    charsToAdd = Math.min(3, content.length - currentIndex);
                    speed *= 0.5;
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
        
        const timer = setTimeout(typeCharacter, 50);
        return () => clearTimeout(timer);
    }, [content, displayedContent, onComplete]);
    
    return (
        <div className="message-text">
            {formatMessageContent(displayedContent)}
            {isTyping && <span className="typing-cursor">█</span>}
        </div>
    );
};

const AIChat = ({ documentContext, isOpen, onToggle }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [analysisType, setAnalysisType] = useState('general');
    const [analysisTypes, setAnalysisTypes] = useState({});
    const [typingMessageId, setTypingMessageId] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    
    // Generate session ID on mount
    useEffect(() => {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        
        // Load analysis types
        loadAnalysisTypes();
        
        // Welcome message
        if (documentContext && documentContext.text) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: `👋 **ClarityLegal AI Ready**

I've analyzed your document and can provide:

⚡ **Quick Risk Assessment** - Identify top legal risks
🔍 **Clause Analysis** - Explain complex terms
💼 **Negotiation Strategy** - Prioritize key terms  
📋 **Compliance Check** - Flag regulatory issues

**Pro Tips:**
• Be specific about your concerns
• Ask about particular clauses or sections
• Request risk priorities or deal-breakers

What would you like to analyze first?`,
                timestamp: new Date(),
                isWelcome: true
            }]);
        }
    }, [documentContext]);

    // Auto scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadAnalysisTypes = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/ai/analysis-types');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAnalysisTypes(data.analysisTypes);
                }
            }
        } catch (error) {
            console.error('Failed to load analysis types:', error);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: inputMessage.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: inputMessage.trim(),
                    sessionId,
                    documentContext: documentContext ? {
                        text: documentContext.text,
                        highlights: documentContext.highlights || []
                    } : null,
                    analysisType
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const aiMessage = {
                    id: `ai_${Date.now()}`,
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date(data.timestamp),
                    analysisType: data.analysisType,
                    disclaimer: data.disclaimer,
                    isTyping: true // Enable fast typing effect
                };

                setMessages(prev => [...prev, aiMessage]);
                setTypingMessageId(aiMessage.id);
            } else {
                throw new Error(data.error || 'Failed to get AI response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                id: `error_${Date.now()}`,
                role: 'assistant',
                content: `❌ **Analysis Error**

I couldn't process your request right now. Please try rephrasing your question or try again in a moment.

*Tip: Be specific about what you'd like me to analyze (e.g., "risks", "specific clause", "compliance issues")*`,
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            // Focus back to input
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    
    const handleTypingComplete = (messageId) => {
        setTypingMessageId(null);
        setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isTyping: false } : msg
        ));
        // Auto-focus input after typing completes
        setTimeout(() => inputRef.current?.focus(), 200);
    };

    const clearChat = async () => {
        try {
            await fetch(`http://localhost:3001/api/ai/history/${sessionId}`, {
                method: 'DELETE'
            });
            setMessages([]);
            // Re-add welcome message if document is loaded
            if (documentContext && documentContext.text) {
                setMessages([{
                    id: 'welcome_new',
                    role: 'assistant',
                    content: `🔄 **Chat cleared!** How can I help you analyze your document?`,
                    timestamp: new Date(),
                    isWelcome: true
                }]);
            }
        } catch (error) {
            console.error('Failed to clear chat history:', error);
        }
    };

    const getQuickActions = () => {
        if (!documentContext || !documentContext.text) return [];
        
        // Smart prompts based on document content analysis
        const docText = documentContext.text.toLowerCase();
        const isContract = docText.includes('agreement') || docText.includes('contract');
        const hasTermination = docText.includes('terminate') || docText.includes('termination');
        const hasLiability = docText.includes('liable') || docText.includes('indemnif');
        const hasIP = docText.includes('intellectual property') || docText.includes('patent');
        
        const baseActions = [
            { text: "Identify top 3 risks", analysisType: "riskAnalysis" },
            { text: "Review for deal-breakers", analysisType: "negotiationAdvice" },
        ];
        
        // Add contextual quick actions
        if (hasLiability) {
            baseActions.push({ text: "Analyze liability exposure", analysisType: "riskAnalysis" });
        }
        if (hasTermination) {
            baseActions.push({ text: "Review termination clause", analysisType: "clauseInterpretation" });
        }
        if (hasIP) {
            baseActions.push({ text: "Check IP ownership", analysisType: "clauseInterpretation" });
        }
        if (isContract) {
            baseActions.push({ text: "Compliance check", analysisType: "complianceCheck" });
        }
        
        return baseActions.slice(0, 4); // Limit to 4 actions
    };

    const handleQuickAction = (action) => {
        setAnalysisType(action.analysisType);
        setInputMessage(action.text);
        // Auto-send after brief delay
        setTimeout(() => {
            sendMessage();
        }, 100);
    };

    if (!isOpen) {
        return (
            <div className="ai-chat-toggle" onClick={onToggle}>
                <div className="chat-icon">
                    <span>🤖</span>
                </div>
                <div className="chat-toggle-text">
                    <strong>AI Legal Advisor</strong>
                    <br />
                    <small>Ask me about this document</small>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-chat-panel">
            <div className="ai-chat-header">
                <div className="chat-title">
                    <div className="ai-avatar">🤖</div>
                    <div className="title-content">
                        <h3>ClarityLegal AI</h3>
                        <span className="subtitle">Legal Document Advisor</span>
                    </div>
                </div>
                <div className="chat-controls">
                    <select 
                        className="analysis-type-select"
                        value={analysisType}
                        onChange={(e) => setAnalysisType(e.target.value)}
                        title="Select analysis type"
                    >
                        {Object.entries(analysisTypes).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <button 
                        className="clear-chat-btn"
                        onClick={clearChat}
                        title="Clear conversation"
                    >
                        🗑️
                    </button>
                    <button 
                        className="close-chat-btn"
                        onClick={onToggle}
                        title="Close chat"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {documentContext && !documentContext.text && (
                <div className="no-document-notice">
                    <div className="notice-icon">📄</div>
                    <p><strong>No document loaded</strong></p>
                    <p>Upload a legal document to get contextual AI analysis and advice.</p>
                </div>
            )}

            <div className="ai-chat-messages">
                {messages.map((message) => (
                    <div key={message.id} className={`message ${message.role} ${message.isError ? 'error' : ''}`}>
                        <div className="message-avatar">
                            {message.role === 'user' ? '👤' : '🤖'}
                        </div>
                        <div className="message-content">
                            {message.role === 'assistant' && message.isTyping ? (
                                <TypingMessage 
                                    content={message.content} 
                                    onComplete={() => handleTypingComplete(message.id)}
                                />
                            ) : (
                                <div className="message-text">
                                    {formatMessageContent(message.content)}
                                </div>
                            )}
                            <div className="message-meta">
                                <span className="message-time">
                                    {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                {message.analysisType && message.analysisType !== 'general' && (
                                    <span className="analysis-badge">
                                        {analysisTypes[message.analysisType] || message.analysisType}
                                    </span>
                                )}
                            </div>
                            {message.disclaimer && (
                                <div className="disclaimer">
                                    ⚖️ <small>{message.disclaimer}</small>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="message assistant loading">
                        <div className="message-avatar">🤖</div>
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <div className="loading-text">Analyzing your document...</div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {getQuickActions().length > 0 && messages.length <= 1 && (
                <div className="quick-actions">
                    <div className="quick-actions-label">Quick questions:</div>
                    <div className="quick-action-buttons">
                        {getQuickActions().map((action, index) => (
                            <button
                                key={index}
                                className="quick-action-btn"
                                onClick={() => handleQuickAction(action)}
                                disabled={isLoading}
                            >
                                {action.text}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="ai-chat-input">
                <div className="input-container">
                    <textarea
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={documentContext && documentContext.text ? 
                            "Ask me about your document..." : 
                            "Upload a document first to get AI analysis..."
                        }
                        disabled={isLoading || (!documentContext || !documentContext.text)}
                        rows={1}
                        className="message-input"
                    />
                    <button 
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isLoading || (!documentContext || !documentContext.text)}
                        className="send-button"
                        title="Send message"
                    >
                        {isLoading ? '⏳' : '📤'}
                    </button>
                </div>
                <div className="input-hint">
                    <small>💡 Example: "What are the liability risks?" or "Explain the termination clause" or "What should I negotiate?"</small>
                </div>
            </div>
        </div>
    );
};

// Helper function to format message content with markdown-like styling
const formatMessageContent = (content) => {
    if (!content) return '';
    
    // Split content into lines and process each one
    const lines = content.split('\n');
    const elements = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip empty lines but add spacing
        if (!line.trim()) {
            elements.push(<br key={`br-${i}`} />);
            continue;
        }
        
        // Headers (lines starting with ** and ending with **)
        if (line.match(/^\*\*.*\*\*:?$/)) {
            elements.push(
                <h4 key={`header-${i}`} className="message-header">
                    {line.replace(/\*\*/g, '')}
                </h4>
            );
        }
        // Bullet points (lines starting with - or •)
        else if (line.match(/^[-•]\s+/)) {
            elements.push(
                <li key={`bullet-${i}`} className="message-bullet">
                    {line.replace(/^[-•]\s+/, '')}
                </li>
            );
        }
        // Numbered lists (lines starting with numbers)
        else if (line.match(/^\d+\.\s+/)) {
            elements.push(
                <li key={`number-${i}`} className="message-number">
                    {line.replace(/^\d+\.\s+/, '')}
                </li>
            );
        }
        // Regular paragraphs
        else {
            elements.push(
                <p key={`para-${i}`} className="message-paragraph">
                    {line}
                </p>
            );
        }
    }
    
    return <div className="formatted-content">{elements}</div>;
};

export default AIChat;
