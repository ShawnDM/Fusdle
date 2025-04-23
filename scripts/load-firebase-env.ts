import * as fs from 'fs';

/**
 * This script creates a temporary .env file with the Firebase environment variables
 * needed for the firebase-related scripts to work properly.
 */
async function createEnvFile() {
  const envVariables = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  // Check if all required variables are present
  const missingVars = envVariables.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(`Error: Missing environment variables: ${missingVars.join(', ')}`);
    console.error('Please make sure these variables are set in your environment or .env file');
    process.exit(1);
  }

  // Create .env content
  const envContent = envVariables.map(varName => `${varName}=${process.env[varName]}`).join('\n');

  // Write to .env file
  try {
    fs.writeFileSync('.env', envContent);
    console.log('Created .env file with Firebase variables');
  } catch (error) {
    console.error('Error writing .env file:', error);
    process.exit(1);
  }
}

// Run the script
createEnvFile()
  .then(() => console.log('Firebase environment setup complete!'))
  .catch(err => console.error('Error setting up Firebase environment:', err));