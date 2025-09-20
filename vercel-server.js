// vercel-server.js - This file helps with SPA routing on Vercel
const path = require('path');
const fs = require('fs');

module.exports = (req, res) => {
  // Get the path of the requested file
  const requestPath = req.url === '/' ? '/index.html' : req.url;
  
  // Check if the file exists in the public directory
  const filePath = path.join(__dirname, 'dist', requestPath);
  
  if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
    // If the file exists, serve it with the appropriate content type
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (ext) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpeg';
        break;
    }
    
    const content = fs.readFileSync(filePath);
    res.setHeader('Content-Type', contentType);
    res.end(content);
  } else {
    // If the file does not exist, serve the index.html file
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    const content = fs.readFileSync(indexPath);
    res.setHeader('Content-Type', 'text/html');
    res.end(content);
  }
};