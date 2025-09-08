import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Import our custom modules
import { 
  initializeFirebase, 
  saveDocumentMetadata, 
  uploadDocumentToStorage,
  getDocumentFromStorage
} from './config/firebase.js';
import { processWithGemini } from './services/geminiService.js';
import { extractTextFromDocument } from './services/documentService.js';
import { analyzeRisks } from './services/riskAnalyzer.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');

// Function to ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
    console.log('📁 Created uploads directory');
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt').split(',');
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExtension} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Initialize Firebase
let firebaseInitialized = false;

// Function to initialize Firebase
async function initFirebase() {
  try {
    await initializeFirebase();
    firebaseInitialized = true;
    console.log('🔥 Firebase initialized successfully');
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed:', error.message);
    console.log('📋 Continuing without Firebase (development mode)');
  }
}

// Function to create fallback analysis from actual text
function createFallbackAnalysis(text) {
  const textLower = text.toLowerCase();
  
  // Detect document type
  let docType = 'legal document';
  if (textLower.includes('license') || textLower.includes('software')) {
    docType = 'software license agreement';
  } else if (textLower.includes('employment') || textLower.includes('employee')) {
    docType = 'employment contract';
  } else if (textLower.includes('lease') || textLower.includes('rental')) {
    docType = 'lease agreement';
  } else if (textLower.includes('privacy') || textLower.includes('data')) {
    docType = 'privacy policy';
  } else if (textLower.includes('terms') && textLower.includes('service')) {
    docType = 'terms of service';
  }
  
  // Analyze risk level
  const highRiskKeywords = ['liable', 'damages', 'penalty', 'forfeit', 'indemnify', 'limitation of liability'];
  const mediumRiskKeywords = ['restrictions', 'obligations', 'terminate', 'breach'];
  const lowRiskKeywords = ['standard', 'typical', 'reasonable', 'mutual'];
  
  let riskLevel = 'medium';
  const riskFactors = [];
  
  if (highRiskKeywords.some(keyword => textLower.includes(keyword))) {
    riskLevel = 'high';
    riskFactors.push({ level: 'high', description: 'Contains liability limitations or penalty clauses' });
  }
  
  if (mediumRiskKeywords.some(keyword => textLower.includes(keyword))) {
    riskFactors.push({ level: 'medium', description: 'Contains restrictions and termination conditions' });
  }
  
  if (lowRiskKeywords.some(keyword => textLower.includes(keyword))) {
    riskFactors.push({ level: 'low', description: 'Contains standard legal language' });
  } else if (riskLevel === 'medium' && riskFactors.length === 0) {
    riskFactors.push({ level: 'medium', description: 'Standard legal document with typical terms' });
  }
  
  // Find important phrases to highlight
  const highlightedSections = [];
  const importantPhrases = [
    { phrase: 'non-exclusive', type: 'right', explanation: 'Others can also get the same rights' },
    { phrase: 'non-transferable', type: 'obligation', explanation: 'You cannot give or sell these rights to someone else' },
    { phrase: 'shall not', type: 'obligation', explanation: 'Things you are not allowed to do' },
    { phrase: 'liable', type: 'risk', explanation: 'Who is responsible if something goes wrong' },
    { phrase: 'damages', type: 'risk', explanation: 'Financial responsibility for losses' },
    { phrase: 'terminate', type: 'clause', explanation: 'How the agreement can be ended' },
    { phrase: 'breach', type: 'risk', explanation: 'What happens if rules are broken' }
  ];
  
  importantPhrases.forEach(({ phrase, type, explanation }) => {
    const index = textLower.indexOf(phrase);
    if (index !== -1) {
      highlightedSections.push({
        text: text.substring(index, index + phrase.length),
        startIndex: index,
        endIndex: index + phrase.length,
        type: type,
        explanation: explanation,
        severity: type === 'risk' ? 'high' : type === 'obligation' ? 'medium' : 'low'
      });
    }
  });
  
  // Extract potential clauses (numbered sections)
  const clauses = [];
  const clausePattern = /\d+\.\s*([A-Z][A-Z\s]+)\.?([^\d]{50,200})/g;
  let match;
  
  while ((match = clausePattern.exec(text)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    
    clauses.push({
      title: title,
      content: content,
      type: title.toLowerCase().includes('termination') ? 'termination' :
             title.toLowerCase().includes('liability') ? 'liability' :
             title.toLowerCase().includes('payment') ? 'payment' : 'other',
      importance: title.toLowerCase().includes('liability') || 
                  title.toLowerCase().includes('termination') ? 'high' : 'medium',
      explanation: `This clause defines ${title.toLowerCase()} terms and conditions.`
    });
  }
  
  // Key terms
  const keyTerms = [];
  if (textLower.includes('non-exclusive')) {
    keyTerms.push({ term: 'Non-exclusive', definition: 'Others can also receive the same rights or permissions' });
  }
  if (textLower.includes('non-transferable')) {
    keyTerms.push({ term: 'Non-transferable', definition: 'You cannot give, sell, or transfer these rights to another person' });
  }
  if (textLower.includes('liability')) {
    keyTerms.push({ term: 'Liability', definition: 'Legal responsibility for damages, losses, or injuries' });
  }
  if (textLower.includes('breach')) {
    keyTerms.push({ term: 'Breach', definition: 'Breaking or violating the terms of the agreement' });
  }
  
  return {
    simplifiedText: `This appears to be a ${docType}. The document contains ${riskLevel} risk level terms. Key points include restrictions on usage, obligations for both parties, and ${riskLevel === 'high' ? 'significant liability limitations' : 'standard legal protections'}.`,
    riskAnalysis: {
      overallRisk: riskLevel,
      riskFactors: riskFactors
    },
    highlightedSections: highlightedSections.slice(0, 10), // Limit to first 10 highlights
    clauses: clauses.slice(0, 5), // Limit to first 5 clauses
    keyTerms: keyTerms
  };
}

// ====================================
// API ROUTES
// ====================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      firebase: firebaseInitialized,
      gemini: !!process.env.GOOGLE_AI_API_KEY,
      documentAI: !!process.env.DOCUMENT_AI_PROCESSOR_ID
    }
  });
});

