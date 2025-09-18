import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createRequire } from 'module';

// Create require function for CommonJS modules
const require = createRequire(import.meta.url);

// Dynamic import to avoid initialization issues
let pdfParse = null;
let mammoth = null;

dotenv.config();

class DocumentService {
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    this.location = process.env.DOCUMENT_AI_LOCATION || 'us';
    this.processorId = process.env.DOCUMENT_AI_PROCESSOR_ID;
    
    // Initialize Document AI client if credentials are available
    if (this.projectId && this.processorId) {
      try {
        // Set up authentication using the same Firebase credentials
        const clientOptions = {
          projectId: this.projectId,
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // If service account key file exists
        };
        
        // If no keyFilename, try using Firebase credentials
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.FIREBASE_PRIVATE_KEY) {
          const credentials = {
            type: 'service_account',
            project_id: this.projectId,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI,
            token_uri: process.env.FIREBASE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
            client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
          };
          
          clientOptions.credentials = credentials;
        }
        
        this.client = new DocumentProcessorServiceClient(clientOptions);
        console.log('📄 Document AI service initialized with authentication');
        console.log(`🎯 Project: ${this.projectId}`);
        console.log(`🎯 Processor: ${this.processorId}`);
        console.log(`🎯 Location: ${this.location}`);
        
        // Test the connection
        this.testDocumentAIConnection();
        
      } catch (error) {
        console.warn('⚠️ Document AI initialization failed:', error.message);
        console.log('🔄 Will use fallback text extraction methods');
        this.client = null;
      }
    } else {
      console.warn('⚠️ Document AI not configured. Will use fallback text extraction.');
      console.log('📝 Missing: Project ID:', !this.projectId, 'Processor ID:', !this.processorId);
      this.client = null;
    }
  }

  async extractTextFromDocument(filePath, useFallback = false) {
    // If Document AI is not available or fallback is requested, use basic extraction
    if (!this.client || useFallback) {
      return await this.extractTextFallback(filePath);
    }

    try {
      // Read the file
      const fileBuffer = await fs.readFile(filePath);
      
      // Configure the request
      const name = `projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`;
      
      const request = {
        name,
        rawDocument: {
          content: fileBuffer.toString('base64'),
          mimeType: this.getMimeType(filePath),
        },
      };

      console.log('📄 Extracting text with Document AI...');
      
      // Process the document
      const [result] = await this.client.processDocument(request);
      const document = result.document;
      
      if (!document || !document.text) {
        throw new Error('No text extracted from document');
      }

      console.log(`✅ Document AI extraction successful (${document.text.length} characters)`);
      return document.text;

    } catch (error) {
      console.error('❌ Document AI extraction failed:', error);
      
      // Fallback to basic extraction
      console.log('🔄 Falling back to basic text extraction');
      return await this.extractTextFallback(filePath);
    }
  }

  async extractTextFallback(filePath) {
    const fileExtension = path.extname(filePath).toLowerCase();
    
    try {
      switch (fileExtension) {
        case '.pdf':
          return await this.extractTextFromPDF(filePath);
        case '.txt':
          return await this.extractTextFromTXT(filePath);
        case '.doc':
          console.warn('⚠️ .DOC extraction requires Document AI - .DOC format not supported in fallback');
          throw new Error('.DOC files require Document AI for text extraction. Please use .DOCX format instead.');
        case '.docx':
          return await this.extractTextFromDOCX(filePath);
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }
    } catch (error) {
      console.error('❌ Fallback extraction failed:', error);
      
      // For PDF files, provide a clear error message instead of fallback content
      if (fileExtension === '.pdf') {
        console.error(`❌ PDF extraction failed in fallback method: ${error.message}`);
        throw new Error(`PDF text extraction failed: ${error.message}. Please ensure the PDF contains selectable text or try a different file.`);
      }
      
      throw new Error(`Failed to extract text from ${fileExtension} file: ${error.message}`);
    }
  }

  async extractTextFromPDF(filePath) {
    try {
      console.log(`📄 Extracting text from PDF: ${filePath}`);
      
      // Validate file exists and is readable
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        throw new Error('PDF file is empty');
      }
      
      // Lazy load pdf-parse using require for better compatibility
      if (!pdfParse) {
        try {
          pdfParse = require('pdf-parse');
          console.log('✅ pdf-parse loaded successfully');
        } catch (requireError) {
          console.error('❌ Failed to load pdf-parse:', requireError.message);
          throw new Error('PDF parsing library not available. Please ensure pdf-parse is installed.');
        }
      }
      
      // Read the PDF file as buffer
      const fileBuffer = await fs.readFile(filePath);
      
      console.log(`📊 PDF file size: ${Math.round(stats.size / 1024)}KB`);
      
      // Parse PDF with enhanced options for better text extraction
      const parseOptions = {
        // Enable better text parsing
        normalizeWhitespace: false,
        disableCombineTextItems: false,
        // Add timeout to prevent hanging
        max: 10000 // Max number of pages to process
      };
      
      console.log('📄 Starting PDF parsing with pdf-parse library...');
      const data = await pdfParse(fileBuffer, parseOptions);
      console.log(`📄 PDF parse completed - Pages: ${data.numpages}, Info available: ${!!data.info}`);
      
      console.log(`📊 PDF parsing complete: ${data.numpages} pages processed`);
      console.log(`📄 Title: ${data.info?.Title || 'No title'}`);
      console.log(`👤 Author: ${data.info?.Author || 'Unknown'}`);
      
      console.log(`🗓️ Raw text extracted length: ${data.text ? data.text.length : 0}`);
      console.log(`🗓️ Text preview (first 200 chars): ${data.text ? data.text.substring(0, 200) : 'No text'}`);
      
      if (!data.text) {
        throw new Error('PDF parsing returned no text data - PDF may be image-based or corrupted');
      }
      
      let extractedText = data.text.trim();
      console.log(`🗓️ Trimmed text length: ${extractedText.length}`);
      
      if (extractedText.length === 0) {
        // Try alternative extraction method for scanned PDFs
        console.log('⚠️ No text found with standard method, PDF might be scanned or image-based');
        throw new Error('This PDF appears to be scanned or image-based. Text extraction requires OCR capabilities. Please use Document AI for better results.');
      }
      
      // Clean up common PDF extraction artifacts
      extractedText = this.cleanPDFText(extractedText);
      
      console.log(`✅ PDF text extraction successful (${extractedText.length} characters)`);
      
      // Validate extracted text quality
      if (extractedText.length < 50) {
        console.warn('⚠️ Very short text extracted, PDF might have formatting issues');
      }
      
      return extractedText;

    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Invalid PDF')) {
        throw new Error('The PDF file appears to be corrupted or invalid. Please try a different file.');
      } else if (error.message.includes('encrypted')) {
        throw new Error('The PDF file is encrypted or password-protected. Please provide an unencrypted version.');
      } else if (error.message.includes('scanned') || error.message.includes('image-based')) {
        console.warn('⚠️ PDF appears to be image-based or scanned - OCR would be needed for actual text extraction');
        throw new Error('PDF appears to be scanned or image-based. Please provide a text-based PDF or use OCR.');
      } else {
        // Throw the error instead of using fallback content
        console.error(`❌ PDF extraction failed: ${error.message}`);
        throw new Error(`PDF text extraction failed: ${error.message}`);
      }
    }
  }

  async extractTextFromTXT(filePath) {
    try {
      const text = await fs.readFile(filePath, 'utf-8');
      
      if (!text || text.trim().length === 0) {
        throw new Error('Text file is empty');
      }

      console.log(`✅ TXT file read (${text.length} characters)`);
      return text;

    } catch (error) {
      console.error('❌ TXT extraction error:', error);
      throw new Error(`Text file reading failed: ${error.message}`);
    }
  }

  async extractTextFromDOCX(filePath) {
    try {
      console.log(`📄 Extracting text from DOCX: ${filePath}`);
      
      // Lazy load mammoth using require for better compatibility
      if (!mammoth) {
        try {
          mammoth = require('mammoth');
          console.log('✅ mammoth loaded successfully');
        } catch (requireError) {
          console.error('❌ Failed to load mammoth:', requireError.message);
          throw new Error('DOCX parsing library not available. Please ensure mammoth is installed.');
        }
      }
      
      // Read the DOCX file as buffer
      const fileBuffer = await fs.readFile(filePath);
      
      // Extract text using mammoth
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('No text found in DOCX document');
      }
      
      const extractedText = result.value.trim();
      console.log(`✅ DOCX text extraction successful (${extractedText.length} characters)`);
      
      // Log any conversion warnings
      if (result.messages && result.messages.length > 0) {
        console.log(`⚠️ DOCX conversion warnings:`, result.messages.map(m => m.message));
      }
      
      return extractedText;

    } catch (error) {
      console.error('❌ DOCX extraction error:', error);
      throw new Error(`DOCX text extraction failed: ${error.message}`);
    }
  }

  cleanPDFText(text) {
    if (!text) return '';
    
    // Clean up common PDF extraction artifacts
    let cleanedText = text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Fix common PDF extraction issues
      .replace(/\s*\n\s*/g, '\n')
      // Remove form feed characters
      .replace(/\f/g, '\n')
      // Remove null characters
      .replace(/\0/g, '')
      // Fix broken words that span lines
      .replace(/([a-z])\n([a-z])/g, '$1 $2')
      // Fix multiple consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
    
    return cleanedText;
  }

  getFallbackLegalText() {
    // Return the same content as the mock original document to ensure consistent comparisons
    return `SAMPLE LEGAL AGREEMENT - ORIGINAL VERSION

This Agreement is entered into between Party A and Party B.

Clause 1: Payment Terms
Payment shall be made within 30 days of invoice date.

Clause 2: Termination
Either party may terminate this agreement with 60 days written notice.

Clause 3: Liability
Each party shall be liable for their own actions and omissions.

Clause 4: Confidentiality
All confidential information shall be protected for a period of 2 years.

Clause 5: Governing Law
This agreement shall be governed by the laws of California.

IN WITNESS WHEREOF, the parties have executed this Agreement.

Party A: _________________________
Date: ___________________________

Party B: _________________________
Date: ___________________________`;
  }

  // AI-powered text formatting for better document display
  async formatDocumentText(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      return rawText;
    }

    console.log('✨ AI formatting document text...');
    console.log(`📄 Input text length: ${rawText.length} characters`);
    
    try {
      // Import Gemini service dynamically to avoid circular dependency
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      if (!process.env.GOOGLE_AI_API_KEY) {
        console.warn('⚠️ No Gemini API key - using basic formatting');
        return this.basicTextFormatting(rawText);
      }

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Please reformat this legal document text to be well-structured and visually appealing. Follow these guidelines:

1. Add proper paragraph breaks and spacing
2. Identify and format section headers, clauses, and titles
3. Preserve important structural elements like signatures, dates, and legal references
4. Improve readability with consistent indentation and spacing
5. Keep all original content intact - only improve formatting
6. Use double line breaks (\n\n) between major sections
7. Use single line breaks (\n) within sections when appropriate
8. Ensure proper capitalization for titles and headers

Document text to format:

${rawText}

Return only the formatted text without any additional commentary.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const formattedText = response.text();
      
      console.log(`✅ AI formatting completed: ${formattedText.length} characters`);
      console.log(`📄 Formatted preview (first 200 chars): ${formattedText.substring(0, 200)}...`);
      
      return formattedText;
      
    } catch (error) {
      console.warn('⚠️ AI formatting failed, using basic formatting:', error.message);
      return this.basicTextFormatting(rawText);
    }
  }

  // Basic text formatting as fallback
  basicTextFormatting(text) {
    if (!text) return text;
    
    console.log('🔧 Applying basic text formatting...');
    
    let formatted = text
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Clean up excessive whitespace but preserve structure
      .replace(/[ \t]{3,}/g, '  ')
      // Fix paragraph breaks
      .replace(/\n{3,}/g, '\n\n')
      // Add spacing around likely section headers
      .replace(/(^|\n)(Clause|Section|Article|Chapter)\s*(\d+[:.]*)/gmi, '\n\n$2 $3')
      .replace(/(^|\n)(WHEREAS|NOW THEREFORE|IN WITNESS WHEREOF)/gmi, '\n\n$2')
      // Add spacing before signature lines
      .replace(/(^|\n)(Signed\s*by:|Party\s*[AaBb]:)/gmi, '\n\n$2')
      // Clean up and normalize
      .trim();
    
    // Ensure proper spacing between paragraphs
    const paragraphs = formatted.split(/\n\s*\n/);
    const cleanedParagraphs = paragraphs
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .join('\n\n');
    
    console.log(`✅ Basic formatting completed: ${cleanedParagraphs.length} characters`);
    return cleanedParagraphs;
  }

  getMimeType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  // Test Document AI connection during initialization
  async testDocumentAIConnection() {
    if (!this.client) {
      console.log('⚠️ Document AI client not available for testing');
      return;
    }

    try {
      // Try to list processors to test connection (lightweight operation)
      const parent = `projects/${this.projectId}/locations/${this.location}`;
      console.log('🔍 Testing Document AI connection...');
      
      const [processors] = await this.client.listProcessors({ parent });
      
      console.log('✅ Document AI connection test successful');
      console.log(`📊 Found ${processors.length} processors in the project`);
      
      // Check if our specific processor exists
      const ourProcessor = processors.find(p => p.name.includes(this.processorId));
      if (ourProcessor) {
        console.log(`✅ Target processor found: ${ourProcessor.displayName || 'Unnamed'}`);
      } else {
        console.warn(`⚠️ Target processor ${this.processorId} not found in the list`);
      }
      
    } catch (error) {
      console.error('❌ Document AI connection test failed:', error.message);
      console.log('🔄 Document AI will be disabled, falling back to basic extraction');
      this.client = null; // Disable Document AI if connection fails
    }
  }
  
  async testDocumentAI() {
    if (!this.client) {
      return {
        success: false,
        message: 'Document AI not configured',
        hasCredentials: false
      };
    }

    try {
      // Try to list processors to test connection
      const parent = `projects/${this.projectId}/locations/${this.location}`;
      await this.client.listProcessors({ parent });
      
      console.log('✅ Document AI connection test successful');
      return {
        success: true,
        message: 'Document AI connection successful',
        hasCredentials: true,
        projectId: this.projectId,
        location: this.location,
        processorId: this.processorId
      };

    } catch (error) {
      console.error('❌ Document AI connection test failed:', error);
      return {
        success: false,
        message: error.message,
        hasCredentials: true
      };
    }
  }

  // Generate highlighted sections from risk factors
  generateHighlightedSections(text, riskFactors) {
    const sections = [];
    
    riskFactors.forEach((factor, index) => {
      const keyword = factor.keyword || factor.pattern;
      if (keyword) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          const start = Math.max(0, match.index - 100);
          const end = Math.min(text.length, match.index + keyword.length + 100);
          const context = text.substring(start, end);
          
          sections.push({
            id: `highlight-${index}-${match.index}`,
            text: keyword,
            startIndex: match.index,
            endIndex: match.index + keyword.length,
            context: context,
            riskLevel: factor.level,
            description: factor.description,
            type: factor.type
          });
          
          // Limit to prevent too many highlights
          if (sections.length >= 20) break;
        }
      }
    });
    
    return sections.slice(0, 15); // Limit to 15 highlighted sections
  }
  
  // Generate clauses from risk factors
  generateClausesFromRisks(riskFactors) {
    const clauses = [];
    const processedKeywords = new Set();
    
    riskFactors.forEach((factor, index) => {
      const keyword = factor.keyword || factor.pattern;
      if (keyword && !processedKeywords.has(keyword)) {
        processedKeywords.add(keyword);
        
        clauses.push({
          id: `clause-${index}`,
          title: this.formatClauseTitle(keyword),
          explanation: factor.description,
          importance: factor.level,
          riskLevel: factor.level,
          type: factor.type,
          keywords: [keyword]
        });
      }
    });
    
    return clauses.slice(0, 10); // Limit to 10 clauses
  }
  
  // Format clause title from keyword
  formatClauseTitle(keyword) {
    return keyword
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + ' Clause';
  }
  
  // Utility function to validate file before processing
  validateFile(filePath, maxSizeBytes = 10 * 1024 * 1024) {
    return new Promise(async (resolve, reject) => {
      try {
        const stats = await fs.stat(filePath);
        
        if (stats.size === 0) {
          reject(new Error('File is empty'));
          return;
        }
        
        if (stats.size > maxSizeBytes) {
          reject(new Error(`File size (${Math.round(stats.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSizeBytes / 1024 / 1024)}MB)`));
          return;
        }

        const extension = path.extname(filePath).toLowerCase();
        const allowedExtensions = ['.pdf', '.txt', '.doc', '.docx'];
        
        if (!allowedExtensions.includes(extension)) {
          reject(new Error(`File type ${extension} is not supported. Allowed types: ${allowedExtensions.join(', ')}`));
          return;
        }

        resolve(true);
      } catch (error) {
        reject(new Error(`File validation failed: ${error.message}`));
      }
    });
  }
}

