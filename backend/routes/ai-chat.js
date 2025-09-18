import express from 'express';
import geminiService from '../services/geminiService.js';
const router = express.Router();

// Professional Legal AI Prompt Engineering System
class LegalAIPromptEngine {
    constructor() {
        this.systemPrompt = this.buildSystemPrompt();
        this.conversationHistory = new Map(); // Store conversations by session ID
    }

    buildSystemPrompt() {
        return `You are ClarityLegal AI, an expert legal document analysis assistant with deep expertise in contract law, compliance, and risk assessment.

CORE PRINCIPLES:
• Provide CONCISE, actionable legal analysis (aim for 150-300 words unless complex issue requires more)
• Focus on PRACTICAL insights that help users make informed decisions
• Use CLEAR, professional language accessible to both legal and business professionals
• Prioritize HIGH-IMPACT risks and recommendations
• Deliver immediate value in every response

EXPERTISE AREAS:
• Contract Law & Commercial Agreements
• Corporate Governance & Securities Law
• Regulatory Compliance (SOX, GDPR, CCPA, etc.)
• Intellectual Property & Technology Law
• Employment & Labor Law
• Mergers & Acquisitions
• Real Estate & Commercial Leasing
• Dispute Resolution & Litigation Risk

RESPONSE STRUCTURE (be concise in each section):
1. **Key Finding** - Most critical insight in 1-2 sentences
2. **Primary Risks** - Top 2-3 risks with severity levels (High/Medium/Low)
3. **Action Items** - 2-4 specific, implementable recommendations
4. **Bottom Line** - One sentence strategic takeaway

ANALYSIS APPROACH:
• Identify deal-breaking risks vs. manageable issues
• Provide market-standard alternatives and benchmarks
• Flag unusual or heavily skewed terms
• Suggest specific contract language improvements
• Assess enforceability and practical implications

ETHICS & DISCLAIMERS:
• Provide legal information, not legal advice
• Recommend qualified counsel for critical decisions
• Maintain professional confidentiality standards
• Acknowledge scope limitations clearly

Remember: Deliver maximum value in minimum words. Users need quick, actionable insights to make informed decisions.`;
    }

    generateDocumentContextPrompt(documentText, highlights = []) {
        let contextPrompt = `\n\nDOCUMENT CONTEXT:\n`;
        contextPrompt += `I am analyzing the following legal document:\n\n`;
        contextPrompt += `"${documentText.substring(0, 3000)}${documentText.length > 3000 ? '...[truncated]' : ''}"\n\n`;
        
        if (highlights && highlights.length > 0) {
            contextPrompt += `HIGHLIGHTED SECTIONS OF INTEREST:\n`;
            highlights.forEach((highlight, index) => {
                contextPrompt += `${index + 1}. "${highlight.text}" (Type: ${highlight.type}, Risk: ${highlight.level})\n`;
            });
            contextPrompt += `\n`;
        }

        contextPrompt += `Please provide your analysis with specific reference to this document content.\n`;
        return contextPrompt;
    }

    generateSpecializedPrompts() {
        return {
            riskAnalysis: `RISK ANALYSIS FOCUS: Identify the top 3-4 highest-impact legal risks. For each risk:
- Clearly state the risk and potential impact
- Assign severity (High/Medium/Low) with brief justification
- Provide 1-2 specific mitigation strategies
Prioritize: liability exposure, compliance violations, termination vulnerabilities, and financial risks.`,

            clauseInterpretation: `CLAUSE INTERPRETATION FOCUS: Analyze key contract terms with:
- Clear explanation of what each clause means in practice
- Identification of ambiguous language or problematic terms  
- Comparison to market standards where relevant
- Specific suggested improvements with rationale
Focus on clauses that create the most business impact or legal exposure.`,

            complianceCheck: `COMPLIANCE REVIEW FOCUS: Quickly assess regulatory compliance gaps:
- Identify specific compliance requirements that may be violated
- Flag missing mandatory clauses or disclosures
- Highlight jurisdiction-specific issues
- Recommend immediate compliance actions
Prioritize: data privacy, employment law, industry regulations, and disclosure requirements.`,

            negotiationAdvice: `NEGOTIATION STRATEGY FOCUS: Provide tactical negotiation guidance:
- Identify your strongest negotiation points and opponent's weak positions
- List 3-4 "must-win" terms and fallback positions
- Flag terms that heavily favor one party
- Suggest specific alternative language for problematic clauses
Prioritize: risk allocation, financial terms, termination rights, and performance obligations.`,

            dueDiligence: `DUE DILIGENCE FOCUS: Rapid assessment of document adequacy:
- Identify critical missing provisions or incomplete terms
- Flag inconsistencies with standard practices
- Assess adequacy of representations and warranties
- Highlight ongoing obligations and compliance requirements
Prioritize: deal-breaking issues, hidden liabilities, and operational constraints.`
        };
    }

