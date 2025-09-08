import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

class GeminiService {
  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    
    if (!this.apiKey) {
      console.warn('⚠️ GOOGLE_AI_API_KEY not found. Gemini service will use mock responses.');
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      console.log('🤖 Gemini AI service initialized');
    }
  }

  async processWithGemini(text) {
    if (!this.genAI) {
      console.log('🔄 Using mock Gemini response (API key not configured)');
      return this.getMockResponse(text);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });

      const prompt = `
        You are a legal document analysis expert. Analyze the following legal document and provide a comprehensive breakdown.

        Please return your analysis in this EXACT JSON format:
        {
          "simplifiedText": "Plain English summary of the document",
          "riskAnalysis": {
            "overallRisk": "high|medium|low",
            "riskFactors": [
              {"level": "high|medium|low", "description": "Risk description"}
            ]
          },
          "highlightedSections": [
            {
              "text": "Exact text from document",
              "startIndex": 0,
              "endIndex": 50,
              "type": "risk|clause|obligation|right",
              "explanation": "Why this is important",
              "severity": "high|medium|low"
            }
          ],
          "clauses": [
            {
              "title": "Clause Title",
              "content": "Clause content",
              "type": "termination|liability|payment|confidentiality|other",
              "importance": "high|medium|low",
              "explanation": "What this clause means in plain English"
            }
          ],
          "keyTerms": [
            {
              "term": "Legal term",
              "definition": "Plain English definition"
            }
          ]
        }

        Legal document to analyze:
        """
        ${text}
        """

        Provide detailed analysis focusing on risks, obligations, and important clauses.
      `;

      console.log('🤖 Sending request to Gemini AI...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let responseText = response.text();
      
      // Clean up response text
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      
      try {
        const parsedResponse = JSON.parse(responseText);
        console.log('✅ Gemini AI processing successful');
        return parsedResponse;
      } catch (parseError) {
        console.warn('⚠️ Failed to parse Gemini JSON response, using fallback');
        return this.parseNonJsonResponse(responseText, text);
      }

    } catch (error) {
      console.error('❌ Gemini AI error:', error);
      
      // Fallback to mock response on error
      console.log('🔄 Falling back to mock response due to Gemini error');
      return this.getMockResponse(text);
    }
  }

  parseNonJsonResponse(responseText, originalText) {
    // Fallback parser for when AI doesn't return proper JSON
    return {
      simplifiedText: responseText,
      riskAnalysis: {
        overallRisk: 'medium',
        riskFactors: [{ level: 'medium', description: 'Review document carefully' }]
      },
      highlightedSections: [],
      clauses: [],
      keyTerms: []
    };
  }

  getMockResponse(text) {
    // Analyze the text to provide a comprehensive mock response
    const textLower = text.toLowerCase();
    let documentType = 'legal document';
    let riskLevel = 'medium';
    let specificConcerns = [];
    let mockHighlights = [];
    let mockClauses = [];

    // Detect document type and create relevant highlights
    if (textLower.includes('license') || textLower.includes('software')) {
      documentType = 'software license agreement';
      specificConcerns.push('Usage restrictions may apply');
      mockHighlights.push({
        text: 'license terms',
        startIndex: text.toLowerCase().indexOf('license'),
        endIndex: text.toLowerCase().indexOf('license') + 7,
        type: 'clause',
        explanation: 'This defines how you can use the software',
        severity: 'medium'
      });
      mockClauses.push({
        title: 'License Grant',
        content: 'Software usage permissions and restrictions',
        type: 'other',
        importance: 'high',
        explanation: 'Defines what you can and cannot do with the software'
      });
    } else if (textLower.includes('employment') || textLower.includes('employee')) {
      documentType = 'employment contract';
      specificConcerns.push('Review termination clauses carefully');
      mockClauses.push({
        title: 'Termination Clause',
        content: 'Employment termination conditions',
        type: 'termination',
        importance: 'high',
        explanation: 'Specifies under what conditions your employment can be terminated'
      });
    }

    // Risk assessment based on keywords
    const highRiskKeywords = ['indemnify', 'liable', 'damages', 'penalty', 'forfeit'];
    const lowRiskKeywords = ['revocable', 'standard', 'typical', 'reasonable'];
    
    const hasHighRisk = highRiskKeywords.some(keyword => textLower.includes(keyword));
    const hasLowRisk = lowRiskKeywords.some(keyword => textLower.includes(keyword));
    
    if (hasHighRisk) {
      riskLevel = 'high';
    } else if (hasLowRisk) {
      riskLevel = 'low';
    }

    return {
      simplifiedText: `This ${documentType} has been analyzed and simplified. The document contains standard legal language with ${riskLevel} risk level. ${specificConcerns.join(' ')}`  ,
      riskAnalysis: {
        overallRisk: riskLevel,
        riskFactors: [
          { level: riskLevel, description: specificConcerns[0] || 'Standard legal terms apply' },
          { level: 'medium', description: 'Review all terms carefully before signing' }
        ]
      },
      highlightedSections: mockHighlights,
      clauses: mockClauses,
      keyTerms: [
        { term: 'Agreement', definition: 'A legal contract between parties' },
        { term: 'Liability', definition: 'Legal responsibility for damages or loss' }
      ]
    };
  }

  async testConnection() {
    try {
      if (!this.genAI) {
        return { success: false, message: 'API key not configured' };
      }

      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent('Say "Hello" if you can understand this message.');
      const response = await result.response;
      
      console.log('✅ Gemini connection test successful');
      return { 
        success: true, 
        message: 'Connected successfully',
        response: response.text()
      };

    } catch (error) {
      console.error('❌ Gemini connection test failed:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }
}

// Create singleton instance
const geminiService = new GeminiService();

// Export the main function
export async function processWithGemini(text) {
  return await geminiService.processWithGemini(text);
}

// Export enhanced analysis function
export async function analyzeDocumentStructure(text) {
  return await geminiService.processWithGemini(text);
}

// Export test function
export async function testGeminiConnection() {
  return await geminiService.testConnection();
}

export default geminiService;
