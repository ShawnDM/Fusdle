/**
 * Update Puzzle Timestamps
 * 
 * This script updates all puzzles in the Firestore database 
 * to use midnight (00:00:00) timestamps instead of 4 AM (04:00:00)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, updateDoc, query } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

// Convert date string with 4 AM to midnight
function convertToMidnight(dateStr: string): string {
  // If the date has T04:00:00, replace with T00:00:00
  return dateStr.replace('T04:00:00', 'T00:00:00');
}

async function updatePuzzleTimestamps() {
  console.log('Starting to update puzzle timestamps from 4 AM to midnight...');
  
  try {
    // Get all puzzles
    const puzzlesSnapshot = await getDocs(query(puzzlesCollection));
    
    if (puzzlesSnapshot.empty) {
      console.log('No puzzles found in database');
      return;
    }
    
    console.log(`Found ${puzzlesSnapshot.size} puzzles to update`);
    
    // Track updates
    let updatedCount = 0;
    let promises = [];
    
    // Process each puzzle
    for (const document of puzzlesSnapshot.docs) {
      const puzzle = document.data();
      
      // Convert Firestore Timestamp to string if needed
      let dateStr = puzzle.date;
      if (puzzle.date && typeof puzzle.date.toDate === 'function') {
        dateStr = puzzle.date.toDate().toISOString();
      }
      
      // Check if the puzzle has a date field with 4 AM
      if (dateStr && dateStr.includes('T04:00:00')) {
        const newDate = convertToMidnight(dateStr);
        console.log(`Updating puzzle #${puzzle.puzzleNumber}: ${dateStr} → ${newDate}`);
        
        // Update the document (using a new Date object)
        promises.push(updateDoc(doc(puzzlesCollection, document.id), { 
          date: new Date(newDate) 
        }));
        updatedCount++;
        
        // Process in batches of 20 to avoid overwhelming the database
        if (promises.length >= 20) {
          await Promise.all(promises);
          console.log(`Processed batch of ${promises.length} updates`);
          promises = [];
        }
      }
    }
    
    // Process any remaining updates
    if (promises.length > 0) {
      await Promise.all(promises);
      console.log(`Processed final batch of ${promises.length} updates`);
    }
    
    console.log(`Successfully updated ${updatedCount} puzzles to use midnight timestamps`);
    
  } catch (error) {
    console.error('Error updating puzzle timestamps:', error);
    throw error;
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