import { extractTextFromDocument } from './documentService.js';
import geminiService from './geminiService.js';

// Document Comparison Service with AI-powered analysis
class DocumentComparisonService {
    constructor() {
        this.diffTypes = {
            ADDED: 'added',
            REMOVED: 'removed', 
            MODIFIED: 'modified',
            UNCHANGED: 'unchanged'
        };
    }

    // Main comparison method - file paths
    async compareDocuments(originalDocPath, comparisonDocPath) {
        try {
            console.log('🔄 Starting document comparison...');
            
            // Extract text from both documents
            console.log(`📄 Extracting text from original: ${originalDocPath}`);
            console.log(`📄 Extracting text from comparison: ${comparisonDocPath}`);
            
            const [originalText, comparisonText] = await Promise.all([
                extractTextFromDocument(originalDocPath),
                extractTextFromDocument(comparisonDocPath)
            ]);

            console.log(`📄 Text extracted - Original: ${originalText.length} chars, Comparison: ${comparisonText.length} chars`);
            
            return this.compareTexts(originalText, comparisonText);

        } catch (error) {
            console.error('❌ Document comparison error:', error);
            throw new Error(`Failed to compare documents: ${error.message}`);
        }
    }
    
    // New method for direct text comparison
    async compareTexts(originalText, comparisonText) {
        try {
            console.log('🔄 Starting text comparison...');
            console.log(`📄 Text lengths - Original: ${originalText.length} chars, Comparison: ${comparisonText.length} chars`);
            
            // Log a sample of each document for debugging
            console.log('🔍 Original text sample:', originalText.substring(0, 100) + (originalText.length > 100 ? '...' : ''));
            console.log('🔍 Comparison text sample:', comparisonText.substring(0, 100) + (comparisonText.length > 100 ? '...' : ''));

            // Apply AI-powered line formatting to both texts
            console.log('✨ Applying AI-powered line formatting for better comparison...');
            const [formattedOriginal, formattedComparison] = await Promise.all([
                this.formatTextForLineComparison(originalText),
                this.formatTextForLineComparison(comparisonText)
            ]);
            
            console.log(`📄 Formatted lengths - Original: ${formattedOriginal.length} chars, Comparison: ${formattedComparison.length} chars`);

            // Perform enhanced line-by-line diff analysis
            const lineDiff = this.performLineByLineDiff(formattedOriginal, formattedComparison);
            
            // Also perform sentence-based diff for backup
            const sentenceDiff = this.performBasicDiff(formattedOriginal, formattedComparison);
            
            // Enhance with AI analysis if available
            const aiAnalysis = await this.performAIAnalysis(formattedOriginal, formattedComparison, lineDiff);
            
            // Generate enhanced statistics for both types
            const lineStats = this.generateStatistics(lineDiff);
            const sentenceStats = this.generateStatistics(sentenceDiff);
            
            console.log('✅ Enhanced text comparison completed');
            
            return {
                success: true,
                originalText: formattedOriginal,
                comparisonText: formattedComparison,
                lineDiff, // Primary line-by-line comparison
                sentenceDiff, // Backup sentence comparison
                diff: lineDiff, // For backward compatibility
                aiAnalysis,
                statistics: lineStats,
                sentenceStatistics: sentenceStats,
                timestamp: new Date()
            };

        } catch (error) {
            console.error('❌ Text comparison error:', error);
            throw new Error(`Failed to compare texts: ${error.message}`);
        }
    }

    // Basic text difference analysis
    performBasicDiff(original, comparison) {
        // Split texts into sentences for better comparison granularity
        const originalSentences = this.splitIntoSentences(original);
        const comparisonSentences = this.splitIntoSentences(comparison);
        
        // Perform longest common subsequence (LCS) based diff
        const diff = this.computeLCS(originalSentences, comparisonSentences);
        
        // Post-process to identify modifications vs additions/deletions
        return this.refineChanges(diff);
    }

