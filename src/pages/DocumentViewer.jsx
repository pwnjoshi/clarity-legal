import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './DocumentViewer.css';

export default function DocumentViewer() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClause, setSelectedClause] = useState(null);
  const [hoveredHighlight, setHoveredHighlight] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState('analysis'); // 'original' or 'analysis'

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      
      // Get document from Firestore
      const docRef = doc(db, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const documentData = {
          id: docSnap.id,
          ...docSnap.data()
        };
        setDocument(documentData);
      } else {
        // Fallback to mock data for demonstration
        setDocument({
          id: documentId,
          originalName: 'Sample Legal Document.pdf',
          extractedText: `SOFTWARE LICENSE AGREEMENT

This Software License Agreement ("Agreement") is entered into on the date of installation by and between Software Company ("Licensor") and you ("Licensee").

1. LICENSE GRANT
Subject to the terms and conditions of this Agreement, Licensor hereby grants to Licensee a non-exclusive, non-transferable license to use the Software.

2. RESTRICTIONS
Licensee shall not:
(a) copy, modify, or create derivative works of the Software;
(b) reverse engineer, decompile, or disassemble the Software;
(c) distribute, rent, lease, or sublicense the Software.

3. TERMINATION
This Agreement may be terminated by either party with thirty (30) days written notice.

4. LIABILITY LIMITATION
IN NO EVENT SHALL LICENSOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.

5. GOVERNING LAW
This Agreement shall be governed by the laws of the State of California.`,
          analysis: {
            simplifiedText: "This is a software license agreement that gives you permission to use software with certain restrictions. The company retains ownership and limits what you can do with the software.",
            riskAnalysis: {
              overallRisk: "medium",
              riskFactors: [
                { level: "medium", description: "Limited usage rights with strict restrictions" },
                { level: "high", description: "Liability limitations favor the software company" }
              ]
            },
            highlightedSections: [
              {
                text: "non-exclusive, non-transferable license",
                startIndex: 285,
                endIndex: 320,
                type: "right",
                explanation: "You get permission to use the software, but you can't sell or transfer this permission to others",
                severity: "medium"
              },
              {
                text: "SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES",
                startIndex: 820,
                endIndex: 905,
                type: "risk",
                explanation: "The company limits its responsibility if the software causes problems or damages",
                severity: "high"
              },
              {
                text: "copy, modify, or create derivative works",
                startIndex: 405,
                endIndex: 444,
                type: "obligation",
                explanation: "You cannot make copies or changes to the software",
                severity: "medium"
              }
            ],
            clauses: [
              {
                title: "License Grant",
                content: "Subject to the terms and conditions of this Agreement, Licensor hereby grants to Licensee a non-exclusive, non-transferable license to use the Software.",
                type: "other",
                importance: "high",
                explanation: "This gives you permission to use the software but with limitations. You can't transfer or sell this permission."
              },
              {
                title: "Restrictions",
                content: "Licensee shall not: (a) copy, modify, or create derivative works of the Software; (b) reverse engineer, decompile, or disassemble the Software; (c) distribute, rent, lease, or sublicense the Software.",
                type: "other",
                importance: "high",
                explanation: "These are things you're not allowed to do with the software. Breaking these rules could terminate your license."
              },
              {
                title: "Liability Limitation",
                content: "IN NO EVENT SHALL LICENSOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.",
                type: "liability",
                importance: "high",
                explanation: "The company limits its responsibility for problems. If the software causes issues, they won't pay for certain types of damages."
              }
            ],
            keyTerms: [
              { term: "Non-exclusive", definition: "You're not the only one who can use this software" },
              { term: "Non-transferable", definition: "You can't give or sell your license to someone else" },
              { term: "Derivative works", definition: "Modified versions or improvements based on the original software" }
            ]
          },
          fileType: '.pdf',
          status: 'processed'
        });
      }
      
    } catch (error) {
      console.error('Error loading document:', error);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const renderHighlightedText = (text, highlights) => {
    if (!highlights || highlights.length === 0) {
      return <div className="document-text">{text}</div>;
    }

    // Sort highlights by startIndex
    const sortedHighlights = [...highlights].sort((a, b) => a.startIndex - b.startIndex);
    
    const elements = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {text.substring(lastIndex, highlight.startIndex)}
          </span>
        );
      }

      // Add highlighted text
      const highlightClass = `highlight ${highlight.type} ${highlight.severity}`;
      elements.push(
        <span
          key={`highlight-${index}`}
          className={highlightClass}
          onMouseEnter={(e) => {
            setHoveredHighlight(highlight);
            setTooltipPosition({ 
              x: e.clientX + 10, 
              y: e.clientY - 10 
            });
          }}
          onMouseMove={(e) => {
            setTooltipPosition({ 
              x: e.clientX + 10, 
              y: e.clientY - 10 
            });
          }}
          onMouseLeave={() => setHoveredHighlight(null)}
          data-explanation={highlight.explanation}
        >
          {highlight.text}
        </span>
      );

      lastIndex = highlight.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return <div className="document-text">{elements}</div>;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ff4444';
      case 'medium': return '#ff9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <div className="document-viewer loading">
        <div className="loading-spinner">
          <div>🔄 Loading document...</div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="document-viewer error">
        <div className="error-message">
          <h2>❌ Error</h2>
          <p>{error || 'Document not found'}</p>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="document-viewer">
      {/* Header */}
      <header className="viewer-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>{document.originalName}</h1>
        <div className="view-modes">
          <button
            className={viewMode === 'analysis' ? 'active' : ''}
            onClick={() => setViewMode('analysis')}
          >
            📊 Analysis View
          </button>
          <button
            className={viewMode === 'original' ? 'active' : ''}
            onClick={() => setViewMode('original')}
          >
            📄 Original Text
          </button>
        </div>
      </header>

      <div className="viewer-content">
        {/* Main Document Area */}
        <main className="document-main">
          <div className="document-container">
            {viewMode === 'analysis' ? (
              <>
                <h2>📄 Document with Highlights</h2>
                <div className="document-wrapper">
                  {renderHighlightedText(document.extractedText, document.analysis?.highlightedSections)}
                </div>
                
                {/* Hover Tooltip */}
                {hoveredHighlight && (
                  <div 
                    className="hover-tooltip" 
                    style={{ 
                      position: 'fixed', 
                      left: `${tooltipPosition.x}px`,
                      top: `${tooltipPosition.y}px`,
                      zIndex: 1000 
                    }}
                  >
                    <div className="tooltip-content">
                      <h4>{hoveredHighlight.type.charAt(0).toUpperCase() + hoveredHighlight.type.slice(1)}</h4>
                      <p>{hoveredHighlight.explanation}</p>
                      <span className="severity" style={{ color: getSeverityColor(hoveredHighlight.severity) }}>
                        {hoveredHighlight.severity.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2>📄 Original Document Text</h2>
                <div className="document-wrapper">
                  <div className="document-text original">
                    {document.extractedText}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="analysis-sidebar">
          {/* Risk Assessment */}
          <div className="sidebar-section risk-section">
            <h3>🚦 Risk Assessment</h3>
            <div className={`risk-level ${document.analysis?.riskAnalysis?.overallRisk}`}>
              <span className="risk-indicator">
                {document.analysis?.riskAnalysis?.overallRisk === 'high' ? '🔴' : 
                 document.analysis?.riskAnalysis?.overallRisk === 'medium' ? '🟡' : '🟢'}
              </span>
              <span className="risk-text">
                {document.analysis?.riskAnalysis?.overallRisk?.toUpperCase()} RISK
              </span>
            </div>
            <div className="risk-factors">
              {document.analysis?.riskAnalysis?.riskFactors?.map((factor, index) => (
                <div key={index} className={`risk-factor ${factor.level}`}>
                  <span className="factor-level" style={{ color: getSeverityColor(factor.level) }}>
                    {factor.level.toUpperCase()}:
                  </span>
                  <span className="factor-desc">{factor.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Clauses */}
          <div className="sidebar-section clauses-section">
            <h3>📋 Important Clauses</h3>
            <div className="clauses-list">
              {document.analysis?.clauses?.map((clause, index) => (
                <div 
                  key={index} 
                  className={`clause-item ${selectedClause === index ? 'selected' : ''} ${clause.importance}`}
                  onClick={() => setSelectedClause(selectedClause === index ? null : index)}
                >
                  <div className="clause-header">
                    <span className="clause-title">{clause.title}</span>
                    <span className={`importance-badge ${clause.importance}`}>
                      {clause.importance.toUpperCase()}
                    </span>
                  </div>
                  {selectedClause === index && (
                    <div className="clause-details">
                      <p className="clause-content">{clause.content}</p>
                      <div className="clause-explanation">
                        <strong>What this means:</strong>
                        <p>{clause.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Key Terms */}
          <div className="sidebar-section terms-section">
            <h3>📚 Key Terms</h3>
            <div className="terms-list">
              {document.analysis?.keyTerms?.map((term, index) => (
                <div key={index} className="term-item">
                  <strong className="term-name">{term.term}:</strong>
                  <span className="term-definition">{term.definition}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="sidebar-section summary-section">
            <h3>📝 Plain English Summary</h3>
            <div className="summary-text">
              {document.analysis?.simplifiedText}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
