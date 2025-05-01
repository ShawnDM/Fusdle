#!/bin/bash
set -e

echo "Starting Vercel build process..."

# Build the application
echo "Building application..."
npm run build

# Create the dist directories
echo "Creating output directories..."
mkdir -p dist
mkdir -p dist/public
mkdir -p dist/api

# Copy static files
echo "Copying static files..."
for file in favicon.ico preview.png sitemap.xml robots.txt; do
  if [ -f "public/$file" ]; then
    echo "  Copying $file..."
    cp -f "public/$file" "dist/public/" || echo "  ⚠️ Failed to copy $file"
  else
    echo "  ⚠️ $file not found in public directory"
  fi
done

# Create API directory if not exists
echo "Setting up API routes..."
cp -f api/index.js dist/api/ || echo "  ⚠️ Failed to copy API handler"

# Generate fallback static files if missing
if [ ! -f "dist/public/robots.txt" ]; then
  echo "Generating robots.txt..."
  echo "User-agent: *
Allow: /
Sitemap: https://fusdle.com/sitemap.xml" > "dist/public/robots.txt"
fi

if [ ! -f "dist/public/sitemap.xml" ]; then
  echo "Generating sitemap.xml..."
  echo '<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://fusdle.com/</loc></url>
<url><loc>https://fusdle.com/archive</loc></url>
<url><loc>https://fusdle.com/help</loc></url>
</urlset>' > "dist/public/sitemap.xml"
fi

echo "✅ Build process complete"