    // AI-powered text formatting for line-by-line comparison
    async formatTextForLineComparison(text) {
        try {
            // Import document service for formatting
            const documentServiceModule = await import('./documentService.js');
            const documentService = documentServiceModule.default;
            
            // Use the same formatting as used in document display to ensure consistency
            const formatted = await documentService.formatDocumentText(text);
            
            // Further split formatted text into lines suitable for comparison
            const normalized = formatted
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .replace(/\t/g, ' ')
                .replace(/\u00A0/g, ' ')
                .trim();

            // Create line-wise structure: use double line breaks to define paragraph boundaries
            const paragraphs = normalized.split(/\n\n+/);
            const rejoined = paragraphs
                .map(p => p
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .join('\n'))
                .join('\n\n');

            return rejoined;
        } catch (err) {
            console.warn('⚠️ Line formatting failed, falling back to basic normalization:', err.message);
            return text
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .replace(/[ \t]{3,}/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
        }
    }

    // Enhanced line-by-line diff using LCS on lines preserving paragraph breaks
    performLineByLineDiff(original, comparison) {
        const originalLines = original.split(/\n/);
        const comparisonLines = comparison.split(/\n/);

        // Compute LCS at line level
        const changes = this.computeLCS(originalLines, comparisonLines);
        const refined = this.refineChanges(changes);

        // Merge adjacent unchanged empty lines to avoid noise
        const cleaned = [];
        for (let i = 0; i < refined.length; i++) {
            const c = refined[i];
            const prev = cleaned[cleaned.length - 1];
            const text = (c.originalText || c.comparisonText || '').trim();
            if (text === '' && prev && (prev.originalText || prev.comparisonText || '').trim() === '' && c.type === prev.type) {
                continue;
            }
            cleaned.push(c);
        }

        return cleaned;
    }

    // Split text into sentences with better legal document handling
    splitIntoSentences(text) {
        if (!text) return [];
        
        // First normalize line endings
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Split by paragraphs first to preserve structure
        const paragraphs = text.split(/\n\s*\n/);
        const sentences = [];
        
        paragraphs.forEach(paragraph => {
            if (!paragraph.trim()) return;
            
            // Handle clause/section headers separately
            if (/^(Clause|Section|Article)\s+\d+/i.test(paragraph.trim())) {
                sentences.push(paragraph.trim());
                return;
            }
            
            // Split paragraph into sentences
            const paragraphSentences = paragraph
                .split(/(?<=[.!?])\s+(?=[A-Z])/g)
                .map(s => s.trim())
                .filter(s => s.length > 10); // Filter out very short fragments
                
            sentences.push(...paragraphSentences);
        });
            
        return sentences.filter(s => s.length > 0);
    }

    // Compute Longest Common Subsequence for diff analysis
    computeLCS(arr1, arr2) {
        const m = arr1.length;
        const n = arr2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        // Build LCS table
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (this.sentencesSimilar(arr1[i-1], arr2[j-1])) {
                    dp[i][j] = dp[i-1][j-1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
                }
            }
        }
        
        // Backtrack to find differences
        return this.backtrackLCS(arr1, arr2, dp);
    }

    // Check if two sentences/lines are similar (allowing for minor differences)
    sentencesSimilar(sent1, sent2) {
        if (!sent1 && !sent2) return true; // Both empty/null
        if (!sent1 || !sent2) return false;
        
        // Handle empty lines
        const trimmed1 = sent1.trim();
        const trimmed2 = sent2.trim();
        if (!trimmed1 && !trimmed2) return true;
        if (!trimmed1 || !trimmed2) return false;
        
        // Normalize sentences/lines for comparison
        const normalize = (s) => s.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
            
        const norm1 = normalize(trimmed1);
        const norm2 = normalize(trimmed2);
        
        // Consider lines similar if they're identical
        if (norm1 === norm2) return true;
        
        // Check for exact match ignoring minor formatting differences
        if (this.removeMinorDifferences(trimmed1) === this.removeMinorDifferences(trimmed2)) {
            return true;
        }
        
        // For very short lines (like headers), be more strict
        if (trimmed1.length < 20 || trimmed2.length < 20) {
            return norm1 === norm2;
        }
        
        // Use stricter similarity for legal documents
        const similarity = this.calculateJaccardSimilarity(norm1, norm2);
        return similarity > 0.95; // 95% similarity threshold for lines
    }
    
