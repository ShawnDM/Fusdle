import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import type { Puzzle, InsertPuzzle } from '@shared/schema';
import { getGlobalDateString } from '../lib/global-time';

// Collection references
const puzzlesCollection = collection(db, 'puzzles');

// Helper function to convert Firestore timestamp to ISO date string
const timestampToDate = (timestamp: Timestamp): string => {
  return timestamp.toDate().toISOString().split('T')[0];
};

// Helper function to convert date string to Firestore timestamp
const dateToTimestamp = (dateStr: string): Timestamp => {
  return Timestamp.fromDate(new Date(dateStr));
};

// Convert Firestore document to Puzzle
const puzzleFromFirestore = (doc: any): Puzzle => {
  try {
    const data = doc.data();
    if (!data) {
      console.error('Empty document data in puzzleFromFirestore');
      throw new Error('Empty document data');
    }
    
    console.log('Processing Firestore doc:', { 
      id: doc.id, 
      puzzleNumber: data.puzzleNumber,
      difficulty: data.difficulty || "normal"
    });
    
    // Handle date conversion safely
    let dateStr = '';
    if (data.date) {
      if (data.date instanceof Timestamp) {
        dateStr = timestampToDate(data.date);
      } else if (typeof data.date === 'string') {
        dateStr = data.date;
      } else {
        console.warn('Unknown date format:', data.date);
        dateStr = new Date().toISOString().split('T')[0]; // Fallback to today
      }
    } else {
      console.warn('Missing date in document:', doc.id);
      dateStr = new Date().toISOString().split('T')[0]; // Fallback to today
    }
    
    // Calculate wordCount if answer exists
    let wordCount: number | undefined = undefined;
    if (data.answer && typeof data.answer === 'string') {
      // Count non-empty words by splitting on whitespace
      const words = data.answer.trim().split(/\s+/);
      wordCount = words.length;
    }
    
    return {
      id: data.puzzleNumber || 0, // Use puzzleNumber as the ID
      puzzleNumber: data.puzzleNumber || 0,
      date: dateStr,
      difficulty: data.difficulty || "normal",
      emojis: data.emojis || [],
      answer: data.answer || "",
      hints: data.hints || [],
      isFusionTwist: data.isFusionTwist || 0,
      twistType: data.twistType || null,
      wordCount: wordCount
    };
  } catch (error) {
    console.error('Error in puzzleFromFirestore:', error, 'Document:', doc);
    // Return a default puzzle as fallback
    return {
      id: 0,
      puzzleNumber: 0,
      date: new Date().toISOString().split('T')[0],
      difficulty: "normal",
      emojis: ["⚠️"],
      answer: "Error Loading Puzzle",
      hints: ["Error loading puzzle data"],
      isFusionTwist: 0,
      twistType: null,
      wordCount: 3 // Default word count for error message
    };
  }
};

// Firestore Service Class
export class FirestoreService {
  // Get puzzle by date
  async getPuzzleByDate(dateStr: string): Promise<Puzzle | undefined> {
    const date = dateToTimestamp(dateStr);
    const q = query(puzzlesCollection, where('date', '==', date));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return undefined;
    }
    
