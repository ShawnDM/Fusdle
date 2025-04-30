#!/bin/bash

# Build the application
npm run build

# Create the dist directory if it doesn't exist
mkdir -p dist/public

# Copy important static files directly to ensure they're available
cp public/favicon.ico dist/public/
cp public/preview.png dist/public/
cp public/sitemap.xml dist/public/
cp public/robots.txt dist/public/

echo "Static files copied to dist/public directory"