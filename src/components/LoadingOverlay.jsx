import React from 'react';

/**
 * LoadingOverlay - Component to show loading status for document processing
 */
const LoadingOverlay = ({ loading, progress = 0, message = "Processing document..." }) => {
    if (!loading) return null;
    
    return (
        <div className="loading-overlay">
            <div className="loading-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
                <h3 className="loading-title">{message}</h3>
                
                {progress > 0 && (
                    <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        <div className="progress-text">{Math.round(progress)}%</div>
                    </div>
                )}
                
                <p className="loading-info">
                    This may take a moment for large documents
                </p>
            </div>
            
            <style jsx="true">{`
                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(26, 26, 26, 0.85);
                    backdrop-filter: blur(3px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10;
                    animation: fadeIn 0.3s ease-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .loading-container {
                    background-color: #222;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    text-align: center;
                    width: 300px;
                    border: 1px solid #383838;
                    max-width: 80%;
                }
                
                .loading-spinner {
                    margin-bottom: 20px;
                }
                
                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid transparent;
                    border-top: 5px solid #8d6ff0;
                    border-right: 5px solid #6366f1;
                    border-radius: 50%;
                    margin: 0 auto;
                    animation: spin 1s linear infinite;
                    box-shadow: 0 0 15px rgba(141, 111, 240, 0.2);
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .loading-title {
                    color: #e0e0e0;
                    font-size: 18px;
                    margin: 0 0 15px 0;
                    background: linear-gradient(90deg, #8d6ff0, #6366f1);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                .progress-container {
                    height: 8px;
                    background-color: #333;
                    border-radius: 4px;
                    margin: 15px 0;
                    overflow: hidden;
                    position: relative;
                }
                
                .progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #8d6ff0, #6366f1);
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }
                
                .progress-text {
                    position: absolute;
                    top: -20px;
                    right: 0;
                    color: #a8a8a8;
                    font-size: 12px;
                }
                
                .loading-info {
                    color: #a8a8a8;
                    font-size: 14px;
                    margin: 10px 0 0;
                }
            `}</style>
        </div>
    );
};

export default LoadingOverlay;