    async generateResponse(message, documentContext, sessionId, analysisType = 'general') {
        try {
            const conversation = this.conversationHistory.get(sessionId) || [];
            const specializedPrompts = this.generateSpecializedPrompts();
            
            let fullPrompt = this.systemPrompt;
            
            // Add document context if provided
            if (documentContext && documentContext.text) {
                fullPrompt += this.generateDocumentContextPrompt(
                    documentContext.text, 
                    documentContext.highlights
                );
            }
            
            // Add specialized analysis prompt if specified
            if (analysisType !== 'general' && specializedPrompts[analysisType]) {
                fullPrompt += `\n\nSPECIALIZED ANALYSIS REQUEST:\n${specializedPrompts[analysisType]}\n`;
            }
            
            // Add conversation history for context
            if (conversation.length > 0) {
                fullPrompt += `\n\nCONVERSATION HISTORY:\n`;
                conversation.slice(-6).forEach(msg => { // Last 6 messages for context
                    fullPrompt += `${msg.role === 'user' ? 'USER' : 'ASSISTANT'}: ${msg.content}\n`;
                });
                fullPrompt += `\n`;
            }
            
            fullPrompt += `\nUSER QUESTION: ${message}\n\nIMPORTANT: Answer the user's SPECIFIC question. If it's a simple greeting or general question, respond naturally. If it's a legal analysis request, use this format:

**Key Finding:**
[1-2 sentences directly addressing their question]

**Primary Risks:** (only if they ask about risks)
• **HIGH:** [risk name] - [brief explanation]
• **MEDIUM:** [risk name] - [brief explanation]

**Action Items:** (only if they ask for recommendations)
1. **[Priority]:** [specific action]
2. **[Priority]:** [specific action]

**Bottom Line:**
[One sentence directly answering their question]

For simple questions like greetings, just respond naturally and ask how you can help. Keep responses under 300 words and directly address what they asked.`;

            // Here you would integrate with your AI service (OpenAI, Claude, etc.)
            // For now, we'll simulate a response structure
            const aiResponse = await this.callAIService(fullPrompt);
            
            // Update conversation history
            conversation.push({ role: 'user', content: message, timestamp: new Date() });
            conversation.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
            this.conversationHistory.set(sessionId, conversation);
            
            return {
                response: aiResponse,
                analysisType,
                sessionId,
                timestamp: new Date(),
                disclaimer: this.getLegalDisclaimer()
            };
            
        } catch (error) {
            console.error('Error generating AI response:', error);
            throw new Error('Failed to generate legal analysis');
        }
    }

    async callAIService(prompt) {
        // Use Gemini AI service for legal document analysis
        try {
            console.log('Sending chat request to Gemini AI...');
            
            // Use Gemini's text generation directly
            if (!geminiService.genAI) {
                console.warn('Gemini API not configured, using mock response');
                return this.generateMockResponse(prompt);
            }
            
            const model = geminiService.genAI.getGenerativeModel({ 
                model: geminiService.model 
            });
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const responseText = response.text();
            
            console.log('Gemini AI chat response successful');
            return responseText;
            
        } catch (error) {
            console.warn('Gemini AI chat error:', error.message);
            // Fallback to enhanced mock response
            return this.generateMockResponse(prompt);
        }
        
        // Fallback to enhanced mock response with contextual analysis
        return this.generateMockResponse(prompt);
    }
    
