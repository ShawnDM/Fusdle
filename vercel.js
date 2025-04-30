// This file helps with Vercel deployment
const fs = require('fs-extra');
const path = require('path');

// Function to ensure static files are properly copied
async function copyStaticAssets() {
  // Paths
  const publicDir = path.resolve(__dirname, 'public');
  const distPublicDir = path.resolve(__dirname, 'dist', 'public');
  
  console.log('Vercel deployment: Copying static assets...');
  
  try {
    // Make sure the target directory exists
    await fs.ensureDir(distPublicDir);
    
    // List of critical files to copy
    const criticalFiles = [
      'favicon.ico',
      'preview.png',
      'sitemap.xml',
      'robots.txt'
    ];
    
    // Copy each file individually
    for (const file of criticalFiles) {
      const sourcePath = path.join(publicDir, file);
      const destPath = path.join(distPublicDir, file);
      
      if (fs.existsSync(sourcePath)) {
        await fs.copy(sourcePath, destPath);
        console.log(`Copied ${file} to dist/public directory`);
      } else {
        console.warn(`Warning: ${file} not found in public directory`);
      }
    }
    
    console.log('Static assets copy complete');
  } catch (error) {
    console.error('Error copying static assets:', error);
  }
}

// Execute when running this script directly
if (require.main === module) {
  copyStaticAssets();
}

module.exports = {
  copyStaticAssets
};