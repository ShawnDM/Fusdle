// Status API endpoint for debugging SEO and static files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function handler(req, res) {
  // Critical files to check
  const criticalFiles = [
    'favicon.ico',
    'preview.png',
    'sitemap.xml',
    'robots.txt'
  ];
  
  // Potential locations to check
  const locations = [
    { name: 'public/', path: path.join(__dirname, '..', 'public') },
    { name: 'dist/public/', path: path.join(__dirname, '..', 'dist', 'public') },
    { name: 'root/', path: path.join(__dirname, '..') }
  ];
  
  // Results object
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    locations: {}
  };
  
  // Check each location
  locations.forEach(location => {
    results.locations[location.name] = {
      exists: fs.existsSync(location.path),
      files: {}
    };
    
    if (results.locations[location.name].exists) {
      criticalFiles.forEach(file => {
        const filePath = path.join(location.path, file);
        const fileExists = fs.existsSync(filePath);
        
        results.locations[location.name].files[file] = {
          exists: fileExists,
          size: fileExists ? fs.statSync(filePath).size : 0
        };
      });
    }
  });
  
  return res.status(200).json(results);
}