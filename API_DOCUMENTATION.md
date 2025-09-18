# Clarity Legal - API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Currently, the API does not require authentication. All endpoints are publicly accessible.

## Response Format
All API responses follow a consistent JSON format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

## Document Processing Endpoints

### Upload Document
Upload and process a legal document for analysis.

**Endpoint:** `POST /upload`  
**Content-Type:** `multipart/form-data`

**Parameters:**
- `document` (file, required): The document file to upload (PDF, DOC, DOCX, TXT)
- `docType` (string, optional): Type of document for processing optimization

**File Restrictions:**
- Maximum file size: 10MB
- Supported formats: PDF, DOC, DOCX, TXT
- OCR detection for scanned documents

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc_12345",
    "filename": "contract.pdf",
    "size": 2048576,
    "uploadDate": "2024-09-18T11:46:34Z",
    "status": "processed",
    "analysis": {
      "summary": "This is a service agreement...",
      "simplifiedText": "Simplified version of the document...",
      "riskFactors": [
        {
          "type": "payment_terms",
          "severity": "medium",
          "description": "Payment terms may be unclear",
          "recommendation": "Clarify payment schedule"
        }
      ],
      "keyPoints": ["Point 1", "Point 2"],
      "clauses": [
        {
          "title": "Payment Terms",
          "content": "Clause content...",
          "risk_level": "medium"
        }
      ]
    }
  }
}
```

### Re-analyze Document
Re-process an existing document with updated analysis.

**Endpoint:** `POST /documents/:id/reanalyze`  
**Content-Type:** `application/json`

**Parameters:**
- `id` (path parameter): Document ID to re-analyze

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc_12345",
    "status": "processed",
    "analysis": {
      // Updated analysis results
    }
  }
}
```

## Document Management Endpoints

### Get All Documents
Retrieve list of all processed documents.

**Endpoint:** `GET /documents`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc_12345",
      "filename": "contract.pdf",
      "uploadDate": "2024-09-18T11:46:34Z",
      "status": "processed",
      "size": 2048576,
      "docType": "contract"
    }
  ]
}
```

### Get Document Details
Retrieve detailed information for a specific document.

**Endpoint:** `GET /documents/:id`

**Parameters:**
- `id` (path parameter): Document ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc_12345",
    "filename": "contract.pdf",
    "size": 2048576,
    "uploadDate": "2024-09-18T11:46:34Z",
    "status": "processed",
    "analysis": {
      // Complete analysis results
    },
    "extractedText": "Full document text...",
    "metadata": {
      "pages": 5,
      "wordCount": 1500
    }
  }
}
```

## AI Services Endpoints

### AI Chat
Interact with the AI chat assistant for document-related queries.

**Endpoint:** `POST /ai-chat`  
**Content-Type:** `application/json`

**Parameters:**
```json
{
  "message": "Explain the payment terms in this contract",
  "documentId": "doc_12345", // optional
  "conversationId": "conv_67890" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Based on the contract, the payment terms specify...",
    "conversationId": "conv_67890",
    "timestamp": "2024-09-18T11:46:34Z",
    "typing": {
      "duration": 2500,
      "characterCount": 150
    }
  }
}
```

### AI Research
Perform legal research queries with comprehensive results.

**Endpoint:** `POST /ai-research`  
**Content-Type:** `application/json`

**Parameters:**
```json
{
  "query": "employment contract termination clauses",
  "context": "contract analysis", // optional
  "documentId": "doc_12345" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "employment contract termination clauses",
    "results": [
      {
        "title": "Understanding Termination Clauses",
        "content": "Termination clauses define...",
        "relevance": 0.95,
        "source": "Legal Research Database"
      }
    ],
    "suggestions": [
      "at-will employment",
      "notice periods",
      "severance pay"
    ],
    "timestamp": "2024-09-18T11:46:34Z"
  }
}
```

## Document Comparison Endpoints

### Compare Documents
Compare two documents side-by-side with detailed analysis.

**Endpoint:** `POST /compare-documents`  
**Content-Type:** `multipart/form-data`

**Parameters:**
- `originalDocument` (file, required): First document for comparison
- `comparisonDocument` (file, required): Second document for comparison
- `comparisonType` (string, optional): Type of comparison ("full", "clauses", "terms")

