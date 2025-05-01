#!/bin/bash
# Script to manually deploy to Vercel
# This bypasses GitHub integration issues

set -e
echo "🚀 Preparing to deploy Fusdle to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "⚠️ Vercel CLI is not installed. Installing now..."
  npm install -g vercel
fi

# Check for required environment variables
if [ -z "$VITE_FIREBASE_API_KEY" ] || [ -z "$VITE_FIREBASE_APP_ID" ] || [ -z "$VITE_FIREBASE_PROJECT_ID" ]; then
  echo "⚠️ Warning: One or more Firebase environment variables are missing."
  echo "Deployment will continue, but the app may not function correctly."
fi

# Create a temporary .env file for Vercel deployment
echo "📝 Creating temporary .env file for deployment..."
cat > .vercel.env << EOL
VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
EOL

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."
# Ensure all API routes are properly structured
if [ ! -f "api/index.js" ]; then
  echo "❌ Error: api/index.js is missing. Deployment aborted."
  exit 1
fi

# Copy static files to ensure they're included in the deployment
echo "📦 Preparing static assets..."
mkdir -p public
touch public/robots.txt
touch public/sitemap.xml
# Ensure favicon exists
if [ ! -f "public/favicon.ico" ]; then
  echo "🌐 Creating default favicon..."
  # Use a simple 1x1 transparent GIF as a placeholder
  echo -n "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" | base64 -d > public/favicon.ico
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

# Clean up
echo "🧹 Cleaning up..."
rm -f .vercel.env

echo "✅ Deployment process completed!"