// Create singleton instance
const documentService = new DocumentService();

// Export main function
export async function extractTextFromDocument(filePath, useFallback = false) {
  // Validate file first
  await documentService.validateFile(filePath);
  return await documentService.extractTextFromDocument(filePath, useFallback);
}

// Export test function
export async function testDocumentAI() {
  return await documentService.testDocumentAI();
}

// Export reanalysis function
export async function reanalyzeDocument(documentId, docMetadata) {
  try {
    console.log(`Starting re-analysis for document: ${documentId}`);
    
    // Import required services
    const { db } = await import('../config/firebase.js');
    const riskAnalyzer = await import('./riskAnalyzer.js');
    
    // Get the document reference
    const docRef = db.collection('documents').doc(documentId);
    
    // Re-extract text if file path is available
    let extractedText = docMetadata.extractedText;
    
    if (docMetadata.filePath && fsSync.existsSync(docMetadata.filePath)) {
      try {
        console.log(`Re-extracting text from: ${docMetadata.filePath}`);
        const extractionResult = await documentService.extractTextFromDocument(docMetadata.filePath);
        extractedText = extractionResult.text || extractedText;
      } catch (extractionError) {
        console.warn('Text re-extraction failed, using existing text:', extractionError.message);
      }
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content available for analysis');
    }
    
    // Perform new risk analysis
    console.log('Performing enhanced risk analysis...');
    const analysisResult = riskAnalyzer.analyzeRisks(extractedText);
    console.log('Risk analysis completed:', {
      overallRisk: analysisResult.overallRisk,
      confidence: analysisResult.confidence,
      riskFactorsCount: analysisResult.riskFactors?.length || 0
    });
    
    // Update document with new analysis
    const updatedData = {
      status: 'processed',
      extractedText: extractedText,
      simplifiedText: extractedText.length > 1000 ? extractedText.substring(0, 1000) + '...' : extractedText,
      riskAnalysis: {
        overallRisk: analysisResult.overallRisk || 'medium',
        riskScore: analysisResult.confidence ? Math.round(analysisResult.confidence * 100) : 50,
        risks: analysisResult.riskFactors || [],
        summary: analysisResult.recommendations ? analysisResult.recommendations.join('. ') : 'Re-analysis completed successfully',
        documentType: analysisResult.documentType || 'general',
        confidence: analysisResult.confidence || 0.5,
        analysis: analysisResult.analysis || {}
      },
      highlightedSections: documentService.generateHighlightedSections(extractedText, analysisResult.riskFactors || []),
      clauses: documentService.generateClausesFromRisks(analysisResult.riskFactors || []),
      processedAt: new Date().toISOString(),
      reanalyzedAt: new Date().toISOString(),
      lastReanalyzed: new Date().toISOString(),
      errorMessage: null
    };
    
    await docRef.update(updatedData);
    
    console.log(`Re-analysis completed successfully for document: ${documentId}`);
    return {
      success: true,
      documentId,
      analysis: analysisResult
    };
    
  } catch (error) {
    console.error(`Re-analysis failed for document ${documentId}:`, error);
    
    // Update document status to error
    try {
      const { db } = await import('../config/firebase.js');
      const docRef = db.collection('documents').doc(documentId);
      await docRef.update({
        status: 'error',
        errorMessage: `Re-analysis failed: ${error.message}`,
        lastReanalyzed: new Date().toISOString()
      });
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }
    
    throw error;
  }
}

export default documentService;
