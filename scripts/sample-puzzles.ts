// Import Firebase directly instead of using the client service
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";

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

// Sample puzzles for testing
const samplePuzzles = [
  {
    puzzleNumber: 1,
    date: '2025-04-21', // Today
    emojis: ['🏡', '🧹'],
    answer: 'Housekeeping',
    hints: [
      'A service that maintains cleanliness',
      'Found in hotels and private homes',
      'Combines where you live with what you do to maintain it'
    ]
  },
  {
    puzzleNumber: 2,
    date: '2025-04-22', // Tomorrow
    emojis: ['🍎', '📖'],
    answer: 'Education',
    hints: [
      'A process of acquiring knowledge',
      'Often associated with schools',
      'Learning and growth are central to this concept'
    ]
  },
  {
    puzzleNumber: 3,
    date: '2025-04-23', // Day after tomorrow
    emojis: ['💰', '🏦'],
    answer: 'Banking',
    hints: [
      'A service involving money',
      'Institutions that handle financial transactions',
      'Savings and loans are key services'
    ]
  },
  {
    puzzleNumber: 4,
    date: '2025-04-20', // Yesterday
    emojis: ['🚗', '🛣️'],
    answer: 'Roadtrip',
    hints: [
      'A journey taken by automobile',
      'Often for leisure or vacation',
      'Travel along highways or scenic routes'
    ]
  },
  {
    puzzleNumber: 5,
    date: '2025-04-19', // 2 days ago
    emojis: ['☕', '💻'],
    answer: 'Remote work',
    hints: [
      'Working outside of a traditional office',
      'Often done from home or cafes',
      'Made more popular during the pandemic'
    ]
  }
];

/**
 * This script creates sample puzzles in Firebase Firestore for testing
 * To run: npx tsx scripts/sample-puzzles.ts
 */
// Helper function to convert date string to Firestore timestamp
const dateToTimestamp = (dateStr: string): Timestamp => {
  return Timestamp.fromDate(new Date(dateStr));
};

async function createSamplePuzzles() {
  console.log('Creating sample puzzles in Firebase Firestore...');

  try {
    // Create each puzzle directly in Firestore
    for (const puzzle of samplePuzzles) {
      console.log(`Adding puzzle: ${puzzle.puzzleNumber} - ${puzzle.answer} (${puzzle.date})`);
      
      // Add the document to Firestore
      await addDoc(puzzlesCollection, {
        ...puzzle,
        date: dateToTimestamp(puzzle.date) // Convert date string to Firestore timestamp
      });
    }

    console.log('Sample puzzles created successfully!');
  } catch (error) {
    console.error('Error creating sample puzzles:', error);
  }
}

// Run the creation
createSamplePuzzles();