// PHASE 2: File upload with mock processing
app.post('/api/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log(`📄 File uploaded: ${req.file.originalname}`);

    // Phase 3: Extract actual text from uploaded document
    let extractedText;
    
    try {
      console.log('📄 Extracting text from uploaded document...');
      extractedText = await extractTextFromDocument(req.file.path);
      console.log(`✅ Text extraction successful (${extractedText.length} characters)`);
    } catch (extractionError) {
      console.warn('⚠️ Text extraction failed:', extractionError.message);
      console.log('🔄 Using fallback text extraction...');
      
      try {
        // Try fallback extraction
        extractedText = await extractTextFromDocument(req.file.path, true);
        console.log(`✅ Fallback extraction successful (${extractedText.length} characters)`);
      } catch (fallbackError) {
        console.error('❌ Both extraction methods failed:', fallbackError.message);
        // Provide specific error message based on file type
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let errorMessage = `Text extraction failed for ${req.file.originalname}. `;
        
        if (fileExt === '.pdf') {
          errorMessage += 'This PDF may be image-based or protected. Try using a PDF with selectable text or enable OCR.';
        } else if (fileExt === '.doc') {
          errorMessage += 'Legacy .DOC format requires Document AI. Please convert to .DOCX format for better compatibility.';
        } else if (fileExt === '.docx') {
          errorMessage += 'This DOCX file may be corrupted or protected. Please try re-saving the document.';
        } else {
          errorMessage += 'Please ensure the document contains readable text and try a supported format (PDF, DOCX, TXT).';
        }
        
        extractedText = errorMessage;
      }
    }

    // Document metadata
    const documentData = {
      id: req.file.filename.split('.')[0],
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname).toLowerCase(),
      uploadedAt: new Date().toISOString(),
      status: 'processing'
    };

    // Phase 3: Enhanced processing with structured analysis
    let analysisResult;
    
    try {
      // Try real Gemini processing with enhanced structure using actual extracted text
      analysisResult = await processWithGemini(extractedText);
      
      // If Gemini returned a string (old format), convert to structured format
      if (typeof analysisResult === 'string') {
        analysisResult = {
          simplifiedText: analysisResult,
          riskAnalysis: analyzeRisks(extractedText),
          highlightedSections: [],
          clauses: [],
          keyTerms: []
        };
      }
      
      documentData.status = 'processed';
      documentData.processedAt = new Date().toISOString();
      documentData.riskLevel = analysisResult.riskAnalysis?.overallRisk || 'medium';
      
      console.log('✨ Document processed with enhanced Gemini AI analysis');
    } catch (geminiError) {
      console.log('⚠️ Gemini processing failed, using mock response:', geminiError.message);
      
      // Fallback to dynamic analysis based on actual extracted text
      analysisResult = createFallbackAnalysis(extractedText);
      
      documentData.status = 'processed_mock';
    }

    // Add extracted text and analysis to document data
    documentData.extractedText = extractedText;
    documentData.analysis = analysisResult;

    // Always save to local storage for fallback
    localDocuments.set(documentData.id, documentData);
    console.log(`💾 Document saved to local storage: ${documentData.id}`);

    // Save document file to Firebase Storage and metadata to Firestore
    if (firebaseInitialized) {
      try {
        // Upload document file to Firebase Storage
        console.log('☁️ Uploading document to Firebase Storage...');
        const storageResult = await uploadDocumentToStorage(
          req.file.path,
          req.file.filename,
          {
            originalName: req.file.originalname,
            fileType: documentData.fileType,
            fileSize: documentData.fileSize.toString(),
            docType: req.body.docType || 'Other',
            processedAt: documentData.processedAt
          }
        );
        
        // Add storage information to document data
        documentData.storageInfo = {
          storagePath: storageResult.storagePath,
          downloadURL: storageResult.downloadURL,
          fileName: storageResult.fileName,
          cloudStored: true
        };
        
        // Save metadata to Firestore
        await saveDocumentMetadata(documentData);
        
        console.log('✅ Document uploaded to cloud storage successfully');
        console.log('💾 Document metadata saved to Firebase');
        
      } catch (firebaseError) {
        console.warn('⚠️ Failed to save to Firebase:', firebaseError.message);
        // Add flag to indicate cloud storage failed
        documentData.storageInfo = {
          cloudStored: false,
          error: firebaseError.message,
          localPath: req.file.path
        };
      }
    } else {
      // Firebase not initialized, store locally only
      documentData.storageInfo = {
        cloudStored: false,
        localPath: req.file.path,
        note: 'Firebase not configured - stored locally only'
      };
    }

    // Return enhanced response
    res.json({
      success: true,
      data: {
        document: documentData,
        extractedText: extractedText,
        analysis: analysisResult,
        // Legacy fields for compatibility
        simplifiedText: analysisResult.simplifiedText,
        riskAnalysis: analysisResult.riskAnalysis,
        message: 'Document processed successfully with enhanced analysis!'
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PHASE 3: Full document processing with Document AI
app.post('/api/process-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log(`📄 Processing document: ${req.file.originalname}`);

    // Extract text using Document AI
    let extractedText;
    try {
      extractedText = await extractTextFromDocument(req.file.path);
      console.log('📝 Text extracted with Document AI');
    } catch (docAIError) {
      console.log('⚠️ Document AI failed, falling back to basic extraction');
      // Fallback to basic text extraction
      extractedText = await extractTextFromDocument(req.file.path, true);
    }

    // Process with Gemini
    const simplifiedText = await processWithGemini(extractedText);
    
    // Analyze risks
    const riskAnalysis = analyzeRisks(extractedText);

    // Document metadata
    const documentData = {
      id: req.file.filename.split('.')[0],
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname).toLowerCase(),
      uploadedAt: new Date().toISOString(),
      status: 'processed',
      processedAt: new Date().toISOString(),
      extractedTextLength: extractedText.length
    };

    // Save to Firebase
    if (firebaseInitialized) {
      try {
        await saveDocumentMetadata(documentData);
        console.log('💾 Document metadata saved to Firebase');
      } catch (firebaseError) {
        console.warn('⚠️ Failed to save to Firebase:', firebaseError.message);
      }
    }

    res.json({
      success: true,
      data: {
        document: documentData,
        extractedText: extractedText.substring(0, 500) + '...', // Truncated for response
        simplifiedText: simplifiedText,
        riskAnalysis: riskAnalysis,
        message: 'Document processed successfully with full pipeline!'
      }
    });

  } catch (error) {
    console.error('❌ Processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get document from cloud storage
app.get('/api/documents/:documentId/download', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    if (!firebaseInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Cloud storage not available'
      });
    }
    
    // Get document metadata from Firestore
    const { getDocumentMetadata } = await import('./config/firebase.js');
    const docMetadata = await getDocumentMetadata(documentId);
    
    if (!docMetadata.storageInfo?.cloudStored) {
      return res.status(404).json({
        success: false,
        error: 'Document not found in cloud storage'
      });
    }
    
    // Get download URL from Firebase Storage
    const downloadURL = await getDocumentFromStorage(docMetadata.storageInfo.fileName);
    
    res.json({
      success: true,
      downloadURL: downloadURL,
      metadata: docMetadata
    });
    
  } catch (error) {
    console.error('❌ Error getting document download URL:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Local document storage for fallback
const localDocuments = new Map();

// Get all documents (from Firebase or local fallback)
app.get('/api/documents', async (req, res) => {
  try {
    let documents = [];
    let message = '';
    
    if (!firebaseInitialized) {
      // Use local documents when Firebase is not available
      documents = Array.from(localDocuments.values());
      message = `Firebase not configured - showing ${documents.length} local documents`;
    } else {
      try {
        const { getAllDocuments } = await import('./config/firebase.js');
        documents = await getAllDocuments();
        message = `Documents retrieved successfully from Firebase (${documents.length} documents)`;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase query failed, using local fallback:', firebaseError.message);
        // Fallback to local documents
        documents = Array.from(localDocuments.values());
        message = `Firebase query failed - showing ${documents.length} local documents`;
      }
    }
    
    // Sort documents by upload date (newest first)
    documents.sort((a, b) => new Date(b.uploadedAt || b.createdAt) - new Date(a.uploadedAt || a.createdAt));
    
    res.json({
      success: true,
      documents: documents,
      count: documents.length,
      message: message
    });
  } catch (error) {
    console.error('❌ Documents retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete document from cloud storage
app.delete('/api/documents/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    if (!firebaseInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Cloud storage not available'
      });
    }
    
    // Get document metadata first
    const { getDocumentMetadata, deleteDocumentFromStorage, db } = await import('./config/firebase.js');
    const docMetadata = await getDocumentMetadata(documentId);
    
    // Delete from Firebase Storage if stored in cloud
    if (docMetadata.storageInfo?.cloudStored) {
      await deleteDocumentFromStorage(docMetadata.storageInfo.fileName);
    }
    
    // Delete metadata from Firestore
    const docRef = db.collection('documents').doc(documentId);
    await docRef.delete();
    
    console.log(`🗑️ Document deleted: ${documentId}`);
    
    res.json({
      success: true,
      message: 'Document deleted successfully from cloud storage'
    });
    
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Clarity Legal Backend running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  
  // Initialize services after server starts
  await ensureUploadsDir();
  await initFirebase();
});

export default app;