**Response:**
```json
{
  "success": true,
  "data": {
    "comparisonId": "comp_12345",
    "originalDocument": {
      "id": "doc_12345",
      "filename": "original.pdf"
    },
    "comparisonDocument": {
      "id": "doc_67890", 
      "filename": "revised.pdf"
    },
    "analysis": {
      "similarityScore": 0.85,
      "differences": [
        {
          "type": "addition",
          "section": "Payment Terms",
          "content": "Added late payment penalty clause",
          "location": "page 2, paragraph 3"
        }
      ],
      "recommendations": [
        "Review new penalty clause terms",
        "Verify compliance with local regulations"
      ]
    },
    "downloadUrl": "/api/comparisons/comp_12345/download",
    "createdAt": "2024-09-18T11:46:34Z"
  }
}
```

### Download Comparison Report
Download the complete comparison report as PDF.

**Endpoint:** `GET /comparisons/:id/download`

**Parameters:**
- `id` (path parameter): Comparison ID

**Response:** PDF file download

## System Endpoints

### Health Check
Check system health and service connectivity.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-09-18T11:46:34Z",
    "services": {
      "database": "connected",
      "storage": "connected",
      "documentAI": "connected",
      "geminiAI": "connected"
    },
    "version": "2.0.0",
    "uptime": "2h 30m 15s"
  }
}
```

## Error Codes

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (future use)
- `404` - Not Found (document/resource not found)
- `413` - Payload Too Large (file size exceeds limit)
- `415` - Unsupported Media Type (invalid file format)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

### Application Error Codes
```json
{
  "FILE_TOO_LARGE": "File size exceeds 10MB limit",
  "UNSUPPORTED_FORMAT": "File format not supported",
  "DOCUMENT_NOT_FOUND": "Document with specified ID not found",
  "PROCESSING_FAILED": "Document processing failed",
  "AI_SERVICE_UNAVAILABLE": "AI service temporarily unavailable",
  "INVALID_PARAMETERS": "Required parameters missing or invalid"
}
```

## Rate Limiting
- Currently no rate limiting implemented
- Future versions may include rate limiting based on:
  - IP address: 100 requests per hour
  - Document processing: 10 uploads per hour
  - AI services: 50 queries per hour

## File Upload Guidelines

### Supported Formats
- **PDF**: Including scanned documents with OCR
- **DOC/DOCX**: Microsoft Word documents
- **TXT**: Plain text files

### Size Limits
- Maximum file size: 10MB
- Recommended size: Under 5MB for optimal processing

### Processing Time
- Small files (< 1MB): 5-15 seconds
- Medium files (1-5MB): 15-45 seconds  
- Large files (5-10MB): 45-90 seconds

## Security Considerations
- File validation on both client and server
- Temporary file cleanup after processing
- No persistent storage of sensitive content
- Secure Firebase integration
- Input sanitization for all endpoints

## SDK and Integration Examples

### JavaScript/Node.js
```javascript
const FormData = require('form-data');
const fs = require('fs');

// Upload document
const uploadDocument = async (filePath) => {
  const form = new FormData();
  form.append('document', fs.createReadStream(filePath));
  
  const response = await fetch('http://localhost:3001/api/upload', {
    method: 'POST',
    body: form
  });
  
  return await response.json();
};

// AI Chat
const chatWithAI = async (message, documentId) => {
  const response = await fetch('http://localhost:3001/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, documentId })
  });
  
  return await response.json();
};
```

### cURL Examples
```bash
# Upload document
curl -X POST http://localhost:3001/api/upload \
  -F "document=@contract.pdf" \
  -F "docType=contract"

# AI Chat
curl -X POST http://localhost:3001/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain payment terms","documentId":"doc_12345"}'

# Get documents
curl -X GET http://localhost:3001/api/documents

# Health check
curl -X GET http://localhost:3001/api/health
```

## Changelog

### v2.0.0 (Current)
- Added AI chat endpoints (`/ai-chat`)
- Added AI research endpoints (`/ai-research`) 
- Added document comparison endpoints (`/compare-documents`)
- Fixed re-analyze functionality (`/documents/:id/reanalyze`)
- Enhanced error handling and responses
- Added comprehensive API documentation

### v1.2.0
- Initial API implementation
- Basic document processing endpoints
- Firebase integration
- AI analysis capabilities

---

**Last Updated:** September 2024  
**API Version:** 2.0.0  
**Documentation Version:** 1.0.0