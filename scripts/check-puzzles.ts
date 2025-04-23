import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

async function checkPuzzles() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const puzzlesCollection = collection(db, 'puzzles');
    
    const puzzlesSnapshot = await getDocs(puzzlesCollection);
    console.log(`Total puzzles in database: ${puzzlesSnapshot.size}`);
    
    // Group puzzles by difficulty
    const difficultyCount = {};
    const typeCounts = { fusion: 0, normal: 0 };
    
    puzzlesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.difficulty) {
        difficultyCount[data.difficulty] = (difficultyCount[data.difficulty] || 0) + 1;
      }
      
      if (data.isFusionTwist && data.isFusionTwist > 0) {
        typeCounts.fusion++;
      } else {
        typeCounts.normal++;
      }
    });
    
    console.log('Puzzles by difficulty:', difficultyCount);
    console.log('Normal vs. Fusion puzzles:', typeCounts);
    
    // Check for normal and hard puzzle on the same day
    const puzzlesByDate = {};
    puzzlesSnapshot.forEach(doc => {
      const data = doc.data();
      const date = data.date.toDate ? data.date.toDate().toISOString().split('T')[0] : 'unknown';
      
      if (!puzzlesByDate[date]) {
        puzzlesByDate[date] = {};
      }
      
      puzzlesByDate[date][data.difficulty] = true;
    });
    
    // Count dates with both normal and hard puzzles
    let completePuzzleDays = 0;
    Object.keys(puzzlesByDate).forEach(date => {
      if (puzzlesByDate[date].normal && puzzlesByDate[date].hard) {
        completePuzzleDays++;
      }
    });
    
    console.log(`Days with both normal and hard puzzles: ${completePuzzleDays}`);
    
    // Show some sample puzzle data
    if (puzzlesSnapshot.size > 0) {
      const samplePuzzles = [];
      let count = 0;
      puzzlesSnapshot.forEach(doc => {
        if (count < 3) {
          const data = doc.data();
          samplePuzzles.push({
            id: doc.id,
            puzzleNumber: data.puzzleNumber,
            difficulty: data.difficulty,
            emojis: data.emojis,
            date: data.date.toDate ? data.date.toDate().toISOString() : 'unknown',
            isFusionTwist: data.isFusionTwist || 0
          });
          count++;
        }
      });
      
      console.log('Sample puzzles:', JSON.stringify(samplePuzzles, null, 2));
    }
  } catch (error) {
    console.error('Error checking puzzles:', error);
  }
}

checkPuzzles();