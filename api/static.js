// Static file server for SEO and social media files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Map of file paths to content types
const CONTENT_TYPES = {
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

export default function handler(req, res) {
  // Extract file name from path
  const filePath = req.query.path;
  
  if (!filePath) {
    return res.status(400).send('Missing path parameter');
  }
  
  // Security check - prevent directory traversal attacks
  if (filePath.includes('..') || !filePath.match(/^[a-zA-Z0-9_\-\.]+$/)) {
    return res.status(403).send('Invalid file path');
  }
  
  // Potential locations for the file
  const locations = [
    path.join(__dirname, '..', 'public', filePath),
    path.join(__dirname, '..', 'dist', 'public', filePath),
    path.join(__dirname, '..', filePath),
  ];
  
  // Find the first location that exists
  let foundPath = null;
  for (const loc of locations) {
    if (fs.existsSync(loc)) {
      foundPath = loc;
      break;
    }
  }
  
  if (!foundPath) {
    return res.status(404).send('File not found');
  }
  
  try {
    // Get file extension for content type
    const ext = path.extname(foundPath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
    
    // Read and serve the file
    const fileContent = fs.readFileSync(foundPath);
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Send the file
    return res.status(200).send(fileContent);
  } catch (error) {
    console.error(`Error serving static file ${filePath}:`, error);
    return res.status(500).send('Error serving file');
  }
}