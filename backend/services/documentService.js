import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
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
        this.client = new DocumentProcessorServiceClient();
        console.log('📄 Document AI service initialized');
      } catch (error) {
        console.warn('⚠️ Document AI initialization failed:', error.message);
        this.client = null;
      }
    } else {
      console.warn('⚠️ Document AI not configured. Will use fallback text extraction.');
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
      throw new Error(`Failed to extract text from ${fileExtension} file: ${error.message}`);
    }
  }

  async extractTextFromPDF(filePath) {
    try {
      console.log(`📄 Extracting text from PDF: ${filePath}`);
      
      // Lazy load pdf-parse to avoid initialization issues
      if (!pdfParse) {
        const pdfParseModule = await import('pdf-parse');
        pdfParse = pdfParseModule.default;
      }
      
      // Read the PDF file as buffer
      const fileBuffer = await fs.readFile(filePath);
      
      // Parse PDF and extract text
      const data = await pdfParse(fileBuffer);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No text found in PDF document');
      }
      
      const extractedText = data.text.trim();
      console.log(`✅ PDF text extraction successful (${extractedText.length} characters)`);
      console.log(`📊 PDF info: ${data.numpages} pages, ${data.info?.Title || 'No title'}`);
      
      return extractedText;

    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      throw new Error(`PDF text extraction failed: ${error.message}`);
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
      
      // Lazy load mammoth to avoid initialization issues
      if (!mammoth) {
        const mammothModule = await import('mammoth');
        mammoth = mammothModule.default;
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

export default documentService;
