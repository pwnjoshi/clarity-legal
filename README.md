# Clarity Legal

**AI-Powered Legal Document Analysis Platform**

Transform complex legal documents into clear, human-readable text with advanced AI analysis and risk assessment. Features integrated AI chat, research capabilities, and document comparison tools.

## ✨ Features

### 🚀 New AI-Powered Tools
- 💬 **AI Chat Assistant**: Interactive AI chat with typing animations and professional dark theme
- 🔬 **AI Research Panel**: Integrated research tool with typing cursor effects and search history
- 📊 **Document Comparison**: Side-by-side document analysis and comparison capabilities
- 🎯 **Smart Analysis**: Enhanced document re-analysis with fixed risk assessment

### Core Functionality
- 📄 **Enhanced Document Upload**: Support for PDF, DOC, DOCX, and TXT files (up to 10MB)
- 🤖 **AI Analysis**: Google Gemini AI converts legal jargon to plain English
- 🔍 **Advanced Text Extraction**: Google Cloud Document AI with OCR detection
- ⚠️ **Risk Assessment**: Comprehensive risk analysis with detailed factors and recommendations
- ☁️ **Cloud Storage**: Secure Firebase Storage for document management
- 📊 **Interactive Document Dashboard**: Real-time document tracking and management

### Enhanced User Experience
- 📱 **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- 🎨 **Modern UI**: Professional dark theme with orange accents and glass morphism effects
- 🖥️ **Improved Layout**: Clean header design and enhanced component spacing
- ⚡ **Performance**: Smooth transitions, typing animations, and optimized loading states
- 🏠 **New Homepage**: Modern landing page with professional branding

### Document Processing & Analysis
- 🔄 **Smart Text Cleaning**: Advanced PDF text extraction with artifact removal
- 📋 **Formatted Analysis View**: Properly organized text with sections and paragraphs
- 🎯 **Highlighted Sections**: Interactive text highlighting with explanations
- 🔍 **OCR Detection**: Identifies scanned PDFs requiring OCR processing
- 🔧 **Re-Analysis**: Fixed re-analyze functionality with proper status management
- 🤖 **AI Chat Integration**: Contextual document assistance in sidebar

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Firebase project with Storage enabled
- Google Cloud project with Document AI enabled
- Google AI API key (Gemini)

### 1. Clone & Install
```bash
git clone <repository-url>
cd clarity-legal-main

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Environment Setup

#### Frontend Environment
```bash
# Copy and configure frontend environment variables
cp .env.example .env.local
```

#### Backend Environment
```bash
# Copy and configure backend environment variables
cp backend/.env.example backend/.env
```

Edit your environment files with your credentials:
- Firebase project ID and service account
- Google AI API key
- Google Cloud Document AI processor ID

#### Firebase Configuration
Create the Firebase configuration file:
```bash
cp src/firebaseConfig.example.js src/firebaseConfig.js
```

Edit `src/firebaseConfig.js` with your Firebase credentials.

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed instructions on securing your credentials.

### 3. Start Development Servers
```bash
# Terminal 1: Frontend (from project root)
npm run dev

# Terminal 2: Backend (from backend directory)
cd backend
npm start
```

### 4. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Express API   │    │   Google Cloud  │
│   (Frontend)    │───▶│   (Backend)     │───▶│   Services      │
│                 │    │                 │    │                 │
│ • File Upload   │    │ • File Processing│   │ • Document AI   │
│ • Document View │    │ • AI Integration│    │ • Gemini AI     │
│ • AI Chat       │    │ • Document Comp │    │ • Firebase      │
│ • AI Research   │    │ • AI Chat Routes│    │ • Storage       │
│ • Doc Compare   │    │ • Risk Analysis │    │ • Firestore     │
│ • Dashboard     │    │ • Firebase SDK  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
clarity-legal-main/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── AIChat.jsx      # AI chat assistant component
│   │   ├── AIResearch.jsx  # AI research panel component
│   │   ├── DocumentComparison.jsx # Document comparison tool
│   │   ├── DocumentDisplay.jsx    # Enhanced document viewer
│   │   └── DocumentDashboard.jsx  # Document management
│   ├── pages/             # Page components
│   │   ├── home.jsx        # New modern homepage
│   │   ├── DocumentViewer.jsx # Enhanced document viewer
│   │   ├── dashboard.jsx   # Updated dashboard
│   │   └── home.jsx        # Home/landing page
│   └── services/          # API client
├── backend/               # Backend API server
│   ├── config/           # Firebase configuration
│   ├── routes/           # API route handlers
│   │   ├── ai-chat.js      # AI chat API routes
│   │   └── document-comparison.js # Document comparison API
│   ├── services/         # Business logic services
│   │   ├── documentService.js     # Enhanced document processing
│   │   ├── documentComparisonService.js # Comparison logic
│   │   ├── geminiService.js       # AI analysis service
│   │   └── riskAnalyzer.js        # Fixed risk analysis
│   ├── uploads/          # Temporary file uploads & comparisons
│   └── server.js         # Enhanced Express server
├── package.json          # Frontend dependencies
├── PROJECT_DOCUMENTATION.md # Complete technical docs
└── README.md            # This file
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework with modern hooks
- **Vite** - Lightning-fast build tool and dev server
- **React Router** - Client-side routing with protected routes
- **Custom CSS** - Modern dark theme with glass morphism effects
- **Responsive Design** - Mobile-first approach with smooth animations

### Backend
- **Node.js 18+** - Runtime environment with ES modules
- **Express.js** - Web framework with middleware support
- **Multer** - Advanced file upload handling with validation
- **Firebase Admin SDK** - Database, storage, and authentication
- **PDF-Parse** - Enhanced PDF text extraction
- **Mammoth.js** - DOCX document processing

### AI & Cloud Services
- **Google Cloud Document AI** - Professional text extraction with OCR
- **Google Gemini AI** - Advanced document analysis and simplification
- **Firebase Storage** - Secure cloud file storage
- **Firebase Firestore** - Real-time NoSQL database

### Enhanced Features
- **Smart Text Processing** - Advanced cleaning and formatting algorithms
- **Error Handling** - Comprehensive error detection and user feedback
- **Performance Optimization** - Efficient loading and caching strategies
- **Accessibility** - WCAG compliant with focus states and screen reader support

## 📆 API Documentation

### Document Processing
```http
POST /api/upload
Content-Type: multipart/form-data

