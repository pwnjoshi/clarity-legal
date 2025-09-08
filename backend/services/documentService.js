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
      
      // Validate file exists and is readable
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        throw new Error('PDF file is empty');
      }
      
      // Lazy load pdf-parse to avoid initialization issues
      if (!pdfParse) {
        const pdfParseModule = await import('pdf-parse');
        pdfParse = pdfParseModule.default;
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
      
      const data = await pdfParse(fileBuffer, parseOptions);
      
      console.log(`📊 PDF parsing complete: ${data.numpages} pages processed`);
      console.log(`📄 Title: ${data.info?.Title || 'No title'}`);
      console.log(`👤 Author: ${data.info?.Author || 'Unknown'}`);
      
      if (!data.text) {
        throw new Error('PDF parsing returned no text data');
      }
      
      let extractedText = data.text.trim();
      
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
        throw new Error('This PDF contains scanned images rather than text. OCR processing is required for text extraction.');
      } else {
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
