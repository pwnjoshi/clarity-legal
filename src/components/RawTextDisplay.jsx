import React, { useState, useEffect, useRef } from 'react';

/**
 * RawTextDisplay - Enhanced component to display raw text content with line numbers and search
 * This provides a clean, code-editor like experience for viewing document text
 */
const RawTextDisplay = ({ text }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentResultIndex, setCurrentResultIndex] = useState(0);
    const [showSearch, setShowSearch] = useState(false);
    const [textWithHighlights, setTextWithHighlights] = useState(text);
    const contentRef = useRef(null);
    
    // Process the text into lines with line numbers
    const lines = text ? text.split('\n') : [];
    
    // Handle search functionality
    useEffect(() => {
        if (!searchTerm || searchTerm.length < 2) {
            setSearchResults([]);
            setTextWithHighlights(text);
            return;
        }
        
        try {
            const results = [];
            const regex = new RegExp(searchTerm, 'gi');
            let match;
            let tempText = text;
            
            while ((match = regex.exec(text)) !== null) {
                results.push({
                    index: match.index,
                    text: match[0],
                    lineNumber: getLineNumberFromIndex(match.index, text)
                });
            }
            
            setSearchResults(results);
            
            // Highlight the current result in the text
            if (results.length > 0) {
                highlightCurrentResult(results, currentResultIndex);
            }
        } catch (e) {
            console.error('Search error:', e);
        }
    }, [searchTerm, currentResultIndex, text]);
    
    // Helper to get line number from character index
    const getLineNumberFromIndex = (index, text) => {
        const textUpToIndex = text.substring(0, index);
        return textUpToIndex.split('\n').length;
    };
    
    // Scroll to the current search result
    useEffect(() => {
        if (searchResults.length > 0 && contentRef.current) {
            const result = searchResults[currentResultIndex];
            
            // Find the line element to scroll to
            const lineElements = contentRef.current.querySelectorAll('.line-content');
            if (lineElements && lineElements.length >= result.lineNumber) {
                const lineElement = lineElements[result.lineNumber - 1];
                if (lineElement) {
                    lineElement.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
            }
        }
    }, [currentResultIndex, searchResults]);
    
    // Highlight the current search result
    const highlightCurrentResult = (results, currentIndex) => {
        if (results.length === 0) return;
        
        const currentResult = results[currentIndex];
        let highlighted = text;
        
        // Create a temporary element to hold the text
        const tempElement = document.createElement('div');
        tempElement.innerText = text;
        
        // Replace all matches with highlighted spans
        let replacedText = '';
        let lastIndex = 0;
        
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const isCurrent = i === currentIndex;
            
            // Add text before this match
            replacedText += text.substring(lastIndex, result.index);
            
            // Add the highlighted match
            const highlightClass = isCurrent ? 'current-highlight' : 'search-highlight';
            replacedText += `<span class="${highlightClass}">${result.text}</span>`;
            
            // Update lastIndex
            lastIndex = result.index + result.text.length;
        }
        
        // Add any remaining text
        replacedText += text.substring(lastIndex);
        
        setTextWithHighlights(replacedText);
    };
    
    // Navigate through search results
    const navigateToPrevResult = () => {
        if (searchResults.length === 0) return;
        setCurrentResultIndex(prev => 
            prev === 0 ? searchResults.length - 1 : prev - 1);
    };
    
    const navigateToNextResult = () => {
        if (searchResults.length === 0) return;
        setCurrentResultIndex(prev => 
            prev === searchResults.length - 1 ? 0 : prev + 1);
    };
    
    // Toggle search visibility
    const toggleSearch = () => {
        setShowSearch(prev => !prev);
        if (!showSearch) {
            setTimeout(() => document.getElementById('search-input')?.focus(), 100);
        } else {
            setSearchTerm('');
        }
    };
    
    // If no text provided, show placeholder
    if (!text) {
        return <div className="raw-text-empty">No text content available</div>;
    }
    
    return (
        <div className="raw-text-display">
            <div className="raw-text-header">
                <div className="header-left">
                    <span className="header-title">Raw Text View</span>
                    <span className="text-stats">
                        {lines.length.toLocaleString()} lines | {text.length.toLocaleString()} characters
                    </span>
                </div>
                <div className="header-actions">
                    <button 
                        className="action-button" 
                        onClick={toggleSearch} 
                        title="Search in text"
                    >
                        {showSearch ? '✕ Close' : '🔍 Search'}
                    </button>
                    <button 
                        className="action-button copy-button"
                        onClick={() => {
                            navigator.clipboard.writeText(text);
                            // Show temporary toast message
                            const toast = document.createElement('div');
                            toast.className = 'copy-toast';
                            toast.innerText = 'Text copied to clipboard';
                            document.body.appendChild(toast);
                            setTimeout(() => document.body.removeChild(toast), 2000);
                        }}
                        title="Copy text to clipboard"
                    >
                        📋 Copy
                    </button>
                </div>
            </div>
            
            {showSearch && (
                <div className="search-bar">
                    <input 
                        id="search-input"
                        type="text" 
                        placeholder="Search text..." 
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentResultIndex(0);
                        }}
                        className="search-input"
                    />
                    <div className="search-controls">
                        <button 
                            onClick={navigateToPrevResult} 
                            disabled={searchResults.length === 0}
                            className="search-nav-button"
                        >
                            ⬆️ Prev
                        </button>
                        <span className="search-results-count">
                            {searchResults.length > 0 ? 
                                `${currentResultIndex + 1} of ${searchResults.length}` : 
                                '0 results'}
                        </span>
                        <button 
                            onClick={navigateToNextResult} 
                            disabled={searchResults.length === 0}
                            className="search-nav-button"
                        >
                            ⬇️ Next
                        </button>
                    </div>
                </div>
            )}
            
            <div className="raw-text-content" ref={contentRef}>
                <div className="line-numbers">
                    {lines.map((_, i) => (
                        <div key={`line-${i + 1}`} className="line-number">
                            {i + 1}
                        </div>
                    ))}
                </div>
                <div className="text-content">
                    {lines.map((line, i) => (
                        <div key={`line-content-${i + 1}`} className="line-content">
                            {line || ' '} {/* Show a space for empty lines */}
                        </div>
                    ))}
                </div>
            </div>
            
            <style jsx="true">{`
                .raw-text-display {
                    padding: 10px;
                    background-color: #1a1a1a;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-size: 14px;
                }
                
                .raw-text-header {
                    padding: 10px 16px;
                    background-color: #2a2a2a;
                    color: #e0e0e0;
                    border-radius: 8px 8px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #383838;
                }
                
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .header-title {
                    font-weight: bold;
                    font-size: 15px;
                    color: #8d6ff0;
                }
                
                .text-stats {
                    color: #a8a8a8;
                    font-size: 13px;
                }
                
                .header-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .action-button {
                    background-color: #333333;
                    border: 1px solid #444;
                    color: #e0e0e0;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .action-button:hover {
                    background-color: #444;
                    transform: translateY(-1px);
                }
                
                .copy-button:active {
                    background-color: #388e3c;
                }
                
                .copy-toast {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: #333;
                    color: #fff;
                    padding: 8px 16px;
                    border-radius: 4px;
                    z-index: 1000;
                    animation: fadeInOut 2s ease-in-out;
                }
                
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0; }
                    10%, 90% { opacity: 1; }
                }
                
                .search-bar {
                    display: flex;
                    justify-content: space-between;
                    background-color: #2a2a2a;
                    padding: 10px 16px;
                    border-top: 1px solid #383838;
                    border-bottom: 1px solid #383838;
                    animation: slideDown 0.2s ease-out;
                }
                
                @keyframes slideDown {
                    from { max-height: 0; opacity: 0; }
                    to { max-height: 50px; opacity: 1; }
                }
                
                .search-input {
                    flex: 1;
                    background-color: #1a1a1a;
                    border: 1px solid #444;
                    border-radius: 4px;
                    padding: 6px 10px;
                    color: #e0e0e0;
                    font-size: 13px;
                    margin-right: 10px;
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: #8d6ff0;
                    box-shadow: 0 0 0 2px rgba(141, 111, 240, 0.2);
                }
                
                .search-controls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .search-nav-button {
                    background-color: #333333;
                    border: 1px solid #444;
                    color: #e0e0e0;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .search-nav-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .search-nav-button:not(:disabled):hover {
                    background-color: #444;
                }
                
                .search-results-count {
                    color: #a8a8a8;
                    font-size: 12px;
                    min-width: 80px;
                    text-align: center;
                }
                
                .raw-text-content {
                    background-color: #1a1a1a;
                    border: 1px solid #383838;
                    border-radius: 0 0 8px 8px;
                    overflow: auto;
                    flex: 1;
                    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                    display: flex;
                    line-height: 1.6;
                    font-size: 13px;
                }
                
                .line-numbers {
                    padding: 12px 8px;
                    background-color: #222;
                    color: #666;
                    text-align: right;
                    user-select: none;
                    border-right: 1px solid #383838;
                }
                
                .line-number {
                    padding: 0 5px;
                    font-size: 12px;
                }
                
                .text-content {
                    padding: 12px 16px;
                    color: #e0e0e0;
                    white-space: pre;
                    overflow-x: auto;
                    flex: 1;
                    min-width: 0;
                }
                
                .line-content {
                    min-height: 1.6em;
                }
                
                .search-highlight {
                    background-color: rgba(255, 165, 0, 0.3);
                    border-radius: 2px;
                }
                
                .current-highlight {
                    background-color: #8d6ff0;
                    color: white;
                    border-radius: 2px;
                }
                
                .raw-text-empty {
                    padding: 20px;
                    text-align: center;
                    color: #888;
                    font-style: italic;
                }
                
                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .raw-text-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;
                        padding: 10px;
                    }
                    
                    .header-actions {
                        width: 100%;
                        justify-content: flex-end;
                    }
                    
                    .search-bar {
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .search-controls {
                        width: 100%;
                        justify-content: space-between;
                    }
                }
            `}</style>
        </div>
    );
};

export default RawTextDisplay;