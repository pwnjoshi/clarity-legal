// Backend Health Check Script for Clarity Legal
// Run this with: node backendHealthCheck.js

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { testFirebaseConnection } from './config/firebase.js';
import { testGeminiConnection } from './services/geminiService.js';
import { testDocumentAI } from './services/documentService.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

/**
 * Comprehensive backend service health check
 */
async function backendHealthCheck() {
  console.log('🔍 Starting Clarity Legal Backend Health Check');
  console.log('============================================');
  
  const results = {
    environment: {},
    firebase: {},
    ai: {},
    filesystem: {},
    errors: [],
    recommendations: []
  };
  
  try {
    // Check critical environment variables
    console.log('\n📊 Checking environment variables...');
    
    // Frontend URL (for CORS)
    results.environment.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    console.log(`Frontend URL: ${results.environment.frontendUrl}`);
    
    if (!process.env.FRONTEND_URL) {
      console.warn('⚠️ FRONTEND_URL not set, defaulting to http://localhost:5173');
      results.recommendations.push('Set FRONTEND_URL environment variable to match your frontend URL exactly');
    }
    
    // Firebase variables
    const firebaseVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
    let missingFirebase = false;
    
    firebaseVars.forEach(variable => {
      const isSet = !!process.env[variable];
      results.environment[variable] = isSet ? 'Set' : 'Missing';
      
      if (!isSet) {
        console.error(`❌ ${variable} is not set`);
        missingFirebase = true;
        results.errors.push(`Missing ${variable} environment variable`);
      } else {
        console.log(`✅ ${variable} is set`);
      }
    });
    
    if (missingFirebase) {
      results.recommendations.push('Set all Firebase environment variables for document storage to work');
    }
    
    // Google AI variables
    const googleApiKey = process.env.GOOGLE_AI_API_KEY;
    const documentAiProcessor = process.env.DOCUMENT_AI_PROCESSOR_ID;
    
    results.environment.googleAiKey = googleApiKey ? 'Set' : 'Missing';
    results.environment.documentAiProcessor = documentAiProcessor ? 'Set' : 'Missing';
    
    console.log(`Google AI API Key: ${googleApiKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`Document AI Processor: ${documentAiProcessor ? '✅ Set' : '❌ Missing'}`);
    
    if (!googleApiKey) {
      console.warn('⚠️ GOOGLE_AI_API_KEY not set, AI features will use fallbacks');
      results.recommendations.push('Set GOOGLE_AI_API_KEY for enhanced AI document analysis');
    }
    
    if (!documentAiProcessor) {
      console.warn('⚠️ DOCUMENT_AI_PROCESSOR_ID not set, document extraction will use fallbacks');
      results.recommendations.push('Configure Document AI for better PDF text extraction');
    }
    
    // File system checks
    console.log('\n📁 Checking file system...');
    
    // Check uploads directory
    const uploadsDir = path.join(__dirname, 'uploads');
    let uploadsDirExists = false;
    
    try {
      fs.accessSync(uploadsDir);
      uploadsDirExists = true;
      console.log(`✅ Uploads directory exists: ${uploadsDir}`);
    } catch (error) {
      console.warn(`⚠️ Uploads directory does not exist: ${uploadsDir}`);
      console.log('   This will be created automatically when needed');
      results.recommendations.push('Create the uploads directory manually if automatic creation fails');
    }
    
    results.filesystem.uploadsDirectory = uploadsDirExists ? 'Exists' : 'Missing';
    
    // Check uploads permissions if directory exists
    if (uploadsDirExists) {
      try {
        // Try to write a test file
        const testFile = path.join(uploadsDir, 'test-write-permission.txt');
        fs.writeFileSync(testFile, 'Test write permission');
        fs.unlinkSync(testFile);
        results.filesystem.uploadsWritable = true;
        console.log('✅ Uploads directory is writable');
      } catch (error) {
        results.filesystem.uploadsWritable = false;
        console.error('❌ Uploads directory is not writable');
        results.errors.push('Uploads directory is not writable');
        results.recommendations.push('Fix uploads directory permissions for file uploads to work');
      }
    }
    
    // Service checks
    console.log('\n🔌 Testing service connections...');
    
    // Test Firebase
    try {
      console.log('Testing Firebase connection...');
      const firebaseTest = await testFirebaseConnection();
      results.firebase.connected = firebaseTest;
      
      if (firebaseTest) {
        console.log('✅ Firebase connection successful');
      } else {
        console.error('❌ Firebase connection failed');
        results.errors.push('Firebase connection failed');
        results.recommendations.push('Check Firebase credentials and project setup');
      }
    } catch (firebaseError) {
      results.firebase.connected = false;
      results.firebase.error = firebaseError.message;
      console.error('❌ Firebase test error:', firebaseError.message);
      results.errors.push(`Firebase error: ${firebaseError.message}`);
    }
    
    // Test Gemini AI
    try {
      console.log('Testing Gemini AI connection...');
      const geminiTest = await testGeminiConnection();
      results.ai.geminiConnected = geminiTest.success;
      results.ai.geminiMessage = geminiTest.message;
      
      if (geminiTest.success) {
        console.log('✅ Gemini AI connection successful');
      } else {
        console.warn(`⚠️ Gemini AI connection unavailable: ${geminiTest.message}`);
        results.recommendations.push('Configure Gemini AI for enhanced document analysis');
      }
    } catch (geminiError) {
      results.ai.geminiConnected = false;
      results.ai.geminiError = geminiError.message;
      console.warn('⚠️ Gemini AI test error:', geminiError.message);
    }
    
    // Test Document AI
    try {
      console.log('Testing Document AI connection...');
      const documentAiTest = await testDocumentAI();
      results.ai.documentAiConnected = documentAiTest.success;
      results.ai.documentAiMessage = documentAiTest.message;
      
      if (documentAiTest.success) {
        console.log('✅ Document AI connection successful');
      } else {
        console.warn(`⚠️ Document AI connection unavailable: ${documentAiTest.message}`);
        results.recommendations.push('Configure Document AI for better PDF text extraction');
      }
    } catch (documentAiError) {
      results.ai.documentAiConnected = false;
      results.ai.documentAiError = documentAiError.message;
      console.warn('⚠️ Document AI test error:', documentAiError.message);
    }
    
    // Check Vercel-specific environment
    if (process.env.VERCEL) {
      console.log('\n☁️ Running in Vercel environment');
      results.environment.isVercel = true;
      
      // In Vercel, check if we're using their environment system
      if (missingFirebase) {
        results.recommendations.push('For Vercel deployment, add all Firebase variables in the Vercel project settings');
      }
      
      if (process.env.VERCEL_URL) {
        console.log(`Vercel URL: ${process.env.VERCEL_URL}`);
        
        // Check if FRONTEND_URL is correctly set for Vercel
        if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes(process.env.VERCEL_URL)) {
          console.warn('⚠️ FRONTEND_URL does not match VERCEL_URL - this might cause CORS issues');
          results.recommendations.push(`Update FRONTEND_URL to match your Vercel deployment URL: ${process.env.VERCEL_URL}`);
        }
      }
    } else {
      results.environment.isVercel = false;
    }
    
    // Summary
    console.log('\n📋 Health Check Summary:');
    console.log('============================================');
    console.log(`Frontend URL: ${results.environment.frontendUrl}`);
    console.log(`Firebase Connection: ${results.firebase.connected ? '✅ CONNECTED' : '❌ FAILED'}`);
    console.log(`Gemini AI: ${results.ai.geminiConnected ? '✅ CONNECTED' : '⚠️ UNAVAILABLE'}`);
    console.log(`Document AI: ${results.ai.documentAiConnected ? '✅ CONNECTED' : '⚠️ UNAVAILABLE'}`);
    console.log(`Uploads Directory: ${results.filesystem.uploadsDirectory === 'Exists' ? '✅ OK' : '⚠️ MISSING'}`);
    
    if (results.filesystem.uploadsDirectory === 'Exists') {
      console.log(`Uploads Writable: ${results.filesystem.uploadsWritable ? '✅ OK' : '❌ ERROR'}`);
    }
    
    if (results.errors.length > 0) {
      console.log('\n⚠️ Errors:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      results.recommendations.forEach((recommendation, index) => {
        console.log(`${index + 1}. ${recommendation}`);
      });
    }
    
    console.log('\n✅ Health check complete');
    
    return {
      success: results.errors.length === 0,
      results,
      summary: `Health check completed with ${results.errors.length} errors and ${results.recommendations.length} recommendations`
    };
    
  } catch (error) {
    console.error('❌ Health check error:', error);
    return {
      success: false,
      error: error.message,
      summary: 'Health check failed with unexpected error'
    };
  }
}

// Run the health check
backendHealthCheck().then(result => {
  console.log('\nFinal Result:', result.success ? 'PASSED' : 'FAILED');
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('Health check failed with exception:', error);
  process.exit(1);
});