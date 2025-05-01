// prebuild.js - ES Module version
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This script copies all files from the root public directory to the client/public directory
// to ensure they are included in the Vite build process

const rootPublicDir = path.resolve(__dirname, '../public');
const clientPublicDir = path.resolve(__dirname, '../client/public');

// Ensure client/public directory exists
fs.ensureDirSync(clientPublicDir);

// Copy all files from root public to client public
console.log(`Copying public files from ${rootPublicDir} to ${clientPublicDir}...`);
fs.copySync(rootPublicDir, clientPublicDir, {
  overwrite: true,
  errorOnExist: false,
});

console.log('Public files successfully copied.');