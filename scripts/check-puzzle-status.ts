/**
 * Fusdle Puzzle Status Checker
 * This script checks the current status of puzzles in the database
 */

import { format, compareAsc, differenceInDays } from 'date-fns';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, where } from 'firebase/firestore';
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

async function checkPuzzleStatus() {
  try {
    console.log('Checking puzzle database status...');
    
    // Get all puzzles
    const puzzlesSnapshot = await getDocs(query(puzzlesCollection));
    const totalPuzzles = puzzlesSnapshot.size;
    
    console.log(`Total puzzles in database: ${totalPuzzles}`);
    
    // Group puzzles by difficulty
    const difficultyCount = {};
    const typeCounts = { fusion: 0, normal: 0 };
    
    // Track puzzle dates
    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;
    
    // Track puzzles by date and month
    const puzzlesByDate = {};
    const puzzlesByMonth = {};
    
    puzzlesSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Count by difficulty
      if (data.difficulty) {
        difficultyCount[data.difficulty] = (difficultyCount[data.difficulty] || 0) + 1;
      }
      
      // Count fusion vs normal
      if (data.isFusionTwist && data.isFusionTwist > 0) {
        typeCounts.fusion++;
      } else {
        typeCounts.normal++;
      }
      
      // Track dates
      if (data.date) {
        const date = data.date.toDate ? data.date.toDate() : new Date(data.date);
        const dateStr = format(date, 'yyyy-MM-dd');
        const monthStr = format(date, 'yyyy-MM');
        
        // Update earliest and latest dates
        if (!earliestDate || compareAsc(date, earliestDate) < 0) {
          earliestDate = date;
        }
        
        if (!latestDate || compareAsc(date, latestDate) > 0) {
          latestDate = date;
        }
        
        // Group puzzles by date
        if (!puzzlesByDate[dateStr]) {
          puzzlesByDate[dateStr] = {
            normal: false,
            hard: false,
            fusion: false,
            count: 0
          };
        }
        
        // Group puzzles by month
        if (!puzzlesByMonth[monthStr]) {
          puzzlesByMonth[monthStr] = {
            normal: 0,
            hard: 0,
            fusion: 0,
            total: 0,
            days: new Set()
          };
        }
        
        puzzlesByDate[dateStr].count++;
        puzzlesByMonth[monthStr].total++;
        puzzlesByMonth[monthStr].days.add(dateStr);
        
        if (data.difficulty === 'normal') {
          puzzlesByDate[dateStr].normal = true;
          puzzlesByMonth[monthStr].normal++;
        } else if (data.difficulty === 'hard') {
          puzzlesByDate[dateStr].hard = true;
          puzzlesByMonth[monthStr].hard++;
          
          if (data.isFusionTwist && data.isFusionTwist > 0) {
            puzzlesByDate[dateStr].fusion = true;
            puzzlesByMonth[monthStr].fusion++;
          }
        }
      }
    });
    
    console.log('Puzzles by difficulty:', difficultyCount);
    console.log('Normal vs. Fusion puzzles:', typeCounts);
    
    if (earliestDate && latestDate) {
      console.log(`Date range: ${format(earliestDate, 'yyyy-MM-dd')} to ${format(latestDate, 'yyyy-MM-dd')}`);
      
      const totalDays = differenceInDays(latestDate, earliestDate) + 1;
      console.log(`Total days covered: ${totalDays} days`);
      
      // Check complete days (with both normal and hard puzzles)
      let completeDays = 0;
      let fusionDays = 0;
      let incompleteDays = 0;
      
      for (const dateStr in puzzlesByDate) {
        const dayInfo = puzzlesByDate[dateStr];
        
        if (dayInfo.normal && dayInfo.hard) {
          completeDays++;
          
          if (dayInfo.fusion) {
            fusionDays++;
          }
        } else {
          incompleteDays++;
          console.log(`Incomplete day found: ${dateStr} - missing ${!dayInfo.normal ? 'normal' : 'hard'} puzzle`);
        }
      }
      
      console.log(`Days with complete puzzles (normal+hard): ${completeDays}`);
      console.log(`Days with fusion puzzles: ${fusionDays}`);
      
      if (incompleteDays > 0) {
        console.log(`Incomplete days: ${incompleteDays}`);
      } else {
        console.log('All days have complete puzzles (both normal and hard)!');
      }
      
      // Check fusion pattern - should be 2 per week
      const totalWeeks = Math.ceil(totalDays / 7);
      const expectedFusionDays = totalWeeks * 2;
      
      console.log(`Total weeks covered: ${totalWeeks}`);
      console.log(`Expected fusion days (2 per week): ${expectedFusionDays}`);
      console.log(`Actual fusion days: ${fusionDays}`);
      
      if (fusionDays < expectedFusionDays) {
        console.log(`Missing fusion days: ${expectedFusionDays - fusionDays}`);
      } else if (fusionDays > expectedFusionDays) {
        console.log(`Extra fusion days: ${fusionDays - expectedFusionDays}`);
      } else {
        console.log('Fusion day pattern is correct! (2 per week)');
      }
      
      // Display month-by-month summary
      console.log('\nMonth-by-month puzzle coverage:');
      const sortedMonths = Object.keys(puzzlesByMonth).sort();
      for (const month of sortedMonths) {
        const monthData = puzzlesByMonth[month];
        console.log(`\n${month}:`);
        console.log(`  Total puzzles: ${monthData.total}`);
        console.log(`  Normal puzzles: ${monthData.normal}`);
        console.log(`  Hard puzzles: ${monthData.hard} (includes ${monthData.fusion} fusion puzzles)`);
        console.log(`  Days covered: ${monthData.days.size}`);
        
        // Check for complete month coverage
        const complete = monthData.normal === monthData.days.size && monthData.hard === monthData.days.size;
        if (complete) {
          console.log('  ✅ Month has complete normal and hard puzzles for every day');
        } else {
          console.log('  ❌ Month has incomplete puzzle coverage');
        }
      }
    }
    
    // Show earliest and latest puzzles as samples
    const puzzleSamples = [];
    
    // Get earliest and latest puzzles
    if (earliestDate && latestDate) {
      const earliestStr = format(earliestDate, 'yyyy-MM-dd');
      const latestStr = format(latestDate, 'yyyy-MM-dd');
      
      // Find samples from the earliest and latest dates
      puzzlesSnapshot.forEach(doc => {
        if (puzzleSamples.length < 4) {  // Get a max of 4 samples
          const data = doc.data();
          const puzzleDate = data.date.toDate ? format(data.date.toDate(), 'yyyy-MM-dd') : '';
          
          // Add earliest and latest date puzzles as samples
          if (puzzleDate === earliestStr || puzzleDate === latestStr) {
            puzzleSamples.push({
              id: doc.id,
              puzzleNumber: data.puzzleNumber,
              difficulty: data.difficulty,
              emojis: data.emojis,
              answer: data.answer,
              date: puzzleDate,
              isFusionTwist: data.isFusionTwist || 0,
              twistType: data.twistType || null
            });
          }
        }
      });
    }
    
    if (puzzleSamples.length > 0) {
      console.log('Sample puzzles:', JSON.stringify(puzzleSamples, null, 2));
    }
  } catch (error) {
    console.error('Error checking puzzle status:', error);
  }
}

checkPuzzleStatus();