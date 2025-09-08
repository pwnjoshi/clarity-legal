# Clarity Legal

**AI-Powered Legal Document Analysis Platform**

Transform complex legal documents into clear, human-readable text with advanced AI analysis and risk assessment.

## ✨ Features

- 📄 **Document Upload**: Support for PDF, DOC, DOCX, and TXT files (up to 10MB)
- 🤖 **AI Analysis**: Google Gemini AI converts legal jargon to plain English
- 🔍 **Text Extraction**: Google Cloud Document AI processes any document type
- ⚠️ **Risk Assessment**: Identify potential concerns and risk factors
- ☁️ **Cloud Storage**: Secure Firebase Storage for document management
- 📱 **Responsive Design**: Modern, dark-themed interface for all devices
- 📊 **Document Dashboard**: Track and manage all processed documents

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
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Custom CSS** - Modern dark theme

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Multer** - File upload handling
- **Firebase Admin SDK** - Database and storage

### AI & Cloud Services
- **Google Cloud Document AI** - Text extraction
- **Google Gemini AI** - Document analysis
- **Firebase Storage** - File storage
- **Firebase Firestore** - Document metadata

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

**Status**: ✅ Production Ready | **Version**: 1.0.0 | **Last Updated**: September 2025
