import React, { useState, useEffect, useCallback } from 'react';
import './DocumentDisplay.css';
import LoadingOverlay from './LoadingOverlay';

const DocumentDisplay = ({ text, highlights = [], title }) => {
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [formattedText, setFormattedText] = useState([]);
    
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

    // Improved document formatting with progressive loading for large documents
    const aiFormatDocument = useCallback((rawText) => {
        if (!rawText) return [];
        
        console.log('Formatting document text...');
        console.log('Raw text length:', rawText.length);
        
        // Show loading spinner for large documents
        const isLargeDocument = rawText.length > 50000;
        if (isLargeDocument) {
            setLoading(true);
            setProgress(5);
        }
        
        return new Promise((resolve) => {
            setTimeout(() => {
                // Emergency check - if we're only getting a small part of the document
                // Log details to help diagnose the issue
                if (rawText.length < 500 && rawText.length > 0) {
                    console.warn('⚠️ WARNING: Document text is suspiciously short! Only received', rawText.length, 'characters');
                    console.log('Text preview:', rawText);
                }
                
                // Enhanced text cleaning for better readability
                let cleanText = rawText
                    .replace(/\r\n/g, '\n')     // Normalize line endings
                    .replace(/\r/g, '\n')       // Handle Mac line endings
                    .replace(/\u00A0/g, ' ')    // Non-breaking spaces to regular spaces
                    .replace(/\t+/g, ' ')       // Tabs to spaces
                    .replace(/[ ]{2,}/g, ' ')   // Multiple spaces to single space
                    .replace(/([.!?])\s*(?=\n)/g, '$1\n') // Ensure sentence endings have line breaks
                    .replace(/(\n\s*){3,}/g, '\n\n')      // Reduce excessive line breaks
                    .trim();
                
                if (isLargeDocument) setProgress(20);
                
                // Try both approaches for text segmentation - first split by lines
                const lines = cleanText.split('\n');
                const paragraphs = [];
                let currentParagraph = [];
                
                // Emergency check - if the document is very short, just return the lines directly
                if (cleanText.length < 3000) {
                    console.log('Using simplified paragraph approach for short document');
                    resolve(lines.filter(line => line.trim().length > 0));
                    return;
                }
                
                console.log(`Split into ${lines.length} lines for processing`);
                if (isLargeDocument) setProgress(35);
                
                // Process lines in chunks for large documents to avoid UI freezing
                const processChunk = (startIdx, endIdx) => {
                    return new Promise((resolveChunk) => {
                        setTimeout(() => {
                            for (let i = startIdx; i < endIdx && i < lines.length; i++) {
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
                            resolveChunk();
                        }, 0);
                    });
                };
                
                // Process large documents in chunks to prevent UI freezing
                const chunkSize = isLargeDocument ? 500 : lines.length;
                const chunks = Math.ceil(lines.length / chunkSize);
                
                // Process chunks sequentially
                const processChunks = async (chunkIndex) => {
                    if (chunkIndex >= chunks) {
                        // All chunks processed, finalize
                        if (currentParagraph.length > 0) {
                            paragraphs.push(currentParagraph.join(' ').trim());
                        }
                        
                        // Update progress
                        if (isLargeDocument) setProgress(85);
                        
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
                        
                        // Finalize and hide loading
                        setTimeout(() => {
                            if (isLargeDocument) {
                                setProgress(100);
                                setLoading(false);
                            }
                            resolve(cleanedParagraphs);
                        }, 200);
                        return;
                    }
                    
                    const start = chunkIndex * chunkSize;
                    const end = start + chunkSize;
                    
                    // Update progress for large documents
                    if (isLargeDocument) {
                        const progressValue = 35 + Math.round((chunkIndex / chunks) * 50);
                        setProgress(progressValue);
                    }
                    
                    await processChunk(start, end);
                    processChunks(chunkIndex + 1);
                };
                
                // Start processing chunks
                processChunks(0);
                
            }, 50); // Small delay to allow the UI to update
        });
    }, []);

    const formatDocumentText = async (text) => {
        try {
            // Format the document with progress tracking
            const formatted = await aiFormatDocument(text);
            return formatted;
        } catch (error) {
            console.error('Error formatting document:', error);
            setLoading(false);
            // Fall back to simple line splitting
            return text.split(/\n+/).filter(line => line.trim().length > 0);
        }
    };

    // Process text on component mount
    useEffect(() => {
        if (text) {
            setLoading(true);
            formatDocumentText(text).then(formattedParagraphs => {
                setFormattedText(formattedParagraphs);
                setLoading(false);
            });
        } else {
            setFormattedText([]);
        }
    }, [text]);

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
            trimmed.match(/\*\*$/) || // Lines ending with **
            trimmed.match(/^[A-Z][A-Z\s]{5,}$/) || // All caps text of reasonable length
            trimmed.match(/^([IVX]{1,5}\.|\d+\.\d+\.)?\s*[A-Z][A-Z\s]{3,}/) // Roman numerals or numbered headers
        ) {
            return 'document-paragraph document-title';
        }
        
        // Clause headers and section titles
        if (trimmed.match(/^(Clause|Section|Article|Chapter|Part)\s*\d+/i) ||
            trimmed.match(/^(WHEREAS|NOW THEREFORE|IN WITNESS WHEREOF)/i) ||
            trimmed.match(/^(\d+\.\d+|\d+\.)\s+[A-Z][a-z]/) || // Numbered sections like "1.2 Contract Terms"
            trimmed.match(/^([A-Za-z][\.)]\s+[A-Z][a-z])/) ||  // Lettered sections like "A. Terms and Conditions"
            trimmed.match(/^Schedule\s+[A-Z]/i)) {              // Schedule references
            return 'document-paragraph clause-header';
        }
        
        // Signature lines and formal elements
        if (trimmed.match(/^(Signed\s*by|Party\s*[AB]?:|Date:|Name:|Title:|Signature)/i) ||
            trimmed.includes('_________________________') ||
            trimmed.match(/^[A-Za-z\s]+:\s*_+$/) ||
            trimmed.includes('Alpha)') || trimmed.includes('Beta)') ||
            trimmed.match(/^Dated\s+this|^By:/i)) {
            return 'document-paragraph signature-line';
        }
        
        // List items and structured content
        if (trimmed.match(/^\s*(\d+\.|[a-zA-Z][\.)]\s+|•|-|\*|\(\d+\)|\([a-z]\))\s+/) ||
            trimmed.match(/^[A-Z][^.]{1,30}:\s*/) ||
            trimmed.match(/^([Ii][Ff]|[Aa][Nn][Dd]|[Oo][Rr]|[Tt][Hh][Ee][Nn]|[Ww][Hh][Ee][Rr][Ee][Aa][Ss])/)) {
            return 'document-paragraph list-item';
        }
        
        // Definitions and terms
        if (trimmed.match(/^[""]/) || // Quotes
            trimmed.match(/^[A-Z][a-z]{2,}\s+means/i)) { // Definitions
            return 'document-paragraph definition-term';
        }
        
        return 'document-paragraph';
    };


    const renderHighlightedText = (segments) => {
        return segments.map((segment, index) => {
            if (!segment.isHighlight) {
                return <span key={index} style={{
                    color: "#e0e0e0", 
                    visibility: "visible",
                    display: "inline"
                }}>{segment.text}</span>;
            }

            const { highlightData } = segment;
            return (
                <span
                    key={index}
                    className={`modern-highlight ${highlightData.type || 'default'} ${highlightData.severity || 'medium'}`}
                    style={{
                        backgroundColor: "rgba(73, 83, 120, 0.2)",
                        borderBottom: "2px solid #4dd0ff",
                        color: "#e0e0e0",
                        padding: "0 2px",
                        margin: "0 1px",
                        borderRadius: "2px",
                        cursor: "help",
                        position: "relative",
                        display: "inline",
                        visibility: "visible"
                    }}
                    onMouseEnter={(e) => setActiveTooltip({ 
                        ...highlightData, 
                        element: e.target, 
                        id: segment.id 
                    })}
                    onMouseLeave={() => setActiveTooltip(null)}
                    data-tooltip={highlightData.explanation}
                >
                    <span className="highlight-text" style={{
                        color: "#e0e0e0",
                        visibility: "visible",
                        display: "inline"
                    }}>{segment.text}</span>
                    <span className="highlight-indicator" style={{
                        color: "#4dd0ff",
                        fontSize: "8px",
                        verticalAlign: "super",
                        marginLeft: "1px",
                        visibility: "visible",
                        display: "inline"
                    }}>●</span>
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
    
    // Add this safety check - if text exists but is very short, show a warning
    if (text.trim().length < 50) {
        console.warn("Document text is suspiciously short:", text);
    }

    const formattedParagraphs = formatDocumentText(text);
    
    // Debug information
    console.log("Text length:", text ? text.length : 0);
    console.log("Formatted paragraphs:", formattedText.length);
    console.log("Raw text sample:", text ? text.substring(0, 100) + "..." : "No text");
    
    // Ensure we have some content to display
    const hasFormattedContent = formattedText && formattedText.length > 0;
    const rawTextForDisplay = text || "No content available";

    return (
        <div className="enhanced-document-display" style={{
            display: "flex", 
            flexDirection: "column", 
            height: "100%", 
            width: "100%", 
            overflow: "auto", 
            backgroundColor: "#1a1a1a"
        }}>
            <div className="document-content" style={{
                display: "flex", 
                flexDirection: "column", 
                flex: 1, 
                overflow: "auto", 
                backgroundColor: "#1a1a1a"
            }}>
                <div className="document-text-container" style={{
                    padding: "20px", 
                    flex: 1, 
                    overflowY: "auto", 
                    color: "#e0e0e0", 
                    backgroundColor: "#1a1a1a"
                }}>
                    
                    {hasFormattedContent ? (
                        formattedText.map((paragraph, paragraphIndex) => {
                            const paragraphSegments = applyHighlights(paragraph, highlights);
                            const paragraphClass = getParagraphClass(paragraph);
                            
                            // Apply direct inline styles to ensure visibility
                            return (
                                <p 
                                    key={paragraphIndex} 
                                    className={paragraphClass} 
                                    style={{
                                        color: "#e0e0e0",
                                        visibility: "visible",
                                        display: "block",
                                        marginBottom: "15px",
                                        borderLeft: "2px solid #333",
                                        paddingLeft: "10px",
                                        fontSize: "14px",
                                        lineHeight: "1.6",
                                        textAlign: "left"
                                    }}
                                >
                                    {renderHighlightedText(paragraphSegments)}
                                </p>
                            );
                        })
                    ) : !loading && (
                        <div className="formatted-text" style={{
                            color: "#e0e0e0",
                            padding: "10px"
                        }}>
                            <h3 style={{color: "#ff9900", marginBottom: "15px"}}>Simple Text View</h3>
                            
                            {/* Fallback to simple text display with different splitting approaches */}
                            {rawTextForDisplay.split(/\n+/)
                                .filter(line => line.trim().length > 0)
                                .map((line, lineIndex) => (
                                    <p 
                                        key={lineIndex} 
                                        className={getParagraphClass(line.trim())} 
                                        style={{
                                            color: "#e0e0e0",
                                            visibility: "visible",
                                            display: "block",
                                            marginBottom: "15px",
                                            borderLeft: "2px solid #333",
                                            paddingLeft: "10px"
                                        }}
                                    >
                                        {renderHighlightedText(applyHighlights(line.trim(), highlights))}
                                    </p>
                                ))
                            }
                            
                            {/* If still no paragraphs, show a big text area with all text */}
                            {(rawTextForDisplay.split(/\n+/).filter(line => line.trim().length > 0).length === 0) && (
                                <>
                                    <h3 style={{color: "#ff9900", marginBottom: "15px", textAlign: "center"}}>
                                        Direct Text View
                                    </h3>
                                    <div style={{
                                        padding: "15px",
                                        border: "1px solid #444", 
                                        borderRadius: "4px",
                                        backgroundColor: "#222",
                                        whiteSpace: "pre-wrap",
                                        color: "#e0e0e0",
                                        fontFamily: "monospace",
                                        maxHeight: "none", // Allow full height to see all text
                                        overflow: "auto",
                                        lineHeight: "1.5",
                                        fontSize: "14px"
                                    }}>
                                        {rawTextForDisplay}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Loading Overlay */}
            <LoadingOverlay 
                loading={loading} 
                progress={progress} 
                message={progress > 0 ? `Processing document (${progress}%)...` : "Processing document..."}
            />
            
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
