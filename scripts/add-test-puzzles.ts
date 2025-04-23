import './load-firebase-env'; // Load environment variables first
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

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
const puzzlesCollection = collection(db, 'puzzles');

// Helper function to convert date string to Firestore timestamp at midnight EST
const dateToTimestamp = (dateStr: string): Timestamp => {
  // Create date at midnight EST
  const date = new Date(dateStr);
  date.setUTCHours(4, 0, 0, 0); // Midnight EST is 4 AM UTC
  return Timestamp.fromDate(date);
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  // Get current date in EST timezone
  const options = { timeZone: 'America/New_York' };
  const today = new Date().toLocaleDateString('en-US', options);
  // Convert MM/DD/YYYY to YYYY-MM-DD
  const parts = today.split('/');
  return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
};

// Add test puzzles to Firebase
async function addTestPuzzles() {
  try {
    console.log('Adding test puzzles to Firebase...');
    const today = getTodayDate();
    
    // Add a normal difficulty puzzle for today
    const normalPuzzle = {
      puzzleNumber: 1,
      date: dateToTimestamp(today),
      emojis: ['🧠', '⛈️'],
      answer: 'Brain Storm',
      hints: ['Think together', 'Mental weather', 'Idea generation'],
      difficulty: 'normal',
      isFusionTwist: 0,
      twistType: null
    };
    
    // Add a hard difficulty puzzle for today
    const hardPuzzle = {
      puzzleNumber: 1,
      date: dateToTimestamp(today),
      emojis: ['🌪️', '😴', '🧿'],
      answer: 'Dream Catcher',
      hints: ['Sleep guardian', 'Nightmare filter', 'Bedside hanger'],
      difficulty: 'hard',
      isFusionTwist: 0,
      twistType: null
    };
    
    // Add a fusion puzzle for testing
    const fusionPuzzle = {
      puzzleNumber: 300,
      date: dateToTimestamp('2025-05-01'),
      emojis: ['🐯', '🦁', '❄️'],
      answer: 'Lion Tiger',
      hints: ['Hybrid cat', 'Mixed predator', 'Big feline blend'],
      difficulty: 'normal',
      isFusionTwist: 1,
      twistType: 'Animal Fusion'
    };
    
    // Add another fusion puzzle with different twist type
    const fusionPuzzle2 = {
      puzzleNumber: 301,
      date: dateToTimestamp('2025-05-02'),
      emojis: ['🍫', '🥜', '🧈'],
      answer: 'Peanut Butter Cup',
      hints: ['Sweet nutty treat', 'Chocolate disk', 'Reese\'s product'],
      difficulty: 'normal',
      isFusionTwist: 1,
      twistType: 'Food Fusion'
    };
    
    // Add the puzzles to Firestore
    await addDoc(puzzlesCollection, normalPuzzle);
    console.log('Added normal puzzle for today');
    
    await addDoc(puzzlesCollection, hardPuzzle);
    console.log('Added hard puzzle for today');
    
    await addDoc(puzzlesCollection, fusionPuzzle);
    console.log('Added fusion puzzle #300');
    
    await addDoc(puzzlesCollection, fusionPuzzle2);
    console.log('Added fusion puzzle #301');
    
    console.log('Successfully added all test puzzles!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding test puzzles:', error);
    process.exit(1);
  }
}

// Run the function
addTestPuzzles();