    // Remove minor differences like line endings, extra spaces, etc.
    removeMinorDifferences(text) {
        if (!text) return '';
        return text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Calculate Jaccard similarity between two strings
    calculateJaccardSimilarity(str1, str2) {
        const set1 = new Set(str1.split(/\s+/));
        const set2 = new Set(str2.split(/\s+/));
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }

    // Backtrack LCS to identify specific changes
    backtrackLCS(arr1, arr2, dp) {
        const changes = [];
        let i = arr1.length;
        let j = arr2.length;
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && this.sentencesSimilar(arr1[i-1], arr2[j-1])) {
                // Unchanged sentence
                changes.unshift({
                    type: this.diffTypes.UNCHANGED,
                    originalText: arr1[i-1],
                    comparisonText: arr2[j-1],
                    originalIndex: i-1,
                    comparisonIndex: j-1
                });
                i--; j--;
            } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
                // Added sentence in comparison
                changes.unshift({
                    type: this.diffTypes.ADDED,
                    originalText: null,
                    comparisonText: arr2[j-1],
                    originalIndex: null,
                    comparisonIndex: j-1
                });
                j--;
            } else {
                // Removed sentence from original
                changes.unshift({
                    type: this.diffTypes.REMOVED,
                    originalText: arr1[i-1],
                    comparisonText: null,
                    originalIndex: i-1,
                    comparisonIndex: null
                });
                i--;
            }
        }
        
        return changes;
    }

    // Refine changes to identify modifications
    refineChanges(changes) {
        const refined = [];
        let i = 0;
        
        while (i < changes.length) {
            const current = changes[i];
            
            // Look for adjacent removed/added pairs that might be modifications
            if (current.type === this.diffTypes.REMOVED && 
                i + 1 < changes.length && 
                changes[i + 1].type === this.diffTypes.ADDED) {
                
                const next = changes[i + 1];
                const similarity = this.calculateJaccardSimilarity(
                    current.originalText || '',
                    next.comparisonText || ''
                );
                
                // If sentences are somewhat similar, treat as modification
                if (similarity > 0.4) {
                    refined.push({
                        type: this.diffTypes.MODIFIED,
                        originalText: current.originalText,
                        comparisonText: next.comparisonText,
                        originalIndex: current.originalIndex,
                        comparisonIndex: next.comparisonIndex,
                        similarity
                    });
                    i += 2; // Skip both changes
                    continue;
                }
            }
            
            refined.push(current);
            i++;
        }
        
        return refined;
    }

    // Generate comparison statistics
    generateStatistics(diff) {
        const stats = {
            total: diff.length,
            unchanged: 0,
            added: 0,
            removed: 0,
            modified: 0,
            changePercentage: 0
        };
        
        diff.forEach(change => {
            stats[change.type]++;
        });
        
        stats.changePercentage = Math.round(
            ((stats.added + stats.removed + stats.modified) / stats.total) * 100
        );
        
        return stats;
    }

    // AI-powered analysis of the comparison
    async performAIAnalysis(originalText, comparisonText, diff) {
        try {
            if (!geminiService.genAI) {
                return this.getMockAIAnalysis(diff);
            }

            const prompt = this.buildComparisonPrompt(originalText, comparisonText, diff);
            
            const model = geminiService.genAI.getGenerativeModel({ 
                model: geminiService.model 
            });
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const analysisText = response.text();
            
            // Parse AI response into structured format
            return this.parseAIAnalysis(analysisText);
            
        } catch (error) {
            console.warn('⚠️ AI analysis failed, using fallback:', error.message);
            return this.getMockAIAnalysis(diff);
        }
    }

    // Build prompt for AI comparison analysis
    buildComparisonPrompt(originalText, comparisonText, diff) {
        const changesSummary = diff
            .filter(change => change.type !== this.diffTypes.UNCHANGED)
            .slice(0, 10) // Limit to first 10 changes for prompt length
            .map(change => `${change.type.toUpperCase()}: ${change.comparisonText || change.originalText}`)
            .join('\n');

        return `You are a legal document analysis expert comparing two versions of a legal document.

COMPARISON TASK:
Analyze the changes between these two document versions and provide insights on their legal implications.

KEY CHANGES IDENTIFIED:
${changesSummary}

Please provide your analysis in the following JSON format:
{
  "summary": "Brief overview of the main changes",
  "significance": "high|medium|low",
  "keyChanges": [
    {
      "type": "addition|removal|modification",
      "description": "What changed",
      "legalImplication": "Legal significance of this change",
      "risk": "high|medium|low"
    }
  ],
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2"
  ],
  "overallAssessment": "Overall assessment of the document changes"
}

Focus on legal implications, risk changes, and practical recommendations for the user.`;
    }

    // Parse AI analysis response
    parseAIAnalysis(analysisText) {
        try {
            // Clean up and parse JSON response
            const cleanedText = analysisText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (error) {
            console.warn('Failed to parse AI analysis JSON, using fallback');
            return this.getMockAIAnalysis();
        }
    }

    // Fallback AI analysis when real AI is not available
    getMockAIAnalysis(diff = []) {
        const stats = this.generateStatistics(diff);
        
        let significance = 'low';
        if (stats.changePercentage > 30) significance = 'high';
        else if (stats.changePercentage > 10) significance = 'medium';
        
        const keyChanges = diff
            .filter(change => change.type !== this.diffTypes.UNCHANGED)
            .slice(0, 5)
            .map(change => ({
                type: change.type,
                description: `${change.type} in document text`,
                legalImplication: this.getLegalImplication(change.type),
                risk: change.type === this.diffTypes.REMOVED ? 'high' : 'medium'
            }));

        return {
            summary: `Document comparison shows ${stats.changePercentage}% changes with ${stats.added} additions, ${stats.removed} removals, and ${stats.modified} modifications.`,
            significance,
            keyChanges,
            recommendations: this.getRecommendations(stats),
            overallAssessment: `The document has undergone ${significance} level changes. ${this.getAssessment(stats)}`
        };
    }

    getLegalImplication(changeType) {
        const implications = {
            [this.diffTypes.ADDED]: 'New obligations or rights may have been introduced',
            [this.diffTypes.REMOVED]: 'Previous obligations or rights may have been eliminated',
            [this.diffTypes.MODIFIED]: 'Existing terms have been altered, potentially changing their legal effect'
        };
        return implications[changeType] || 'Review required to assess legal impact';
    }

    getRecommendations(stats) {
        const recommendations = [];
        
        if (stats.removed > 0) {
            recommendations.push('Review removed clauses to ensure no critical obligations were eliminated');
        }
        if (stats.added > 0) {
            recommendations.push('Analyze new additions for potential impact on existing agreements');
        }
        if (stats.modified > 0) {
            recommendations.push('Carefully review modified clauses for changes in legal meaning');
        }
        if (stats.changePercentage > 20) {
            recommendations.push('Consider full legal review due to extensive changes');
        }
        
        return recommendations.length > 0 ? recommendations : ['Document changes appear minimal - standard review recommended'];
    }

    getAssessment(stats) {
        if (stats.changePercentage > 30) {
            return 'Extensive modifications require careful legal review.';
        } else if (stats.changePercentage > 10) {
            return 'Moderate changes warrant detailed examination.';
        } else {
            return 'Minimal changes detected - routine review should suffice.';
        }
    }
}

// Create and export singleton instance
const documentComparisonService = new DocumentComparisonService();
export default documentComparisonService;