    return puzzleFromFirestore(querySnapshot.docs[0]);
  }
  
  // Get fusion twist puzzle by ID
  async getFusionPuzzleById(id: string | number): Promise<Puzzle | undefined> {
    try {
      const puzzleNumber = typeof id === 'string' ? parseInt(id, 10) : id;
      console.log(`Looking for fusion puzzle with ID: ${puzzleNumber}`);
      
      // Get all puzzles
      const allPuzzlesQuery = query(puzzlesCollection);
      const allPuzzlesSnapshot = await getDocs(allPuzzlesQuery);
      
      if (allPuzzlesSnapshot.empty) {
        console.log('No puzzles found in database');
        return undefined;
      }
      
      // Convert to array of puzzles
      const allPuzzles = allPuzzlesSnapshot.docs.map(puzzleFromFirestore);
      
      // Find the fusion puzzle with the matching ID
      const fusionPuzzle = allPuzzles.find(p => 
        p.puzzleNumber === puzzleNumber && 
        p.isFusionTwist === 1
      );
      
      if (fusionPuzzle) {
        console.log(`Found fusion puzzle #${puzzleNumber} with type: ${fusionPuzzle.twistType}`);
        return fusionPuzzle;
      }
      
      // If no real fusion puzzle found, use any fusion puzzle as a fallback
      const anyFusionPuzzle = allPuzzles.find(p => p.isFusionTwist === 1);
      if (anyFusionPuzzle) {
        console.log(`Using fallback fusion puzzle #${anyFusionPuzzle.puzzleNumber} as ID ${puzzleNumber} wasn't found`);
        return {
          ...anyFusionPuzzle,
          id: puzzleNumber,
          puzzleNumber
        };
      }
      
      console.log(`No fusion puzzles found in database. Using a sample puzzle.`);
      
      // Sample fusion puzzle fallbacks based on twist type
      const fusionTypes = {
        'Animal Fusion': {
          emojis: ['🐯', '🦁', '❄️'],
          answer: 'Liger',
          hints: ['Hybrid feline', 'Mixed predator', 'Big cat blend']
        },
        'Food Fusion': {
          emojis: ['🍩', '🥯', '🧠'],
          answer: 'Cronut',
          hints: ['Pastry hybrid', 'Breakfast creation', 'Donut + croissant']
        },
        'Word Fusion': {
          emojis: ['☔', '👗', '🔆'],
          answer: 'Brunch',
          hints: ['Meal portmanteau', 'Mid-morning event', 'Breakfast + lunch']
        }
      };
      
      // Default fusion type
      const fusionType = 'Animal Fusion';
      const fusion = fusionTypes[fusionType];
      
      // Sample fusion puzzle as fallback
      return {
        id: puzzleNumber,
        puzzleNumber,
        date: new Date().toISOString().split('T')[0],
        difficulty: 'normal',
        emojis: fusion.emojis,
        answer: fusion.answer,
        hints: fusion.hints,
        isFusionTwist: 1,
        twistType: fusionType,
        wordCount: fusion.answer.split(/\s+/).length
      };
    } catch (error) {
      console.error(`Error fetching fusion puzzle with ID ${id}:`, error);
      throw error;
    }
  }

  // Get today's puzzle (optionally by difficulty) using global time
  async getTodaysPuzzle(difficulty: string = 'normal'): Promise<Puzzle | undefined> {
    try {
      // Get the current date from global time API
      // This prevents users from manipulating their device clock
      const todayStr = await getGlobalDateString();
      console.log(`Today's global date: ${todayStr}`);
      
      // Ensure difficulty is valid
      const effectiveDifficulty = ['normal', 'hard'].includes(difficulty) ? difficulty : 'normal';
      console.log(`Looking for ${effectiveDifficulty} difficulty puzzle`);
      
      // First get all puzzles and then filter
      const allPuzzlesQuery = query(puzzlesCollection);
      const allPuzzlesSnapshot = await getDocs(allPuzzlesQuery);
      
      if (allPuzzlesSnapshot.empty) {
        console.log('No puzzles found in database');
        return undefined;
      }
      
      // Convert to array of puzzles
      const allPuzzles = allPuzzlesSnapshot.docs.map(puzzleFromFirestore);
      console.log(`Found ${allPuzzles.length} puzzles total`);
      
      // Look for today's puzzle with the right difficulty
      const todayPuzzle = allPuzzles.find(p => 
        p.date === todayStr && 
        p.difficulty === effectiveDifficulty
      );
      
      if (todayPuzzle) {
        console.log(`Found today's puzzle with ID: ${todayPuzzle.id}`);
        return todayPuzzle;
      }
      
      console.log(`No puzzle found for today (${todayStr}) with ${effectiveDifficulty} difficulty`);
      
      // Fallback: get the earliest puzzle with the specified difficulty
      const puzzlesWithDifficulty = allPuzzles
        .filter(p => p.difficulty === effectiveDifficulty)
        .sort((a, b) => a.puzzleNumber - b.puzzleNumber);
      
      if (puzzlesWithDifficulty.length > 0) {
        const fallbackPuzzle = puzzlesWithDifficulty[0];
        console.log(`Using fallback puzzle with ID: ${fallbackPuzzle.id}`);
        return fallbackPuzzle;
      }
      
      console.log(`No puzzles found with ${effectiveDifficulty} difficulty`);
      return undefined;
    } catch (error) {
      console.error('Error fetching today\'s puzzle:', error);
      throw error;
    }
  }
  
  // Get puzzles by difficulty
  async getPuzzlesByDifficulty(difficulty: string, limitCount = 10): Promise<Puzzle[]> {
    try {
      console.log(`Getting puzzles with difficulty: ${difficulty}, limit: ${limitCount}`);
      
      // First get all puzzles
      const allPuzzlesQuery = query(puzzlesCollection);
      const allPuzzlesSnapshot = await getDocs(allPuzzlesQuery);
      
      if (allPuzzlesSnapshot.empty) {
        console.log('No puzzles found in database');
        return [];
      }
      
      // Convert to array of puzzles
      const allPuzzles = allPuzzlesSnapshot.docs.map(puzzleFromFirestore);
      console.log(`Found ${allPuzzles.length} total puzzles`);
      
      // Filter by difficulty and sort by date
      const filteredPuzzles = allPuzzles
        .filter(puzzle => puzzle.difficulty === difficulty)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limitCount);
      
      console.log(`Returning ${filteredPuzzles.length} puzzles with difficulty ${difficulty}`);
      return filteredPuzzles;
    } catch (error) {
      console.error(`Error fetching puzzles with difficulty ${difficulty}:`, error);
      throw error;
    }
  }

  // Get puzzle by ID (which is actually puzzleNumber)
  async getPuzzleById(id: string | number, difficulty: string = 'normal'): Promise<Puzzle | undefined> {
    try {
      const puzzleNumber = typeof id === 'string' ? parseInt(id, 10) : id;
      
      // Get the difficulty from the URL query parameter if provided
      const effectiveDifficulty = ['normal', 'hard'].includes(difficulty) ? difficulty : 'normal';
      
      console.log(`Fetching puzzle with ID: ${puzzleNumber}, difficulty: ${effectiveDifficulty}`);
      
      // First get all puzzles and then filter
      const allPuzzlesQuery = query(puzzlesCollection);
      const allPuzzlesSnapshot = await getDocs(allPuzzlesQuery);
      
      if (allPuzzlesSnapshot.empty) {
        console.log('No puzzles found in database');
        return undefined;
      }
      
      // Convert to array of puzzles
      const allPuzzles = allPuzzlesSnapshot.docs.map(puzzleFromFirestore);
      
      // Look for the puzzle with the specific ID and difficulty
      const targetPuzzle = allPuzzles.find(p => 
        p.puzzleNumber === puzzleNumber && 
        p.difficulty === effectiveDifficulty
      );
      
      if (targetPuzzle) {
        console.log(`Found puzzle with ID: ${targetPuzzle.id}, difficulty: ${targetPuzzle.difficulty}`);
        return targetPuzzle;
      }
      
      console.log(`No puzzle found with puzzleNumber: ${puzzleNumber} and difficulty: ${effectiveDifficulty}`);
      return undefined;
    } catch (error) {
      console.error(`Error fetching puzzle with ID ${id}:`, error);
      throw error;
    }
  }

  // Get puzzle archive (limited count)
  async getPuzzleArchive(limitCount = 30): Promise<Puzzle[]> {
    try {
      // Get current date at UTC 8:00 (4:00 AM UTC-4)
      const today = new Date();
      today.setUTCHours(8, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      console.log(`Getting archive puzzles, today is: ${todayStr}`);
      
      // Get all puzzles
      const allPuzzlesQuery = query(puzzlesCollection);
      const allPuzzlesSnapshot = await getDocs(allPuzzlesQuery);
      
      if (allPuzzlesSnapshot.empty) {
        console.log('No puzzles found in database');
        return [];
      }
      
      // Convert to array of puzzles
      const allPuzzles = allPuzzlesSnapshot.docs.map(puzzleFromFirestore);
      console.log(`Found ${allPuzzles.length} total puzzles`);
      
      // Filter puzzles before today and sort by date descending
      const pastPuzzles = allPuzzles
        .filter(puzzle => {
          // Make sure we're comparing dates properly
          const puzzleDate = new Date(puzzle.date);
          const todayDate = new Date(todayStr);
          return puzzleDate < todayDate;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limitCount);
      
      console.log(`Returning ${pastPuzzles.length} archived puzzles`);
      return pastPuzzles;
    } catch (error) {
      console.error('Error fetching puzzle archive:', error);
      throw error;
    }
  }

  // Create a puzzle
  async createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle> {
    const docRef = await addDoc(puzzlesCollection, {
      ...puzzle,
      date: dateToTimestamp(puzzle.date)
    });
    
    // Calculate word count for answer 
    const wordCount = puzzle.answer ? puzzle.answer.trim().split(/\s+/).length : undefined;
    
    return {
      id: puzzle.puzzleNumber, // Use puzzleNumber as ID
      puzzleNumber: puzzle.puzzleNumber,
      date: puzzle.date,
      difficulty: puzzle.difficulty || 'normal',
      emojis: puzzle.emojis,
      answer: puzzle.answer,
      hints: puzzle.hints || [],
      isFusionTwist: puzzle.isFusionTwist || 0,
      twistType: puzzle.twistType || null,
      wordCount: wordCount
    };
  }

  // Bulk create puzzles
  async bulkCreatePuzzles(puzzlesList: InsertPuzzle[]): Promise<Puzzle[]> {
    const results: Puzzle[] = [];
    
    for (const puzzle of puzzlesList) {
      const result = await this.createPuzzle(puzzle);
      results.push(result);
    }
    
    return results;
  }
}

// Create and export a singleton instance
export const firestoreService = new FirestoreService();