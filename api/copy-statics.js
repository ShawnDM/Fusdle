// Copy static files during build through API endpoint
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function handler(req, res) {
  // Define source and target directories
  const publicDir = path.join(__dirname, '..', 'public');
  const distPublicDir = path.join(__dirname, '..', 'dist', 'public');
  
  // Files to copy
  const filesToCopy = [
    'favicon.ico',
    'preview.png',
    'sitemap.xml',
    'robots.txt'
  ];
  
  // Create record of actions
  const results = {
    timestamp: new Date().toISOString(),
    copied: [],
    errors: []
  };
  
  try {
    // Ensure the target directory exists
    if (!fs.existsSync(distPublicDir)) {
      try {
        fs.mkdirSync(distPublicDir, { recursive: true });
        results.copied.push('Created dist/public directory');
      } catch (mkdirErr) {
        results.errors.push(`Failed to create dist/public directory: ${mkdirErr.message}`);
      }
    }
    
    // Copy each file
    for (const file of filesToCopy) {
      try {
        const sourcePath = path.join(publicDir, file);
        const targetPath = path.join(distPublicDir, file);
        
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, targetPath);
          results.copied.push(`Copied ${file}`);
        } else {
          results.errors.push(`Source file not found: ${file}`);
          
          // Create placeholder files
          if (file === 'robots.txt') {
            fs.writeFileSync(targetPath, 'User-agent: *\nAllow: /\nSitemap: https://fusdle.com/sitemap.xml');
            results.copied.push(`Created placeholder ${file}`);
          } else if (file === 'sitemap.xml') {
            fs.writeFileSync(targetPath, '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://fusdle.com/</loc></url></urlset>');
            results.copied.push(`Created placeholder ${file}`);
          }
        }
      } catch (copyErr) {
        results.errors.push(`Error processing ${file}: ${copyErr.message}`);
      }
    }
    
    return res.status(200).json(results);
  } catch (error) {
    results.errors.push(`General error: ${error.message}`);
    return res.status(500).json(results);
  }
}