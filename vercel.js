// Vercel Deployment Helper
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper to ensure fs-extra is installed
function ensureDependencies() {
  try {
    // First try to require fs-extra
    require('fs-extra');
    console.log('fs-extra is already installed');
    return true;
  } catch (err) {
    // If it fails, try to install it
    try {
      console.log('Installing fs-extra...');
      execSync('npm install --no-save fs-extra', { stdio: 'inherit' });
      console.log('fs-extra installed successfully');
      return true;
    } catch (installError) {
      console.error('Failed to install fs-extra:', installError.message);
      // If installation fails, we'll use built-in fs
      return false;
    }
  }
}

// Function to ensure static files are properly copied
async function copyStaticAssets() {
  console.log('Starting Vercel deployment process...');
  
  // Check if we have fs-extra available
  const hasFsExtra = ensureDependencies();
  let fsExtra;
  
  if (hasFsExtra) {
    // Use fs-extra if available
    fsExtra = require('fs-extra');
  }
  
  // Paths
  const publicDir = path.resolve(__dirname, 'public');
  const distDir = path.resolve(__dirname, 'dist');
  const distPublicDir = path.resolve(distDir, 'public');
  
  console.log('Vercel deployment: Creating directories and copying static assets...');
  
  try {
    // Make sure the target directories exist
    if (hasFsExtra) {
      await fsExtra.ensureDir(distDir);
      await fsExtra.ensureDir(distPublicDir);
    } else {
      // Fallback to built-in fs
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }
      if (!fs.existsSync(distPublicDir)) {
        fs.mkdirSync(distPublicDir, { recursive: true });
      }
    }
    
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
      
      try {
        if (fs.existsSync(sourcePath)) {
          if (hasFsExtra) {
            await fsExtra.copy(sourcePath, destPath);
          } else {
            // Basic copy with built-in fs
            const data = fs.readFileSync(sourcePath);
            fs.writeFileSync(destPath, data);
          }
          console.log(`✅ Copied ${file} to dist/public directory`);
        } else {
          console.warn(`⚠️ Warning: ${file} not found in public directory`);
          
          // Create placeholder files if source doesn't exist
          if (file === 'robots.txt') {
            fs.writeFileSync(destPath, 'User-agent: *\nAllow: /\nSitemap: https://fusdle.com/sitemap.xml');
            console.log(`✅ Created placeholder ${file}`);
          } else if (file === 'sitemap.xml') {
            fs.writeFileSync(destPath, '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://fusdle.com/</loc></url></urlset>');
            console.log(`✅ Created placeholder ${file}`);
          }
        }
      } catch (copyError) {
        console.error(`⚠️ Error copying ${file}:`, copyError.message);
      }
    }
    
    console.log('✅ Static assets copy process complete');
    return true;
  } catch (error) {
    console.error('❌ Error during deployment setup:', error.message);
    return false;
  }
}

// Execute when running this script directly
if (require.main === module) {
  copyStaticAssets()
    .then(success => {
      if (success) {
        console.log('✅ Vercel deployment preparation completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Vercel deployment preparation failed');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('❌ Unhandled error in deployment preparation:', err);
      process.exit(1);
    });
}

module.exports = {
  copyStaticAssets
};