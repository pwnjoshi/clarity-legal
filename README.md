# Clarity Legal

**AI-Powered Legal Document Analysis Platform**

Transform complex legal documents into clear, human-readable text with advanced AI analysis and risk assessment.

## ✨ Features

### Core Functionality
- 📄 **Enhanced Document Upload**: Support for PDF, DOC, DOCX, and TXT files (up to 10MB)
- 🤖 **AI Analysis**: Google Gemini AI converts legal jargon to plain English
- 🔍 **Advanced Text Extraction**: Google Cloud Document AI with OCR detection
- ⚠️ **Risk Assessment**: Comprehensive risk analysis with detailed factors
- ☁️ **Cloud Storage**: Secure Firebase Storage for document management
- 📊 **Interactive Document Dashboard**: Real-time document tracking and management

### Enhanced User Experience
- 📱 **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- 🎨 **Modern UI**: Glass morphism effects and smooth animations
- 🖥️ **Improved Layout**: Better header alignment and component spacing
- ⚡ **Performance**: Smooth transitions and optimized loading states

### Document Processing
- 🔄 **Smart Text Cleaning**: Advanced PDF text extraction with artifact removal
- 📋 **Formatted Analysis View**: Properly organized text with sections and paragraphs
- 🎯 **Highlighted Sections**: Interactive text highlighting with explanations
- 🔍 **OCR Detection**: Identifies scanned PDFs requiring OCR processing

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
```bash
# Copy and configure environment variables
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:
- Firebase project ID and service account
- Google AI API key
- Google Cloud Document AI processor ID

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
│ • Dashboard     │    │ • Firebase SDK  │    │ • Firebase      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
clarity-legal-main/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   └── services/          # API client
├── backend/               # Backend API server
│   ├── config/           # Firebase configuration
│   ├── services/         # Business logic services
│   ├── uploads/          # Temporary file uploads
│   └── server.js         # Express server
├── package.json          # Frontend dependencies
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

## 📖 API Documentation

### Upload Document
```http
POST /api/upload
Content-Type: multipart/form-data

Body:
- document: file
- docType: string (optional)
```

### Get Documents
```http
GET /api/documents
```

### Get Document Details
```http
GET /api/documents/:id
```

### Health Check
```http
GET /api/health
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

## 🆘 Support

For questions and support:
- Check the [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for detailed guides
- Open an issue for bug reports
- Contact the development team for feature requests

---

## 🆕 What's New in v1.2.0

### UI/UX Improvements
- ✨ Removed branding text for cleaner header design
- 🎨 Enhanced button styling with improved hover effects
- 🖥️ Better header alignment and component spacing
- 📱 Improved responsive design for mobile and tablet
- ⚡ Smoother animations and transitions throughout

### Document Processing Enhancements
- 🔄 Advanced PDF text cleaning and artifact removal
- 📋 Improved text formatting in analysis view with proper paragraphs
- 🎯 Better section header and list formatting
- 🔍 Enhanced OCR detection for scanned documents
- 🛠️ More robust error handling and user feedback

### Performance & Accessibility
- ⏱️ Optimized loading states and transitions
- 🖥️ Custom scrollbar styling for better UX
- ♿ Improved focus states for keyboard navigation
- 📊 Better document dashboard with enhanced filtering

**Status**: ✅ Production Ready | **Version**: 1.2.0 | **Last Updated**: September 2025
