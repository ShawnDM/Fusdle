/**
 * Fusdle Puzzle Automation
 * This script is designed to be run every 90 days to generate new puzzles.
 * It automatically detects the last puzzle date and generates 90 more days from there.
 */

import { addDays, format, parse, isAfter } from 'date-fns';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const puzzlesCollection = collection(db, 'puzzles');

// Check if it's time to generate new puzzles
async function checkAndGeneratePuzzles() {
  try {
    console.log('Checking if new puzzles need to be generated...');
    
    // Get the most recent puzzle date from Firestore
    const latestPuzzlesQuery = query(
      puzzlesCollection,
      orderBy('date', 'desc'),
      limit(1)
    );
    
    const latestPuzzlesSnapshot = await getDocs(latestPuzzlesQuery);
    
    if (latestPuzzlesSnapshot.empty) {
      console.log('No existing puzzles found. You should run the initial puzzle generation script first.');
      return;
    }
    
    // Get the most recent puzzle date
    const latestPuzzle = latestPuzzlesSnapshot.docs[0].data();
    const latestDate = latestPuzzle.date.toDate();
    
    console.log(`Latest puzzle date: ${format(latestDate, 'yyyy-MM-dd')}`);
    
    // Calculate days remaining
    const today = new Date();
    const daysRemaining = Math.floor((latestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`Days remaining with existing puzzles: ${daysRemaining}`);
    
    // If less than 14 days of puzzles remain, generate new puzzles
    if (daysRemaining < 14) {
      console.log('Less than 14 days of puzzles remaining. Generating new puzzles...');
      
      // Create a temporary config file to store the new start date
      const newStartDate = addDays(latestDate, 1); // Start one day after the last puzzle
      const configPath = path.join(__dirname, 'temp-puzzle-config.json');
      
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          startDate: newStartDate.toISOString(),
          daysToGenerate: 90
        })
      );
      
      // Run the puzzle generation script
      await runPuzzleGenerator(newStartDate);
      
      // Clean up the temporary config file
      fs.unlinkSync(configPath);
      
      console.log('Puzzle generation completed successfully!');
      console.log(`Next generation should be scheduled for around: ${format(addDays(newStartDate, 76), 'yyyy-MM-dd')} (14 days before puzzles run out)`);
    } else {
      console.log(`No need to generate puzzles yet. Check again in ${daysRemaining - 14} days.`);
    }
  } catch (error) {
    console.error('Error checking or generating puzzles:', error);
  }
}

// Function to run the puzzle generator script with the new start date
async function runPuzzleGenerator(startDate: Date) {
  try {
    // Modify the environment variable for the start date
    process.env.FUSDLE_START_DATE = startDate.toISOString();
    
    // Run the puzzle generator script
    console.log(`Running puzzle generator starting from ${format(startDate, 'yyyy-MM-dd')}...`);
    
    // Create arguments for the generator script
    const scriptPath = path.join(__dirname, 'generate-90-day-puzzles.ts');
    const command = `npx tsx ${scriptPath} --startDate=${startDate.toISOString()} --days=90`;
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.error('Error output from generator:', stderr);
    }
    
    console.log(stdout);
    return true;
  } catch (error) {
    console.error('Failed to run puzzle generator:', error);
    return false;
  }
}

// Function to check if this script is being run as a cron job
function isRunningAsCronJob() {
  // This is a simple heuristic and may need to be adjusted
  return process.env.CRON_JOB === 'true';
}

// Function to create a cron job entry on the system
async function setupCronJob() {
  try {
    const scriptPath = path.resolve(__dirname, 'automate-puzzle-generation.ts');
    
    // Create a shell script wrapper
    const wrapperPath = path.join(__dirname, 'run-puzzle-automation.sh');
    fs.writeFileSync(
      wrapperPath,
      `#!/bin/bash
cd ${path.dirname(__dirname)}
export CRON_JOB=true
npx tsx ${scriptPath}
`,
      { mode: 0o755 } // Make executable
    );
    
    console.log(`Created wrapper script at ${wrapperPath}`);
    
    // Check if the cron job already exists
    const { stdout } = await execAsync('crontab -l || echo ""');
    
    if (stdout.includes(wrapperPath)) {
      console.log('Cron job already exists.');
      return;
    }
    
    // Schedule to run weekly (to check if new puzzles are needed)
    const cronEntry = `0 0 * * 0 ${wrapperPath} >> ${path.join(__dirname, 'puzzle-automation.log')} 2>&1`;
    
    // Add the cron job
    await execAsync(`(crontab -l 2>/dev/null || echo "") | echo "${cronEntry}" | crontab -`);
    
    console.log('Cron job set up successfully. Will run weekly to check if new puzzles are needed.');
  } catch (error) {
    console.error('Failed to set up cron job:', error);
    console.log('You may need to set up the scheduled task manually on your system.');
  }
}

// Main function
async function main() {
  try {
    // Check if we should set up a cron job
    const args = process.argv.slice(2);
    if (args.includes('--setup-cron') || args.includes('-c')) {
      await setupCronJob();
      return;
    }
    
    // Check and generate puzzles if needed
    await checkAndGeneratePuzzles();
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the script
if (!isRunningAsCronJob() || process.argv.includes('--force')) {
  console.log('Running Fusdle Puzzle Automation...');
  main();
} else {
  // When running as a cron job, log to a file
  const logPath = path.join(__dirname, 'puzzle-automation.log');
  console.log(`Running as cron job at ${new Date().toISOString()}`);
  main();
}