#!/bin/bash

# Build the application
npm run build

# Install fs-extra for the copy operations
npm install --no-save fs-extra

# Create the dist directory if it doesn't exist
mkdir -p dist/public

# Run the static asset helper script
echo "Running Vercel static asset copy script..."
node vercel.js

# Also copy files manually as a fallback
echo "Also copying files manually as a fallback..."
cp -f public/favicon.ico dist/public/ || echo "Failed to copy favicon.ico"
cp -f public/preview.png dist/public/ || echo "Failed to copy preview.png"
cp -f public/sitemap.xml dist/public/ || echo "Failed to copy sitemap.xml"
cp -f public/robots.txt dist/public/ || echo "Failed to copy robots.txt"

echo "Static files copy process complete"