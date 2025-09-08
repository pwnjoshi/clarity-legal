import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

dotenv.config();

let db = null;
let storage = null;

export async function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (getApps().length > 0) {
      console.log('🔥 Firebase already initialized');
      db = getFirestore();
      storage = getStorage();
      return { db, storage };
    }

    // Validate required environment variables
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Parse the private key (handle escaped newlines)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
    });

    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Storage
    storage = getStorage(app);
    
    console.log('🔥 Firebase Admin initialized successfully');
    console.log('☁️ Firebase Storage initialized successfully');
    return { db, storage };

  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
}

export async function saveDocumentMetadata(documentData) {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    const docRef = db.collection('documents').doc(documentData.id);
    await docRef.set({
      ...documentData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`📄 Document metadata saved: ${documentData.id}`);
    return documentData.id;

  } catch (error) {
    console.error('❌ Error saving document metadata:', error);
    throw new Error(`Failed to save document metadata: ${error.message}`);
  }
}

export async function getDocumentMetadata(documentId) {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    const docRef = db.collection('documents').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Document not found');
    }

    return doc.data();

  } catch (error) {
    console.error('❌ Error getting document metadata:', error);
    throw new Error(`Failed to get document metadata: ${error.message}`);
  }
}

export async function getAllDocuments(userId = null) {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    let query = db.collection('documents').orderBy('createdAt', 'desc');
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snapshot = await query.get();
    const documents = [];

    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return documents;

  } catch (error) {
    console.error('❌ Error getting all documents:', error);
    throw new Error(`Failed to get documents: ${error.message}`);
  }
}

export async function updateDocumentStatus(documentId, status, additionalData = {}) {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    const docRef = db.collection('documents').doc(documentId);
    await docRef.update({
      status,
      updatedAt: new Date(),
      ...additionalData
    });

    console.log(`📄 Document status updated: ${documentId} -> ${status}`);
    return true;

  } catch (error) {
    console.error('❌ Error updating document status:', error);
    throw new Error(`Failed to update document status: ${error.message}`);
  }
}

// Test Firebase connection
export async function testFirebaseConnection() {
  try {
    if (!db) {
      await initializeFirebase();
    }

    // Try to write a test document
    const testRef = db.collection('test').doc('connection-test');
    await testRef.set({
      timestamp: new Date(),
      message: 'Firebase connection test successful'
    });

    // Clean up test document
    await testRef.delete();

    console.log('✅ Firebase connection test successful');
    return true;

  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
}

// Firebase Storage functions
export async function uploadDocumentToStorage(filePath, fileName, metadata = {}) {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const bucket = storage.bucket();
    const file = bucket.file(`documents/${fileName}`);
    
    console.log(`☁️ Uploading document to Firebase Storage: ${fileName}`);
    
    await bucket.upload(filePath, {
      destination: `documents/${fileName}`,
      metadata: {
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          source: 'clarity-legal-backend'
        }
      }
    });
    
    // Get the download URL
    const [downloadURL] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491' // Far future date
    });
    
    console.log(`✅ Document uploaded successfully: ${fileName}`);
    
    return {
      fileName: fileName,
      storagePath: `documents/${fileName}`,
      downloadURL: downloadURL,
      uploadedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error uploading document to storage:', error);
    throw new Error(`Failed to upload document to storage: ${error.message}`);
  }
}

export async function getDocumentFromStorage(fileName) {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const bucket = storage.bucket();
    const file = bucket.file(`documents/${fileName}`);
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error('Document not found in storage');
    }
    
    const [downloadURL] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000 // 15 minutes
    });
    
    return downloadURL;
    
  } catch (error) {
    console.error('❌ Error getting document from storage:', error);
    throw new Error(`Failed to get document from storage: ${error.message}`);
  }
}

export async function deleteDocumentFromStorage(fileName) {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const bucket = storage.bucket();
    const file = bucket.file(`documents/${fileName}`);
    
    await file.delete();
    console.log(`🗑️ Document deleted from storage: ${fileName}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting document from storage:', error);
    throw new Error(`Failed to delete document from storage: ${error.message}`);
  }
}

export async function listDocumentsInStorage(prefix = 'documents/') {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ prefix });
    
    const documentList = [];
    
    for (const file of files) {
      const [metadata] = await file.getMetadata();
      documentList.push({
        name: file.name,
        size: metadata.size,
        contentType: metadata.contentType,
        created: metadata.timeCreated,
        updated: metadata.updated
      });
    }
    
    return documentList;
    
  } catch (error) {
    console.error('❌ Error listing documents from storage:', error);
    throw new Error(`Failed to list documents from storage: ${error.message}`);
  }
}

export { db, storage };