Body:
- document: file
- docType: string (optional)
```

```http
POST /api/documents/:id/reanalyze
Content-Type: application/json

Response: Updated document analysis
```

### Document Management
```http
GET /api/documents
Response: List of all processed documents
```

```http
GET /api/documents/:id
Response: Specific document details and analysis
```

### AI Services
```http
POST /api/ai-chat
Content-Type: application/json

Body:
- message: string
- documentId: string (optional)
```

```http
POST /api/ai-research
Content-Type: application/json

Body:
- query: string
- context: string (optional)
```

### Document Comparison
```http
POST /api/compare-documents
Content-Type: multipart/form-data

Body:
- originalDocument: file
- comparisonDocument: file
```

### Health Check
```http
GET /api/health
Response: Server status and service connectivity
```

## 🔧 Configuration

### Required Environment Variables
```env
# Server
PORT=3001
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# Google AI
GOOGLE_AI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# Google Cloud Document AI
GOOGLE_CLOUD_PROJECT_ID=your-project-id
DOCUMENT_AI_PROCESSOR_ID=your-processor-id
DOCUMENT_AI_LOCATION=us

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,txt
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the dist/ folder
```

### Backend (Railway/Heroku)
```bash
cd backend
npm start
# Configure environment variables in hosting platform
```

## 📄 Documentation

For complete development documentation, architecture details, and troubleshooting guides, see:
- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) - Complete technical documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Troubleshooting

If you encounter issues with the application, check these resources:

- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Solutions for common local development issues
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide for Vercel
- [ROUTE_REFRESH_FIX.md](./ROUTE_REFRESH_FIX.md) - Fixing 404 errors when refreshing routes
- [deployment-checklist.md](./deployment-checklist.md) - Comprehensive troubleshooting checklist
- [ENV_SETUP.md](./ENV_SETUP.md) - Environment variable configuration guide

Common issues and solutions:
1. **"Failed to fetch" errors**: Check your backend is running and environment variables are set correctly
2. **404 errors on route refresh**: Follow the fix in ROUTE_REFRESH_FIX.md
3. **Document processing issues**: Verify Firebase credentials and backend services

For debugging tools:
- Use the browser's developer console (F12) to check for CORS and API errors
- Check the backend console for detailed processing logs

## 🆘 Support

For questions and support:
- Check the troubleshooting guides listed above
- Check the [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for detailed guides
- Open an issue for bug reports
- Contact the development team for feature requests

---

## 🆕 What's New in v2.0.0 - Major Feature Update

### 🚀 New AI-Powered Components
- 💬 **AI Chat Assistant**: Integrated conversational AI with typing animations and professional dark theme
- 🔬 **AI Research Panel**: Comprehensive research tool with typing cursor effects and search history in document viewer sidebar
- 📊 **Document Comparison**: Advanced side-by-side document analysis and comparison capabilities
- 🏠 **New Homepage**: Modern landing page with professional branding and enhanced navigation
- 📄 **Enhanced Document Display**: Improved document viewer with better formatting and interactivity

### 🔧 Backend Improvements
- 🎯 **Fixed Re-Analysis**: Resolved re-analyze button functionality with proper `riskAnalyzer.analyzeRisks()` method calls
- 🚀 **New API Endpoints**: Added AI chat, research, and document comparison services
- 📊 **Enhanced Document Service**: Improved risk analysis mapping and error handling
- 🛡️ **Better Status Management**: Proper document processing status tracking

### 🎨 UI/UX Enhancements
- 🎆 **Consistent Dark Theme**: Professional dark theme with orange accents across all components
- ✨ **Typing Animations**: Realistic typing effects for AI responses with dynamic speed and pauses
- 🖥️ **Cleaner Design**: Removed branding text, improved header alignment and component spacing
- 📱 **Enhanced Responsive Design**: Better mobile and tablet experience with touch-friendly interfaces
- 🌊 **Glass Morphism**: Modern backdrop blur effects and smooth transitions
- ♿ **Accessibility**: Improved keyboard navigation and focus states

### 📈 Technical Improvements
- 🔄 **Enhanced Processing**: Advanced PDF text cleaning and OCR detection
- 🛠️ **Better Error Handling**: Comprehensive error detection and user feedback
- 🎨 **Performance**: Optimized loading states and smooth animations
- 📋 **Formatted Display**: Proper text organization with sections and paragraphs

**Status**: ✅ Production Ready | **Version**: 2.0.0 | **Last Updated**: September 2024
