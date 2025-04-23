# Deploying Fusdle on Vercel

This document provides guidance on deploying the Fusdle application on Vercel.

## Prerequisites

Before deploying, ensure you have:

1. A Vercel account
2. Access to your Firebase project

## Deployment Steps

1. **Connect to GitHub Repository**
   - Push your code to GitHub
   - Import the repository in Vercel dashboard

2. **Configure Environment Variables**
   - In the Vercel dashboard, navigate to your project settings
   - Add the following environment variables:

   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```

3. **Deploy Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Firebase Configuration**
   - Ensure your Firebase project has authentication set up
   - Add your Vercel deployment URL to the authorized domains in Firebase Authentication settings

## Troubleshooting

If you encounter the 404 NOT_FOUND error:

1. Check that all environment variables are correctly set in the Vercel dashboard
2. Verify the Firebase authorized domains include your Vercel deployment URL
3. Make sure your Firebase database rules allow access from your Vercel deployment

If you encounter a file conflict error during deployment:

1. Ensure there are no duplicate files with different extensions (e.g., `api/index.js` and `api/index.ts`)
2. Check that all imports and file references use the correct file extensions
3. Remove any empty directories that might cause confusion in routing

If you encounter build errors related to esbuild or server files:

1. Verify that the `buildCommand` in vercel.json is set to `"vite build"` instead of `"npm run build"`
2. Ensure the `outputDirectory` in vercel.json is set to `"dist/public"` to match Vite's output
3. Do not include server-side TypeScript files in the build process for Vercel deployments

## Important Notes

- The API will automatically work on Vercel thanks to our serverless function configuration
- Requests made from the client application will be properly routed to API endpoints
- All Firebase connections should work as long as environment variables are correctly set