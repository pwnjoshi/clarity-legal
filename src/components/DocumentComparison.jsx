import React, { useState, useRef, useEffect } from 'react';
import { getApiUrl } from '../utils/apiUtils';

// Custom scrollbar styles
const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 4px;
        transition: background 0.2s ease;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
`;

const DocumentComparison = ({ originalDocument, onClose }) => {
    // Add styles to document head
    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.textContent = scrollbarStyles;
        document.head.appendChild(styleElement);
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);
    const [originalFile, setOriginalFile] = useState(null);
    
    // Use the original document from props if available
    useEffect(() => {
        if (originalDocument) {
            // Enhanced original document loading with better size handling
            const loadOriginalDocument = async () => {
                let documentSize = originalDocument.size || 0;
                
                // If size is missing or 0, try to get it from the server
                if (documentSize === 0 && originalDocument.path) {
                    try {
                        console.log('🔍 Attempting to fetch file size for:', originalDocument.path);
                        
                        const response = await fetch(getApiUrl(`/compare/file-stats?path=${encodeURIComponent(originalDocument.path)}`));
                        
                        if (response.ok) {
                            const result = await response.json();
                            if (result.success && result.stats) {
                                documentSize = result.stats.size;
                                console.log('✅ Successfully fetched original document size:', result.stats.sizeKB + 'KB');
                            }
                        } else {
                            console.warn('⚠️ Could not fetch file stats from server:', response.status);
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not fetch original document size:', error.message);
                    }
                }
                
                // If we still don't have a size, warn the user
                if (documentSize === 0) {
                    console.warn('⚠️ Original document size is 0 or missing. This may cause comparison issues.');
                }
                
                setOriginalFile({
                    name: originalDocument.originalName || originalDocument.name || 'Current Document',
                    size: documentSize,
                    path: originalDocument.path,
                    isFromProps: true // Flag to indicate this came from props
                });
                
                console.log('📄 Original document loaded:', {
                    name: originalDocument.originalName || originalDocument.name || 'Current Document',
                    size: documentSize,
                    sizeKB: Math.round(documentSize / 1024),
                    hasPath: !!originalDocument.path,
                    path: originalDocument.path
                });
            };
            
            loadOriginalDocument();
        }
    }, [originalDocument]);
    const [comparisonFile, setComparisonFile] = useState(null);
    const [isComparing, setIsComparing] = useState(false);
    const [error, setError] = useState(null);
    const [comparisonResult, setComparisonResult] = useState(null);
    const [currentView, setCurrentView] = useState('upload'); // 'upload' | 'results'
    const [isTextComparisonCollapsed, setIsTextComparisonCollapsed] = useState(true);
    const originalFileInputRef = useRef(null);
    const comparisonFileInputRef = useRef(null);

    const handleOriginalFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setOriginalFile(file);
            setError(null);
        }
    };

    const handleComparisonFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setComparisonFile(file);
            setError(null);
        }
    };

    const handleRemoveOriginalFile = () => {
        setOriginalFile(null);
        setError(null);
        if (originalFileInputRef.current) {
            originalFileInputRef.current.value = '';
        }
    };

    const handleRemoveComparisonFile = () => {
        setComparisonFile(null);
        setError(null);
        if (comparisonFileInputRef.current) {
            comparisonFileInputRef.current.value = '';
        }
    };

    const handleCompare = async () => {
        if (!comparisonFile) {
            setError('Please select a comparison file');
            return;
        }
        
        if (!originalFile) {
            setError('No original document available for comparison');
            return;
        }
        
        // Validate file sizes
        if (comparisonFile.size === 0) {
            setError('Comparison file appears to be empty (0 bytes). Please select a valid file.');
            return;
        }
        
        if (originalFile.isFromProps && (!originalFile.path || originalFile.size === 0) && (!originalDocument?.extractedText || originalDocument.extractedText.length === 0)) {
            setError('Original document information is incomplete. Please upload both files manually or ensure the original document is properly loaded.');
            return;
        }

        setIsComparing(true);
        setError(null);

        try {
            const formData = new FormData();
            
            // Handle original document - either from props or uploaded
            if (originalFile.isFromProps) {
                // For documents from props, prefer sending the extracted text directly
                if (originalDocument?.extractedText && originalDocument.extractedText.length > 0) {
                    console.log('📝 Sending extracted text for original document');
                    formData.append('originalDocumentText', originalDocument.extractedText);
                    formData.append('originalDocumentId', originalDocument.id || 'current-document');
                } else if (originalFile.path) {
                    console.log('📄 Sending file path for original document');
                    formData.append('originalDocumentPath', originalFile.path);
                } else {
                    throw new Error('Original document has no text content or valid path');
                }
            } else {
                // Use uploaded original file
                formData.append('originalFile', originalFile);
            }
            
            formData.append('comparisonFile', comparisonFile);
            
            console.log('📄 Document comparison request:', {
                originalFile: originalFile.name + (originalFile.isFromProps ? ' (current document)' : ' (uploaded)'),
                comparisonFile: comparisonFile.name,
                originalSize: Math.round(originalFile.size / 1024) + 'KB',
                comparisonSize: Math.round(comparisonFile.size / 1024) + 'KB'
            });
            
            // Debug log original file details
            console.log('🔍 Original file debug info:', {
                isFromProps: originalFile.isFromProps,
                hasPath: !!originalFile.path,
                path: originalFile.path || 'N/A',
                size: originalFile.size,
                name: originalFile.name,
                hasExtractedText: !!(originalDocument?.extractedText && originalDocument.extractedText.length > 0),
                extractedTextLength: originalDocument?.extractedText?.length || 0
            });
            
            // Debug log comparison file details
            console.log('🔍 Comparison file debug info:', {
                size: comparisonFile.size,
                name: comparisonFile.name,
                type: comparisonFile.type,
                lastModified: new Date(comparisonFile.lastModified).toLocaleString()
            });

            const response = await fetch(getApiUrl('/compare/compare'), {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Comparison failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('🔍 Raw API response:', result);
            
            if (result.success) {
                console.log('✅ Document comparison completed:', result);
                console.log('📄 Result keys:', Object.keys(result));
                setComparisonResult(result);
                setCurrentView('results');
            } else {
                throw new Error(result.error || 'Comparison failed');
            }

        } catch (error) {
            console.error('❌ Comparison error:', error);
            setError(error.message);
        } finally {
            setIsComparing(false);
        }
    };

    // Component for rendering line differences with enhanced formatting
    const LineDiff = ({ line, type }) => {
        const getTypeStyles = (type) => {
            switch (type) {
                case 'added':
                    return {
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(22, 163, 74, 0.12) 100%)',
                        borderLeft: '3px solid #22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.25)',
                        color: '#dcfce7',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        position: 'relative',
                        boxShadow: '0 1px 3px rgba(34, 197, 94, 0.1)',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    };
                case 'removed':
                    return {
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.12) 100%)',
                        borderLeft: '3px solid #ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#fecaca',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        position: 'relative',
                        boxShadow: '0 1px 3px rgba(239, 68, 68, 0.1)',
                        textDecoration: 'line-through',
                        textDecorationColor: '#ef4444',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    };
                case 'modified':
                    return {
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.12) 100%)',
                        borderLeft: '3px solid #f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        color: '#fef3c7',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        position: 'relative',
                        boxShadow: '0 1px 3px rgba(245, 158, 11, 0.1)',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    };
                case 'unchanged':
                    return {
                        background: 'rgba(107, 114, 128, 0.05)',
                        color: '#e5e7eb',
                        padding: '6px 8px',
                        opacity: 0.85,
                        borderRadius: '4px',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    };
                case 'placeholder':
                    return {
                        background: 'rgba(75, 85, 99, 0.05)',
                        border: '1px dashed rgba(75, 85, 99, 0.3)',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        minHeight: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b7280',
                        fontSize: '0.8rem',
                        fontStyle: 'italic'
                    };
                default:
                    return { 
                        color: '#e5e7eb',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: '0.875rem',
                        lineHeight: '1.5'
                    };
            }
        };

        const getTypeInfo = (type) => {
            switch (type) {
                case 'added':
                    return { icon: '➕', label: 'ADDED', labelColor: '#22c55e' };
                case 'removed':
                    return { icon: '➖', label: 'REMOVED', labelColor: '#ef4444' };
                case 'modified':
                    return { icon: '🔄', label: 'MODIFIED', labelColor: '#f59e0b' };
                default:
                    return { icon: '', label: '', labelColor: '' };
            }
        };

        const typeInfo = getTypeInfo(type);
        const styles = getTypeStyles(type);

        return (
            <div style={{ 
                ...styles,
                marginBottom: '4px', 
                transition: 'all 0.15s ease',
                position: 'relative'
            }}>
                {type !== 'unchanged' && type !== 'placeholder' && (
                    <div style={{
                        position: 'absolute',
                        top: '2px',
                        right: '4px',
                        background: typeInfo.labelColor,
                        color: 'white',
                        fontSize: '0.6rem',
                        fontWeight: '600',
                        padding: '1px 4px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        opacity: 0.9,
                        zIndex: 1
                    }}>
                        {typeInfo.label}
                    </div>
                )}
                
                <div>
                    {line && line.trim() ? (
                        <div>{line}</div>
                    ) : (
                        type === 'placeholder' ? 
                        <span style={{ opacity: 0.6 }}>(No corresponding line)</span> : 
                        <span style={{ opacity: 0.4 }}>&nbsp;</span>
                    )}
                </div>
            </div>
        );
    };

    // Component for rendering statistics with enhanced UI
    const ComparisonStats = ({ stats }) => {
        // Provide fallback values if stats is undefined
        const safeStats = stats || {
            added: 0,
            removed: 0,
            modified: 0,
            unchanged: 0
        };
        
        const totalChanges = safeStats.added + safeStats.removed + safeStats.modified;
        const totalSentences = totalChanges + safeStats.unchanged;
        const changePercentage = totalSentences > 0 ? Math.round((totalChanges / totalSentences) * 100) : 0;
        
        return (
            <div style={{
                background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
                borderRadius: '12px',
                padding: '0',
                marginBottom: '20px',
                border: '1px solid #404040',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #0f1419 0%, #1a1a1a 100%)',
                    padding: '20px',
                    borderBottom: '1px solid #404040',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem'
                        }}>📊</div>
                        <div>
                            <h3 style={{ margin: '0', color: '#e0e0e0', fontSize: '1.2rem', fontWeight: '600' }}>Comparison Analytics</h3>
                            <p style={{ margin: '2px 0 0 0', color: '#a0a0a0', fontSize: '0.85rem' }}>{totalSentences} sentences analyzed</p>
                        </div>
                    </div>
                    <div style={{
                        background: changePercentage > 30 ? 'rgba(239, 68, 68, 0.15)' : changePercentage > 10 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                        color: changePercentage > 30 ? '#ef4444' : changePercentage > 10 ? '#f59e0b' : '#22c55e',
                        border: changePercentage > 30 ? '1px solid rgba(239, 68, 68, 0.3)' : changePercentage > 10 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {changePercentage}% Changed
                    </div>
                </div>
                
                <div style={{ padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                        {/* Added */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '4px',
                                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                            }}></div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#22c55e', marginBottom: '4px' }}>{safeStats.added}</div>
                            <div style={{ fontSize: '0.9rem', color: '#22c55e', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Added</div>
                            <div style={{ fontSize: '0.75rem', color: '#a0a0a0', marginTop: '2px' }}>New content</div>
                        </div>
                        
                        {/* Removed */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '4px',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                            }}></div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444', marginBottom: '4px' }}>{safeStats.removed}</div>
                            <div style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Removed</div>
                            <div style={{ fontSize: '0.75rem', color: '#a0a0a0', marginTop: '2px' }}>Deleted content</div>
                        </div>
                        
                        {/* Modified */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '4px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                            }}></div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b', marginBottom: '4px' }}>{safeStats.modified}</div>
                            <div style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Modified</div>
                            <div style={{ fontSize: '0.75rem', color: '#a0a0a0', marginTop: '2px' }}>Changed content</div>
                        </div>
                        
                        {/* Unchanged */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(107, 114, 128, 0.05) 100%)',
                            border: '1px solid rgba(107, 114, 128, 0.2)',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '4px',
                                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                            }}></div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#6b7280', marginBottom: '4px' }}>{safeStats.unchanged}</div>
                            <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unchanged</div>
                            <div style={{ fontSize: '0.75rem', color: '#a0a0a0', marginTop: '2px' }}>Original content</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Component for AI Analysis with enhanced UI
    const AIAnalysisPanel = ({ analysis }) => {
        if (!analysis) return null;

        const getSignificanceBadgeStyle = (significance) => {
            const styles = {
                high: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' },
                medium: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' },
                low: { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }
            };
            return styles[significance] || styles.medium;
        };

        const getRiskBadgeStyle = (risk) => {
            const styles = {
                high: { background: '#ef4444', color: 'white' },
                medium: { background: '#f59e0b', color: 'white' },
                low: { background: '#22c55e', color: 'white' }
            };
            return styles[risk] || styles.medium;
        };

        return (
            <div style={{
                background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
                borderRadius: '12px',
                padding: '0',
                marginBottom: '20px',
                border: '1px solid #404040',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #0f1419 0%, #1a1a1a 100%)',
                    padding: '20px',
                    borderBottom: '1px solid #404040',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #00aaff 0%, #0077b3 100%)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem'
                        }}>🤖</div>
                        <div>
                            <h3 style={{ margin: '0', color: '#e0e0e0', fontSize: '1.2rem', fontWeight: '600' }}>AI Legal Analysis</h3>
                            <p style={{ margin: '2px 0 0 0', color: '#a0a0a0', fontSize: '0.85rem' }}>Powered by Advanced Legal AI</p>
                        </div>
                    </div>
                    {analysis.significance && (
                        <div style={{
                            ...getSignificanceBadgeStyle(analysis.significance),
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            {analysis.significance} Impact
                        </div>
                    )}
                </div>

                <div style={{ padding: '20px' }}>
                    {/* Summary Section */}
                    {analysis.summary && (
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #00aaff 0%, #0077b3 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem'
                                }}>📋</div>
                                <h4 style={{ margin: '0', color: '#00aaff', fontSize: '1rem', fontWeight: '600' }}>Executive Summary</h4>
                            </div>
                            <div style={{
                                background: 'rgba(0, 170, 255, 0.05)',
                                border: '1px solid rgba(0, 170, 255, 0.2)',
                                borderRadius: '8px',
                                padding: '16px',
                                borderLeft: '4px solid #00aaff'
                            }}>
                                <p style={{ margin: '0', lineHeight: '1.6', color: '#e0e0e0', fontSize: '0.95rem' }}>{analysis.summary}</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Overall Assessment */}
                    {analysis.overallAssessment && (
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem'
                                }}>⚖️</div>
                                <h4 style={{ margin: '0', color: '#8b5cf6', fontSize: '1rem', fontWeight: '600' }}>Legal Assessment</h4>
                            </div>
                            <div style={{
                                background: 'rgba(139, 92, 246, 0.05)',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                borderRadius: '8px',
                                padding: '16px',
                                borderLeft: '4px solid #8b5cf6'
                            }}>
                                <p style={{ margin: '0', lineHeight: '1.6', color: '#e0e0e0', fontSize: '0.95rem' }}>{analysis.overallAssessment}</p>
                            </div>
                        </div>
                    )}

                    {/* Key Changes */}
                    {analysis.keyChanges && analysis.keyChanges.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem'
                                }}>🔍</div>
                                <h4 style={{ margin: '0', color: '#ef4444', fontSize: '1rem', fontWeight: '600' }}>Critical Changes Identified</h4>
                                <div style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    borderRadius: '12px',
                                    padding: '2px 8px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}>{analysis.keyChanges.length}</div>
                            </div>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {analysis.keyChanges.map((change, index) => (
                                    <div key={index} style={{
                                        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
                                        border: '1px solid #333',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: '0',
                                            left: '0',
                                            width: '4px',
                                            height: '100%',
                                            background: change.risk === 'high' ? '#ef4444' : change.risk === 'medium' ? '#f59e0b' : '#22c55e'
                                        }}></div>
                                        
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            marginBottom: '8px'
                                        }}>
                                            <div style={{
                                                fontWeight: '600',
                                                color: '#f59e0b',
                                                fontSize: '0.9rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {change.type} Change
                                            </div>
                                            <div style={{
                                                ...getRiskBadgeStyle(change.risk),
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '0.7rem',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {change.risk} Risk
                                            </div>
                                        </div>
                                        
                                        <h5 style={{
                                            margin: '0 0 8px 0',
                                            color: '#e0e0e0',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            lineHeight: '1.3'
                                        }}>
                                            {change.description}
                                        </h5>
                                        
                                        <p style={{
                                            margin: '0',
                                            fontSize: '0.9rem',
                                            color: '#c0c0c0',
                                            lineHeight: '1.5'
                                        }}>
                                            {change.legalImplication}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                        <div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem'
                                }}>💡</div>
                                <h4 style={{ margin: '0', color: '#22c55e', fontSize: '1rem', fontWeight: '600' }}>Expert Recommendations</h4>
                                <div style={{
                                    background: '#22c55e',
                                    color: 'white',
                                    borderRadius: '12px',
                                    padding: '2px 8px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}>{analysis.recommendations.length}</div>
                            </div>
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {analysis.recommendations.map((rec, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        padding: '12px',
                                        background: 'rgba(34, 197, 94, 0.05)',
                                        border: '1px solid rgba(34, 197, 94, 0.2)',
                                        borderRadius: '8px',
                                        borderLeft: '3px solid #22c55e'
                                    }}>
                                        <div style={{
                                            background: '#22c55e',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            flexShrink: 0,
                                            marginTop: '1px'
                                        }}>
                                            {index + 1}
                                        </div>
                                        <p style={{
                                            margin: '0',
                                            lineHeight: '1.5',
                                            color: '#e0e0e0',
                                            fontSize: '0.9rem'
                                        }}>
                                            {rec}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render upload view or results view
    const renderContent = () => {
        if (currentView === 'results' && comparisonResult) {
            console.log('🔍 Raw comparison result keys:', Object.keys(comparisonResult));
            console.log('🔍 Full comparison result:', comparisonResult);
            
            const { diff, statistics, aiAnalysis, originalText, comparisonText } = comparisonResult;
            
            console.log('📊 Diff data array length:', diff?.length || 0);
            console.log('📊 First 3 diff items:', diff?.slice(0, 3));
            console.log('📈 Statistics:', statistics);
            console.log('🤖 AI Analysis keys:', aiAnalysis ? Object.keys(aiAnalysis) : 'none');
            console.log('📄 Original text (first 200 chars):', originalText?.substring(0, 200) || 'NONE');
            console.log('📄 Comparison text (first 200 chars):', comparisonText?.substring(0, 200) || 'NONE');
            console.log('📄 Text lengths - Original:', originalText?.length || 0, 'Comparison:', comparisonText?.length || 0);
            
            // Enhanced fallback handling
            if (!diff || diff.length === 0) {
                console.log('⚠️ No diff data available, creating simple comparison view');
                
                // Create a simple side-by-side view using raw text if available
                if (originalText || comparisonText) {
                    const origLines = (originalText || 'No content available').split('\n').filter(line => line.trim());
                    const compLines = (comparisonText || 'No content available').split('\n').filter(line => line.trim());
                    
                    const simpleDifferences = {
                        originalSentences: origLines.map(line => ({ text: line, type: 'unchanged' })),
                        comparisonSentences: compLines.map(line => ({ text: line, type: 'unchanged' }))
                    };
                    
                    console.log('📄 Created simple view - Original lines:', origLines.length, 'Comparison lines:', compLines.length);
                } else {
                    return (
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                            <h3>📊 Comparison Issue</h3>
                            <p>No text data or differences found. This might indicate an extraction problem.</p>
                            <button onClick={() => setCurrentView('upload')} style={{ 
                                background: '#6b7280', color: 'white', border: 'none', 
                                borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' 
                            }}>↩ Back to Upload</button>
                        </div>
                    );
                }
            }
            
            // Transform diff into aligned side-by-side format
            const originalSentences = [];
            const comparisonSentences = [];
            
            console.log('🔄 Starting transformation of', diff?.length, 'diff items');
            
            // If diff data is not available or empty, try to use raw text data
            if (!diff || diff.length === 0) {
                console.log('⚠️ No diff data available, attempting to use raw text data');
                if (originalText && comparisonText) {
                    // Split texts into sentences for basic comparison
                    const origSentences = originalText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
                    const compSentences = comparisonText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
                    
                    console.log('📄 Split original into', origSentences.length, 'sentences');
                    console.log('📄 Split comparison into', compSentences.length, 'sentences');
                    
                    const maxLength = Math.max(origSentences.length, compSentences.length);
                    
                    for (let i = 0; i < maxLength; i++) {
                        const origSentence = origSentences[i] || '';
                        const compSentence = compSentences[i] || '';
                        
                        // Determine change type based on content
                        let changeType = 'unchanged';
                        if (!origSentence && compSentence) {
                            changeType = 'added';
                        } else if (origSentence && !compSentence) {
                            changeType = 'removed';
                        } else if (origSentence && compSentence && origSentence.trim() !== compSentence.trim()) {
                            changeType = 'modified';
                        }
                        
                        // Handle the display properly for side-by-side comparison
                        originalSentences.push({
                            text: origSentence,
                            type: changeType === 'added' ? 'placeholder' : changeType
                        });
                        comparisonSentences.push({
                            text: compSentence,
                            type: changeType === 'removed' ? 'placeholder' : changeType
                        });
                    }
                }
            } else {
                // Use diff data if available - process it correctly
            console.log('📄 Processing diff data with', diff.length, 'changes');
            console.log('🔍 Diff data structure check:', diff.slice(0, 3));
                
                diff.forEach((change, index) => {
                    if (index < 5) { // Only log first 5 for debugging
                        console.log(`Item ${index}:`, {
                            type: change.type,
                            hasOriginal: !!change.originalText,
                            hasComparison: !!change.comparisonText,
                            origPreview: change.originalText?.substring(0, 50) || 'NULL',
                            compPreview: change.comparisonText?.substring(0, 50) || 'NULL'
                        });
                    }
                    
                    // Skip entries where both original and comparison are null/empty
                    if (!change.originalText && !change.comparisonText) {
                        console.log(`Skipping empty change at index ${index}`);
                        return; // Skip this iteration
                    }
                    
                    switch (change.type) {
                        case 'unchanged':
                        case 'modified':
                            // Both sides have content
                            if (change.originalText || change.comparisonText) {
                                originalSentences.push({
                                    text: change.originalText || '',
                                    type: change.type
                                });
                                comparisonSentences.push({
                                    text: change.comparisonText || '',
                                    type: change.type
                                });
                            }
                            break;
                        
                        case 'removed':
                            // Only original has content - show it on left, placeholder on right
                            if (change.originalText) {
                                originalSentences.push({
                                    text: change.originalText,
                                    type: change.type
                                });
                                comparisonSentences.push({
                                    text: '',
                                    type: 'placeholder'
                                });
                            }
                            break;
                        
                        case 'added':
                            // Only comparison has content - placeholder on left, content on right
                            if (change.comparisonText) {
                                originalSentences.push({
                                    text: '',
                                    type: 'placeholder'
                                });
                                comparisonSentences.push({
                                    text: change.comparisonText,
                                    type: change.type
                                });
                            }
                            break;
                    }
                });
                
                console.log('📄 Final processed sentences:');
                console.log('Original sentences:', originalSentences.length, 'items');
                console.log('Comparison sentences:', comparisonSentences.length, 'items');
                console.log('Sample original:', originalSentences.slice(0, 3).map(s => `${s.type}: ${s.text?.substring(0, 30) || 'empty'}`));
                console.log('Sample comparison:', comparisonSentences.slice(0, 3).map(s => `${s.type}: ${s.text?.substring(0, 30) || 'empty'}`));
            }
            
            console.log('📊 Final transformation results:');
            console.log('Original sentences:', originalSentences.length);
            console.log('Comparison sentences:', comparisonSentences.length);
            
            // Ensure we have the differences variable defined
            let differences;
            
            // Use the processed data if we have it, otherwise use simple fallback
            if (originalSentences.length > 0 || comparisonSentences.length > 0) {
                differences = { originalSentences, comparisonSentences };
            } else if (originalText || comparisonText) {
                // Fallback to simple line-by-line split
                console.log('⚠️ Using text-based fallback for line comparison');
                const origLines = (originalText || '').split(/[.!?]\s+/).filter(s => s.trim().length > 10);
                const compLines = (comparisonText || '').split(/[.!?]\s+/).filter(s => s.trim().length > 10);
                
                console.log('📄 Fallback split results:', { origLines: origLines.length, compLines: compLines.length });
                console.log('📄 Sample original lines:', origLines.slice(0, 3));
                console.log('📄 Sample comparison lines:', compLines.slice(0, 3));
                
                // Create proper alignment without excessive placeholders
                const maxLength = Math.max(origLines.length, compLines.length);
                const fallbackOriginal = [];
                const fallbackComparison = [];
                
                for (let i = 0; i < maxLength; i++) {
                    const origLine = origLines[i];
                    const compLine = compLines[i];
                    
                    if (origLine && compLine) {
                        // Both exist
                        fallbackOriginal.push({ text: origLine.trim(), type: 'unchanged' });
                        fallbackComparison.push({ text: compLine.trim(), type: 'unchanged' });
                    } else if (origLine) {
                        // Only original exists
                        fallbackOriginal.push({ text: origLine.trim(), type: 'removed' });
                        fallbackComparison.push({ text: '', type: 'placeholder' });
                    } else if (compLine) {
                        // Only comparison exists
                        fallbackOriginal.push({ text: '', type: 'placeholder' });
                        fallbackComparison.push({ text: compLine.trim(), type: 'added' });
                    }
                }
                
                differences = {
                    originalSentences: fallbackOriginal,
                    comparisonSentences: fallbackComparison
                };
                
                console.log('📄 Fallback created - Original:', origLines.length, 'Comparison:', compLines.length);
            } else {
                // Last resort - empty comparison
                differences = {
                    originalSentences: [{ text: 'No content available', type: 'placeholder' }],
                    comparisonSentences: [{ text: 'No content available', type: 'placeholder' }]
                };
            }
            
            return (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        paddingBottom: '16px',
                        borderBottom: '1px solid #404040'
                    }}>
                        <div>
                            <h2 style={{ margin: 0, color: '#e0e0e0' }}>📊 Document Comparison Results</h2>
                            <p style={{ margin: '4px 0 0 0', color: '#b0b0b0', fontSize: '0.9rem' }}>
                                Comparing: {originalDocument?.originalName || 'Original'} ↔ {comparisonFile?.name}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={() => setCurrentView('upload')}
                                style={{
                                    background: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '8px 16px',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                ↩ Back to Upload
                            </button>
                            <button 
                                onClick={onClose}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#b0b0b0',
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >✕</button>
                        </div>
                    </div>
                    
                    {/* Warning banner for fallback content */}
                    {comparisonResult.fallbackUsed && (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            <div style={{
                                background: '#f59e0b',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                flexShrink: 0
                            }}>⚠️</div>
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#f59e0b', fontSize: '1rem', fontWeight: '600' }}>Document Extraction Issue</h4>
                                <p style={{ margin: '0 0 8px 0', color: '#e0e0e0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    {comparisonResult.extractionDetails ? (
                                        <>
                                            {comparisonResult.extractionDetails.originalExtractionFailed && comparisonResult.extractionDetails.comparisonExtractionFailed 
                                                ? 'Both documents could not be processed properly. Using fallback content for comparison.'
                                                : comparisonResult.extractionDetails.originalExtractionFailed
                                                ? 'The original document could not be processed properly. Using fallback content for the original.'
                                                : 'The comparison document could not be processed properly. Using fallback content for the comparison.'
                                            }
                                        </>
                                    ) : (
                                        'Some documents could not be processed properly. This comparison may be using fallback content.'
                                    )}
                                </p>
                                <div style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>
                                    <strong>Suggestions:</strong> Try uploading text-based PDFs, DOCX files, or ensure your PDFs are not corrupted, encrypted, or image-based.
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Main content area with summary and AI analysis */}
                    <div style={{ 
                        flex: 1,
                        overflowY: 'auto', 
                        marginBottom: '20px',
                        paddingRight: '8px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#444 transparent'
                    }} className="custom-scrollbar">
                        <ComparisonStats stats={statistics} />
                        <AIAnalysisPanel analysis={aiAnalysis} />
                    </div>
                    
                    {/* Fixed bottom collapsible section */}
                    <div style={{ 
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column-reverse', // This makes it expand upward
                        minHeight: 'auto'
                    }}>
                        {/* Collapsible Content - positioned first due to column-reverse */}
                        {!isTextComparisonCollapsed && (
                            <div style={{
                                overflow: 'hidden',
                                transition: 'max-height 0.3s ease, opacity 0.3s ease',
                                maxHeight: '500px',
                                opacity: '1',
                                display: 'flex',
                                gap: '16px',
                                background: '#1a1a1a',
                                border: '1px solid #404040',
                                borderBottom: 'none',
                                borderRadius: '8px 8px 0 0',
                                minHeight: 0,
                                marginBottom: '0'
                            }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#e0e0e0', fontSize: '1rem', fontWeight: '600' }}>📄 Original Document</h4>
                                    <div style={{
                                        flex: 1,
                                        background: '#0f0f0f',
                                        border: '1px solid #333',
                                        borderRadius: '6px',
                                        padding: '16px',
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.6',
                                        minHeight: '400px',
                                        maxHeight: '400px'
                                    }} className="custom-scrollbar">
                                        {differences.originalSentences?.map((lineItem, index) => (
                                            <LineDiff 
                                                key={`orig-${index}`} 
                                                line={lineItem.text} 
                                                type={lineItem.type} 
                                            />
                                        ))}
                                    </div>
                                </div>
                                
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#e0e0e0', fontSize: '1rem', fontWeight: '600' }}>📄 Comparison Document</h4>
                                    <div style={{
                                        flex: 1,
                                        background: '#0f0f0f',
                                        border: '1px solid #333',
                                        borderRadius: '6px',
                                        padding: '16px',
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.6',
                                        minHeight: '400px',
                                        maxHeight: '400px'
                                    }} className="custom-scrollbar">
                                        {differences.comparisonSentences?.map((lineItem, index) => (
                                            <LineDiff 
                                                key={`comp-${index}`} 
                                                line={lineItem.text} 
                                                type={lineItem.type} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Fixed Bottom Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
                            border: '1px solid #404040',
                            borderRadius: isTextComparisonCollapsed ? '8px' : '0 0 8px 8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'sticky',
                            bottom: 0,
                            zIndex: 10
                        }} onClick={() => setIsTextComparisonCollapsed(!isTextComparisonCollapsed)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem'
                                }}>📝</div>
                                <div>
                                    <h3 style={{ 
                                        margin: 0, 
                                        color: '#e0e0e0', 
                                        fontSize: '1.1rem', 
                                        fontWeight: '600' 
                                    }}>Enhanced Line-by-Line Comparison</h3>
                                    <p style={{ 
                                        margin: '2px 0 0 0', 
                                        color: '#a0a0a0', 
                                        fontSize: '0.85rem' 
                                    }}>
                                        {isTextComparisonCollapsed ? 'Click to expand AI-formatted line comparison' : 'Side-by-side analysis with AI-powered formatting'}
                                    </p>
                                </div>
                            </div>
                            <div style={{
                                background: isTextComparisonCollapsed ? 'rgba(99, 102, 241, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: isTextComparisonCollapsed ? '#6366f1' : '#ef4444',
                                border: isTextComparisonCollapsed ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '20px',
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease'
                            }}>
                                <span>{isTextComparisonCollapsed ? '▲' : '▼'}</span>
                                {isTextComparisonCollapsed ? 'Expand Up' : 'Collapse'}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        
        // Upload view
        return (
            <div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <h2 style={{ margin: 0 }}>📊 Document Comparison</h2>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#b0b0b0',
                            fontSize: '18px',
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                    >✕</button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>Original Document</h3>
                    
                    {originalFile && originalFile.isFromProps ? (
                        <div style={{
                            background: '#2a2a2a',
                            border: '1px solid #22c55e',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.2rem', color: '#22c55e' }}>✅</span>
                                <div>
                                    <div style={{ color: '#22c55e', fontWeight: '600' }}>{originalFile.name} <span style={{ color: '#9ca3af', fontWeight: '400' }}>(current)</span></div>
                                    {originalFile.size > 0 && (
                                        <div style={{ fontSize: '0.8rem', color: '#b0b0b0' }}>
                                            {(originalFile.size / 1024 / 1024).toFixed(2)} MB
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        !originalFile ? (
                            <div 
                                onClick={() => originalFileInputRef.current?.click()}
                                style={{
                                    background: '#2a2a2a',
                                    border: '2px dashed #404040',
                                    borderRadius: '8px',
                                    padding: '30px 20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📄</div>
                                <div><strong>Click to upload original document</strong></div>
                                <div style={{ fontSize: '0.9rem', color: '#b0b0b0', marginTop: '5px' }}>
                                    PDF, DOC, DOCX, TXT files supported
                                </div>
                                <input
                                    type="file"
                                    ref={originalFileInputRef}
                                    onChange={handleOriginalFileSelect}
                                    accept=".pdf,.doc,.docx,.txt"
                                    style={{ display: 'none' }}
                                />
                            </div>
                        ) : (
                            <div style={{
                                background: '#2a2a2a',
                                border: '1px solid #22c55e',
                                borderRadius: '8px',
                                padding: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.2rem', color: '#22c55e' }}>✅</span>
                                    <div>
                                        <div style={{ color: '#22c55e', fontWeight: '600' }}>{originalFile.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#b0b0b0' }}>
                                            {(originalFile.size / 1024 / 1024).toFixed(2)} MB
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleRemoveOriginalFile}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#b0b0b0',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >✕</button>
                            </div>
                        )
                    )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>Comparison Document</h3>
                    
                    {!comparisonFile ? (
                        <div 
                            onClick={() => comparisonFileInputRef.current?.click()}
                            style={{
                                background: '#2a2a2a',
                                border: '2px dashed #404040',
                                borderRadius: '8px',
                                padding: '30px 20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔄</div>
                            <div><strong>Click to upload comparison document</strong></div>
                            <div style={{ fontSize: '0.9rem', color: '#b0b0b0', marginTop: '5px' }}>
                                PDF, DOC, DOCX, TXT files supported
                            </div>
                            <input
                                type="file"
                                ref={comparisonFileInputRef}
                                onChange={handleComparisonFileSelect}
                                accept=".pdf,.doc,.docx,.txt"
                                style={{ display: 'none' }}
                            />
                        </div>
                    ) : (
                        <div style={{
                            background: '#2a2a2a',
                            border: '1px solid #3b82f6',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.2rem', color: '#3b82f6' }}>🔄</span>
                                <div>
                                    <div style={{ color: '#3b82f6', fontWeight: '600' }}>{comparisonFile.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#b0b0b0' }}>
                                        {(comparisonFile.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={handleRemoveComparisonFile}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#b0b0b0',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >✕</button>
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '6px',
                        padding: '10px',
                        marginBottom: '20px',
                        color: '#ef4444',
                        fontSize: '0.9rem'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <div style={{ textAlign: 'center' }}>
                    <button 
                        onClick={handleCompare}
                        disabled={!comparisonFile || isComparing}
                        style={{
                            background: (!comparisonFile || isComparing) ? '#6c757d' : 'linear-gradient(135deg, #00aaff 0%, #0077b3 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            fontSize: '1rem',
                            cursor: (!comparisonFile || isComparing) ? 'not-allowed' : 'pointer',
                            opacity: (!comparisonFile || isComparing) ? 0.6 : 1
                        }}
                    >
                        {isComparing ? '⏳ Comparing...' : '📊 Compare Documents'}
                    </button>
                    
                    {!comparisonFile && (
                        <div style={{ 
                            marginTop: '12px', 
                            fontSize: '0.85rem', 
                            color: '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}>
                            ⚠️ Please upload a comparison document to proceed
                        </div>
                    )}
                </div>

                <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: '#2a2a2a',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#b0b0b0'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#e0e0e0' }}>🚀 What You'll Get</h4>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        <div>📊 True document-to-document comparison</div>
                        <div>🔍 Highlighted changes and differences</div>
                        <div>🤖 AI-powered legal analysis</div>
                        <div>📈 Change statistics and insights</div>
                        <div>✨ No more fallback content issues</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: '#1a1a1a',
                border: '1px solid #404040',
                borderRadius: '16px',
                width: currentView === 'results' ? '95vw' : '600px',
                maxWidth: currentView === 'results' ? '95vw' : '90vw',
                height: currentView === 'results' ? '90vh' : 'auto',
                maxHeight: '90vh',
                padding: '24px',
                color: '#e0e0e0',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default DocumentComparison;
