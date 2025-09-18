import React, { useState, useEffect } from 'react';
import './DocumentDisplay.css';

const DocumentDisplay = ({ text, highlights = [], title }) => {
    const [activeTooltip, setActiveTooltip] = useState(null);
    
    // Clean minimal styling for document titles
    useEffect(() => {
        const styleDocumentTitles = () => {
            // Try multiple selectors to find document titles
            const selectors = [
                '.document-title',
                '.document-paragraph.document-title',
                '[class*="document-title"]',
                'p.document-title',
                '.document-text-container .document-title'
            ];
            
            let totalFound = 0;
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                totalFound += elements.length;
                
                elements.forEach((element, index) => {
                    // Clean up title text - remove ** markdown symbols
                    if (element.textContent && element.textContent.includes('**')) {
                        element.textContent = element.textContent.replace(/\*\*/g, '').trim();
                    }
                    
                    // Clean minimal styling - bright white bold text
                    element.style.cssText = 'color: #ffffff !important; background: transparent !important; font-weight: 700 !important; font-size: 18px !important; text-align: left !important; margin: 24px 0 16px 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; text-transform: none !important; letter-spacing: normal !important; line-height: 1.4 !important; display: block !important; opacity: 1 !important; visibility: visible !important; -webkit-text-fill-color: #ffffff !important; text-shadow: none !important;';
                });
            });
        };
        
        styleDocumentTitles();
        setTimeout(styleDocumentTitles, 100);
        setTimeout(styleDocumentTitles, 500);
    }, [text]);

    // Helper function to apply highlights to text
    const applyHighlights = (text, highlights) => {
        if (!text || !highlights.length) {
            return [{ text, isHighlight: false }];
        }

        // Sort highlights by position to avoid overlap issues
        const sortedHighlights = [...highlights].sort((a, b) => {
            const aIndex = text.toLowerCase().indexOf(a.text.toLowerCase());
            const bIndex = text.toLowerCase().indexOf(b.text.toLowerCase());
            return aIndex - bIndex;
        });

        const segments = [];
        let currentIndex = 0;

        sortedHighlights.forEach((highlight, index) => {
            const highlightText = highlight.text;
            const startIndex = text.toLowerCase().indexOf(highlightText.toLowerCase(), currentIndex);
            
            if (startIndex !== -1) {
                // Add text before highlight
                if (startIndex > currentIndex) {
                    segments.push({
                        text: text.substring(currentIndex, startIndex),
                        isHighlight: false
                    });
                }
                
                // Add highlighted text
                segments.push({
                    text: text.substring(startIndex, startIndex + highlightText.length),
                    isHighlight: true,
                    highlightData: highlight,
                    id: `highlight-${index}`
                });
                
                currentIndex = startIndex + highlightText.length;
            }
        });

        // Add remaining text
        if (currentIndex < text.length) {
            segments.push({
                text: text.substring(currentIndex),
                isHighlight: false
            });
        }

        return segments;
    };

    const aiFormatDocument = (rawText) => {
        if (!rawText) return [];
        
        console.log('Formatting document text...');
        
        // Simple, effective text cleaning
        let cleanText = rawText
            .replace(/\r\n/g, '\n')     // Normalize line endings
            .replace(/\r/g, '\n')       // Handle Mac line endings
            .replace(/\u00A0/g, ' ')    // Non-breaking spaces to regular spaces
            .replace(/\t+/g, ' ')       // Tabs to spaces
            .replace(/[ ]{2,}/g, ' ')   // Multiple spaces to single space
            .trim();
        
        // Split text into natural paragraphs - much simpler approach
        const lines = cleanText.split('\n');
        const paragraphs = [];
        let currentParagraph = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Empty line indicates paragraph break
            if (line === '') {
                if (currentParagraph.length > 0) {
                    paragraphs.push(currentParagraph.join(' ').trim());
                    paragraphs.push(''); // Add spacing
                    currentParagraph = [];
                }
                continue;
            }
            
            // Check if this is likely a header or title (more comprehensive)
            const isHeader = 
                line.match(/^(\*\*|##|PARTNERSHIP|AGREEMENT|CONTRACT|VERSION|SCOPE|TERM|TERMINATION|NON-COMPETE|INTELLECTUAL|Clause|Section|Article|WHEREAS|NOW\s+THEREFORE)/i) ||
                line.match(/^[A-Z\s-]{8,}:?$/) || // All caps headers (reduced minimum)
                line.match(/^\d+\s*[.)]\s*[A-Z]/) || // Numbered sections with content
                line.match(/^[A-Z][A-Z\s&-]{5,}\*\*$/) || // Headers ending with **
                (line.length < 80 && line.match(/^[A-Z][^.]*\*\*$/)); // Short titles ending with **
            
            if (isHeader && currentParagraph.length > 0) {
                // Finish current paragraph and start new one
                paragraphs.push(currentParagraph.join(' ').trim());
                paragraphs.push(''); // Add spacing before header
                paragraphs.push(line);
                paragraphs.push(''); // Add spacing after header
                currentParagraph = [];
            } else if (isHeader) {
                // Start with header
                paragraphs.push(line);
                paragraphs.push(''); // Add spacing after header
            } else {
                // Add to current paragraph
                currentParagraph.push(line);
            }
        }
        
        // Add final paragraph if exists
        if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join(' ').trim());
        }
        
        // Clean up: remove excessive empty lines
        const cleanedParagraphs = [];
        for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i];
            
            // Add non-empty paragraphs
            if (paragraph.trim() !== '') {
                cleanedParagraphs.push(paragraph.trim());
            }
            // Add spacing only if next item isn't empty and current isn't the last
            else if (i < paragraphs.length - 1 && paragraphs[i + 1]?.trim() !== '') {
                // Only add spacing if we don't already have it
                if (cleanedParagraphs.length > 0 && cleanedParagraphs[cleanedParagraphs.length - 1] !== '') {
                    cleanedParagraphs.push('');
                }
            }
        }
        
        console.log('Text formatting complete:', cleanedParagraphs.length, 'sections');
        return cleanedParagraphs;
    };

    const formatDocumentText = (text) => {
        return aiFormatDocument(text);
    };

    const getParagraphClass = (paragraph) => {
        const trimmed = paragraph.trim();
        
        // Empty paragraphs (for spacing)
        if (trimmed === '') {
            return 'document-paragraph empty-line';
        }
        
        // Document titles (all caps, longer text, or ending with **)
        if ((trimmed === trimmed.toUpperCase() && trimmed.length > 7 && 
            (trimmed.includes('AGREEMENT') || trimmed.includes('CONTRACT') || 
             trimmed.includes('PARTNERSHIP') || trimmed.includes('VERSION') ||
             trimmed.includes('SCOPE') || trimmed.includes('OBJECTIVE') ||
             trimmed.includes('CONFIDENTIALITY') || trimmed.includes('DISPUTE') ||
             trimmed.match(/^[A-Z\s-]{8,}$/))) || 
            trimmed.match(/\*\*$/)) { // Lines ending with **
            return 'document-paragraph document-title';
        }
        
        // Clause headers and section titles
        if (trimmed.match(/^(Clause|Section|Article|Chapter|Part)\s*\d+/i) ||
            trimmed.match(/^(WHEREAS|NOW THEREFORE|IN WITNESS WHEREOF)/i)) {
            return 'document-paragraph clause-header';
        }
        
        // Signature lines and formal elements
        if (trimmed.match(/^(Signed\s*by|Party\s*[AB]?:|Date:|Name:|Title:)/i) ||
            trimmed.includes('_________________________') ||
            trimmed.match(/^[A-Za-z\s]+:\s*_+$/) ||
            trimmed.includes('Alpha)') || trimmed.includes('Beta)')) {
            return 'document-paragraph signature-line';
        }
        
        // List items and structured content
        if (trimmed.match(/^\s*(\d+\.|[a-zA-Z]\)|•|-|\*)\s+/) ||
            trimmed.match(/^[A-Z][^.]{1,30}:\s*/)) {
            return 'document-paragraph list-item';
        }
        
        return 'document-paragraph';
    };


    const renderHighlightedText = (segments) => {
        return segments.map((segment, index) => {
            if (!segment.isHighlight) {
                return <span key={index}>{segment.text}</span>;
            }

            const { highlightData } = segment;
            return (
                <span
                    key={index}
                    className={`modern-highlight ${highlightData.type || 'default'} ${highlightData.severity || 'medium'}`}
                    onMouseEnter={(e) => setActiveTooltip({ 
                        ...highlightData, 
                        element: e.target, 
                        id: segment.id 
                    })}
                    onMouseLeave={() => setActiveTooltip(null)}
                    data-tooltip={highlightData.explanation}
                >
                    <span className="highlight-text">{segment.text}</span>
                    <span className="highlight-indicator">●</span>
                </span>
            );
        });
    };

    // If no text provided, show placeholder
    if (!text || text.trim().length === 0) {
        return (
            <div className="enhanced-document-display">
                <div className="document-placeholder">
                    <div className="placeholder-icon">📄</div>
                    <h3>No Document Content</h3>
                    <p>Upload a document to view its content here.</p>
                </div>
            </div>
        );
    }

    const formattedParagraphs = formatDocumentText(text);

    return (
        <div className="enhanced-document-display">
            <div className="document-content">
                <div className="document-text-container">
                    {formattedParagraphs.length > 0 ? (
                        formattedParagraphs.map((paragraph, paragraphIndex) => {
                            const paragraphSegments = applyHighlights(paragraph, highlights);
                            const paragraphClass = getParagraphClass(paragraph);
                            
                            return (
                                <p key={paragraphIndex} className={paragraphClass}>
                                    {renderHighlightedText(paragraphSegments)}
                                </p>
                            );
                        })
                    ) : (
                        <div className="formatted-text">
                            {text.split('\n').filter(line => line.trim().length > 0).map((line, lineIndex) => (
                                <p key={lineIndex} className={getParagraphClass(line.trim())}>
                                    {renderHighlightedText(applyHighlights(line.trim(), highlights))}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modern Tooltip */}
            {activeTooltip && (
                <div 
                    className={`modern-tooltip ${activeTooltip.type || 'default'} ${activeTooltip.severity || 'medium'}`}
                    style={{
                        position: 'fixed',
                        left: activeTooltip.element?.getBoundingClientRect().left,
                        top: activeTooltip.element?.getBoundingClientRect().bottom + 10,
                        zIndex: 1000,
                        maxWidth: '300px'
                    }}
                >
                    <div className="tooltip-header">
                        <span className={`tooltip-badge ${activeTooltip.type || 'default'}`}>
                            {(activeTooltip.type || 'info').toUpperCase()}
                        </span>
                        <span className={`tooltip-level ${activeTooltip.severity || 'medium'}`}>
                            {(activeTooltip.severity || 'medium').toUpperCase()}
                        </span>
                    </div>
                    <div className="tooltip-content">
                        {activeTooltip.explanation || activeTooltip.tooltip || 'No details available'}
                    </div>
                    <div className="tooltip-arrow"></div>
                </div>
            )}
        </div>
    );
};

export default DocumentDisplay;
