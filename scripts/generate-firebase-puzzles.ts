import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { generatePuzzles } from '../server/puzzle-generator-ordered';
import { InsertPuzzle } from '@shared/schema';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Convert a date string to a Firestore Timestamp
const dateToTimestamp = (dateStr: string): Timestamp => {
  const date = new Date(dateStr);
  // Set time to midnight EST (4:00 UTC)
  date.setUTCHours(4, 0, 0, 0);
  return Timestamp.fromDate(date);
};

// Generate dates starting from tomorrow
function generateFutureDates(count: number): string[] {
  const dates: string[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1); // Start from tomorrow
  
  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

// Main function to generate and upload puzzles
async function generatePuzzleTiers() {
  console.log('Generating ordered puzzles for Firebase...');
  
  try {
    // Generate normal tier puzzles with ordered emojis
    const normalPuzzles = generatePuzzles(40);
    console.log(`Generated ${normalPuzzles.length} normal puzzles with ordered emojis`);
    
    // Create hard tier puzzles (same answers but fewer guesses)
    const hardPuzzles = normalPuzzles.map(puzzle => ({
      ...puzzle,
      difficulty: 'hard',
    }));
    
    // Create fusion twist puzzles (special puzzles appearing twice weekly)
    // In this case, we'll mark puzzles 3 and 7 of each week as fusion puzzles
    normalPuzzles.forEach((puzzle, index) => {
      if ((index % 7 === 2) || (index % 7 === 6)) { // 3rd and 7th day of each week
        puzzle.isFusionTwist = 1;
        puzzle.twistType = 'wordplay';
        
        // Also mark the corresponding hard puzzle
        hardPuzzles[index].isFusionTwist = 1;
        hardPuzzles[index].twistType = 'wordplay';
      }
    });
    
    // Combine all puzzles
    const allPuzzles = [...normalPuzzles, ...hardPuzzles];
    
    // Upload to Firestore
    for (const puzzle of allPuzzles) {
      const puzzleData = {
        ...puzzle,
        date: dateToTimestamp(puzzle.date),
      };
      
      await addDoc(collection(db, 'puzzles'), puzzleData);
      console.log(`Added puzzle #${puzzle.puzzleNumber} (${puzzle.difficulty}): ${puzzle.answer}`);
    }
    
    console.log(`Successfully added ${allPuzzles.length} puzzles to Firestore`);
  } catch (error) {
    console.error('Error uploading puzzles:', error);
  }
}

// Run the script
generatePuzzleTiers()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Error:', err));