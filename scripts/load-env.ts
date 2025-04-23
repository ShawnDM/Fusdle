import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

// Load environment variables from .env file if present
config({ path: resolve(__dirname, '../.env') });

/**
 * This script creates a .env file with the necessary Firebase environment variables
 * to run other scripts that need access to Firebase.
 */
async function createEnvFile() {
  try {
    // Define the Firebase environment variables
    const envContent = `
VITE_FIREBASE_API_KEY=${process.env.VITE_FIREBASE_API_KEY || ''}
VITE_FIREBASE_PROJECT_ID=${process.env.VITE_FIREBASE_PROJECT_ID || ''}
VITE_FIREBASE_APP_ID=${process.env.VITE_FIREBASE_APP_ID || ''}
`;

    // Write to .env file
    fs.writeFileSync(resolve(__dirname, '../.env'), envContent.trim());
    console.log('.env file created successfully with Firebase configuration.');
  } catch (error) {
    console.error('Error creating .env file:', error);
  }
}

// Run the script
createEnvFile();