import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
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

// Helper for timestamp conversion
const dateToTimestamp = (dateStr: string): Timestamp => {
  const date = new Date(dateStr);
  return Timestamp.fromDate(date);
};

// Sample puzzles
const samplePuzzles = [
  {
    puzzleNumber: 1,
    date: dateToTimestamp('2025-04-21'),
    emojis: ['🧠', '⚡'],
    answer: 'brainstorm',
    hints: ['Think of ideas', 'Mental activity', 'Creative session']
  },
  {
    puzzleNumber: 2,
    date: dateToTimestamp('2025-04-22'),
    emojis: ['🌊', '🏠'],
    answer: 'houseboat',
    hints: ['Floating dwelling', 'Home on water', 'Aquatic residence']
  },
  {
    puzzleNumber: 3,
    date: dateToTimestamp('2025-04-23'),
    emojis: ['🔥', '🦊'],
    answer: 'firefox',
    hints: ['Web browser', 'Internet explorer alternative', 'Mozilla product']
  },
  {
    puzzleNumber: 4,
    date: dateToTimestamp('2025-04-24'),
    emojis: ['☕', '⏰'],
    answer: 'morning',
    hints: ['Start of day', 'Before noon', 'Sunrise time']
  },
  {
    puzzleNumber: 5,
    date: dateToTimestamp('2025-04-25'),
    emojis: ['🍎', '👁️'],
    answer: 'apple',
    hints: ['Tech company', 'iPhone maker', 'Cupertino company']
  },
  {
    puzzleNumber: 6, 
    date: dateToTimestamp('2025-04-26'),
    emojis: ['🌙', '🐺'],
    answer: 'werewolf',
    hints: ['Transforms at full moon', 'Mythical creature', 'Lycanthrope']
  },
  {
    puzzleNumber: 7,
    date: dateToTimestamp('2025-04-27'),
    emojis: ['🌞', '🕶️'],
    answer: 'sunglasses',
    hints: ['Eye protection', 'Beach accessory', 'UV blocker']
  }
];

// Function to add puzzles to Firestore
async function populateFirestore() {
  try {
    console.log('Starting to add sample puzzles to Firebase...');
    
    const puzzlesCollection = collection(db, 'puzzles');
    
    for (const puzzle of samplePuzzles) {
      const docRef = await addDoc(puzzlesCollection, puzzle);
      console.log(`Added puzzle: ${puzzle.answer} with ID: ${docRef.id}`);
    }
    
    console.log('Successfully added all sample puzzles to Firebase!');
  } catch (error) {
    console.error('Error adding puzzles to Firebase:', error);
  }
}

// Execute the function
populateFirestore();