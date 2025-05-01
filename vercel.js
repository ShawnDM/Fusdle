// vercel.js
// This is a customized build script that will be used by Vercel during the build process

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // Run the prebuild script to copy public files
  console.log('Running prebuild script to copy public files...');
  const prebuild = spawnSync('node', ['scripts/prebuild.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  if (prebuild.error) {
    console.error('Error running prebuild script:', prebuild.error);
    process.exit(1);
  }
  
  // Run vite build
  console.log('Building client with Vite...');
  const build = spawnSync('vite', ['build'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  if (build.error) {
    console.error('Error building client:', build.error);
    process.exit(1);
  }
  
  // Build the server
  console.log('Building server with esbuild...');
  const server = spawnSync('esbuild', [
    'server/index.ts',
    '--platform=node',
    '--packages=external',
    '--bundle',
    '--format=esm',
    '--outdir=dist'
  ], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  if (server.error) {
    console.error('Error building server:', server.error);
    process.exit(1);
  }
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Unexpected error during build:', error);
  process.exit(1);
}