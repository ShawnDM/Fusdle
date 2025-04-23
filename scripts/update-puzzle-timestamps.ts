/**
 * Update Puzzle Timestamps
 * 
 * This script updates all puzzles in the Firestore database 
 * to use midnight (00:00:00) timestamps instead of 4 AM (04:00:00)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
try {
  const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
  initializeApp({
    credential: cert(serviceAccount)
  });
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

const db = getFirestore();
const puzzlesCollection = db.collection('puzzles');

// Convert date string with 4 AM to midnight
function convertToMidnight(dateStr: string): string {
  // If the date has T04:00:00, replace with T00:00:00
  return dateStr.replace('T04:00:00', 'T00:00:00');
}

async function updatePuzzleTimestamps() {
  console.log('Starting to update puzzle timestamps from 4 AM to midnight...');
  
  try {
    // Get all puzzles
    const puzzlesSnapshot = await puzzlesCollection.get();
    
    if (puzzlesSnapshot.empty) {
      console.log('No puzzles found in database');
      return;
    }
    
    console.log(`Found ${puzzlesSnapshot.size} puzzles to update`);
    
    // Prepare batch updates to minimize API calls
    let batch = db.batch();
    let counter = 0;
    let updatedCount = 0;
    
    // Process each puzzle
    for (const doc of puzzlesSnapshot.docs) {
      const puzzle = doc.data();
      
      // Check if the puzzle has a date field with 4 AM
      if (puzzle.date && puzzle.date.includes('T04:00:00')) {
        const newDate = convertToMidnight(puzzle.date);
        console.log(`Updating puzzle #${puzzle.puzzleNumber}: ${puzzle.date} → ${newDate}`);
        
        // Update the document
        batch.update(doc.ref, { date: newDate });
        updatedCount++;
        
        // Firestore batches are limited to 500 operations
        if (++counter >= 450) {
          await batch.commit();
          console.log(`Committed batch of ${counter} updates`);
          batch = db.batch();
          counter = 0;
        }
      }
    }
    
    // Commit any remaining updates
    if (counter > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${counter} updates`);
    }
    
    console.log(`Successfully updated ${updatedCount} puzzles to use midnight timestamps`);
    
  } catch (error) {
    console.error('Error updating puzzle timestamps:', error);
  }
}

// Run the update function
updatePuzzleTimestamps()
  .then(() => {
    console.log('Timestamp update process completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error in update process:', err);
    process.exit(1);
  });