    generateMockResponse(prompt) {
        // Enhanced mock response that considers the prompt content and user question
        const lowerPrompt = prompt.toLowerCase();
        const isRiskAnalysis = lowerPrompt.includes('risk');
        const isClauseInterpretation = lowerPrompt.includes('clause');
        const isCompliance = lowerPrompt.includes('compliance');
        const isNegotiation = lowerPrompt.includes('negotiation');
        const isGreeting = lowerPrompt.includes('hi') || lowerPrompt.includes('hello') || lowerPrompt.includes('hey');
        const isGeneralQuestion = lowerPrompt.includes('what') || lowerPrompt.includes('how') || lowerPrompt.includes('can you');
        
        // Handle greetings and simple questions differently
        if (isGreeting) {
            return `Hello! I'm ClarityLegal AI, your legal document analysis assistant.

I can help you with:
• Risk assessment and analysis
• Contract clause interpretation
• Compliance reviews
• Negotiation strategies
• Legal document insights

What would you like me to analyze in your document today?`;
        }
        
        if (isGeneralQuestion && !isRiskAnalysis && !isClauseInterpretation && !isCompliance && !isNegotiation) {
            return `I'd be happy to help! I specialize in legal document analysis and can assist with:

• **Risk Analysis** - Identify potential legal risks and liabilities
• **Contract Review** - Explain complex clauses and terms
• **Compliance Check** - Flag regulatory issues
• **Negotiation Support** - Strategic advice for better terms

Could you be more specific about what aspect of your document you'd like me to analyze?`;
        }
        
        let response = `**Key Finding:**\n`;
        
        if (isRiskAnalysis) {
            response += `Your document contains significant liability exposure and imbalanced risk allocation that could result in substantial financial exposure.\n\n`;
        } else if (isClauseInterpretation) {
            response += `Several key clauses contain ambiguous language and non-standard terms that create enforcement risks and potential disputes.\n\n`;
        } else if (isCompliance) {
            response += `The document lacks mandatory regulatory disclosures and contains provisions that may violate current compliance standards.\n\n`;
        } else if (isNegotiation) {
            response += `The current terms heavily favor the other party - focus negotiations on liability caps, termination rights, and performance metrics.\n\n`;
        } else {
            response += `This document has several high-impact issues requiring immediate attention before execution.\n\n`;
        }
        
        response += `**Primary Risks:**\n`;
        
        if (isRiskAnalysis) {
            response += `• **HIGH:** Unlimited indemnification liability (could exceed contract value)\n`;
            response += `• **HIGH:** Vague termination procedures (potential for costly disputes)\n`;
            response += `• **MEDIUM:** Undefined performance metrics (compliance uncertainty)\n\n`;
        } else if (isClauseInterpretation) {
            response += `• **HIGH:** Force majeure clause lacks pandemic/supply chain coverage\n`;
            response += `• **MEDIUM:** IP ownership ambiguous for derivative works\n`;
            response += `• **LOW:** Confidentiality terms are standard and enforceable\n\n`;
        } else {
            response += `• **HIGH:** Liability exposure without caps or limitations\n`;
            response += `• **MEDIUM:** Termination notice requirements unclear\n`;
            response += `• **MEDIUM:** Performance standards lack measurable criteria\n\n`;
        }
        
        response += `**Action Items:**\n`;
        if (isNegotiation) {
            response += `1. **Must-Win:** Add $X liability cap and mutual indemnification\n`;
            response += `2. **Priority:** Negotiate 30-day termination notice with cure period\n`;
            response += `3. **Fallback:** Accept liability cap at 2x contract value if needed\n`;
            response += `4. **Prep:** Draft alternative IP ownership language before negotiation\n\n`;
        } else {
            response += `1. **Immediate:** Add liability caps (recommend 1-2x contract value)\n`;
            response += `2. **Critical:** Define specific performance metrics with measurement criteria\n`;
            response += `3. **Required:** Clarify termination procedures and notice periods\n`;
            response += `4. **Recommended:** Add mediation clause before litigation\n\n`;
        }
        
        response += `**Bottom Line:**\n`;
        response += `${isNegotiation ? 'Focus negotiations on liability protection and termination rights - these terms heavily favor the other party.' : 'This document requires significant risk mitigation before execution, particularly regarding liability exposure.'}`;
        response += `\n\n`;
        
        return response;
    }

    getLegalDisclaimer() {
        return `This analysis provides legal information, not legal advice. Consult qualified counsel for legal decisions.`;
    }

    getConversationHistory(sessionId) {
        return this.conversationHistory.get(sessionId) || [];
    }

    clearConversationHistory(sessionId) {
        this.conversationHistory.delete(sessionId);
        return true;
    }
}

// Initialize the prompt engine
const legalAI = new LegalAIPromptEngine();

// Chat endpoint
router.post('/chat', async (req, res) => {
    try {
        const { 
            message, 
            sessionId = 'default', 
            documentContext = null, 
            analysisType = 'general' 
        } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Message is required',
                success: false 
            });
        }

        // Rate limiting check (implement as needed)
        // await checkRateLimit(sessionId);

        const response = await legalAI.generateResponse(
            message.trim(),
            documentContext,
            sessionId,
            analysisType
        );

        res.json({
            success: true,
            ...response
        });

    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            success: false,
            message: 'Failed to process your request. Please try again.'
        });
    }
});

// Get conversation history
router.get('/history/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const history = legalAI.getConversationHistory(sessionId);
        
        res.json({
            success: true,
            history: history.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            }))
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ 
            error: 'Failed to fetch conversation history',
            success: false 
        });
    }
});

// Clear conversation history
router.delete('/history/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const cleared = legalAI.clearConversationHistory(sessionId);
        
        res.json({
            success: true,
            message: 'Conversation history cleared',
            cleared
        });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ 
            error: 'Failed to clear conversation history',
            success: false 
        });
    }
});

// Get analysis types
router.get('/analysis-types', (req, res) => {
    const analysisTypes = {
        general: 'General Legal Analysis',
        riskAnalysis: 'Risk Assessment',
        clauseInterpretation: 'Clause Interpretation', 
        complianceCheck: 'Compliance Review',
        negotiationAdvice: 'Negotiation Strategy',
        dueDiligence: 'Due Diligence Review'
    };
    
    res.json({
        success: true,
        analysisTypes
    });
});

export default router;
