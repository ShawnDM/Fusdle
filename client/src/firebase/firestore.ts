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
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import type { Puzzle, InsertPuzzle } from '@shared/schema';
import { getGlobalDateString } from '../lib/global-time';

// Patch note interface
export interface PatchNote {
  id: string;
  title: string;
  content: string;
  version: string;
  date: string;
  type: 'feature' | 'fix' | 'improvement' | 'change';
}

// Collection references
const puzzlesCollection = collection(db, 'puzzles');
const patchNotesCollection = collection(db, 'patchNotes');

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
      theme: data.theme || "General",
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
      theme: "General",
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
      // Get the current date from global time API - this ensures consistency
      const todayStr = await getGlobalDateString();
      console.log(`Today's global date: ${todayStr}`);
      
      // Convert date string to Date object for more reliable comparisons
      const todayDate = new Date(todayStr);
      
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
      
      // Calculate a simple date string for each puzzle (YYYY-MM-DD format without time)
      // and create an array that includes both puzzle and simple date
      const puzzlesWithSimpleDates = allPuzzles.map(puzzle => {
        let simpleDateStr = '';
        try {
          // Extract just the date part (YYYY-MM-DD) and ignore time
          simpleDateStr = puzzle.date.split('T')[0];
        } catch (e) {
          console.warn(`Error parsing date for puzzle ${puzzle.puzzleNumber}:`, e);
          simpleDateStr = '1970-01-01'; // Use epoch as fallback
        }
        return { puzzle, simpleDateStr };
      });
      
      // Debug: Log puzzle dates we're looking at
      console.log(`Looking for puzzles matching ${todayStr.split('T')[0]} with ${effectiveDifficulty} difficulty`);
      
      // Find the puzzle for today with the right difficulty using the simple date string
      const matchingPuzzle = puzzlesWithSimpleDates.find(p => 
        // Compare only the YYYY-MM-DD part
        p.simpleDateStr === todayStr.split('T')[0] && 
        p.puzzle.difficulty === effectiveDifficulty
      );
      
      if (matchingPuzzle) {
        console.log(`Found today's puzzle: #${matchingPuzzle.puzzle.puzzleNumber} for ${matchingPuzzle.simpleDateStr}`);
        return matchingPuzzle.puzzle;
      }
      
      // If we can't find a puzzle for today, look for the puzzle with the
      // next puzzleNumber after the last one shown
      console.log(`No puzzle found for exact date match. Looking for puzzles chronologically...`);
      
      // Sort puzzles by their dates
      const sortedPuzzles = [...puzzlesWithSimpleDates]
        .filter(p => p.puzzle.difficulty === effectiveDifficulty)
        .sort((a, b) => {
          // First try to sort by date
          const dateA = new Date(a.simpleDateStr);
          const dateB = new Date(b.simpleDateStr);
          
          // If dates are valid, use them
          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            return dateA.getTime() - dateB.getTime();
          }
          
          // Fallback to puzzle number if dates are invalid
          return a.puzzle.puzzleNumber - b.puzzle.puzzleNumber;
        });
      
      // Find the first puzzle with a date >= today
      const nextPuzzle = sortedPuzzles.find(p => {
        try {
          const puzzleDate = new Date(p.simpleDateStr);
          return !isNaN(puzzleDate.getTime()) && puzzleDate >= todayDate;
        } catch (e) {
          return false;
        }
      });
      
      if (nextPuzzle) {
        console.log(`Found chronological match: Puzzle #${nextPuzzle.puzzle.puzzleNumber} for ${nextPuzzle.simpleDateStr}`);
        return nextPuzzle.puzzle;
      }
      
      // If no puzzles for today or future, use the most recent puzzle
      if (sortedPuzzles.length > 0) {
        const latestPuzzle = sortedPuzzles[sortedPuzzles.length - 1];
        console.log(`Using most recent puzzle: #${latestPuzzle.puzzle.puzzleNumber} from ${latestPuzzle.simpleDateStr}`);
        return latestPuzzle.puzzle;
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

  // Get puzzle archive (limited count) with global time
  async getPuzzleArchive(limitCount = 30): Promise<Puzzle[]> {
    try {
      // Get the current date from global time API
      const todayStr = await getGlobalDateString();
      const todaySimple = todayStr.split('T')[0]; // Get YYYY-MM-DD format
      console.log(`Getting archive puzzles, global date is: ${todaySimple}`);
      
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
      
      // Calculate simple dates for more reliable comparison
      const puzzlesWithSimpleDates = allPuzzles.map(puzzle => {
        let simpleDateStr = '';
        try {
          // Extract just the date part (YYYY-MM-DD) and ignore time
          simpleDateStr = puzzle.date.split('T')[0];
        } catch (e) {
          console.warn(`Error parsing date for puzzle ${puzzle.puzzleNumber}:`, e);
          simpleDateStr = '1970-01-01'; // Use epoch as fallback
        }
        return { puzzle, simpleDateStr };
      });
      
      // Filter puzzles for archive (puzzles with dates before today)
      const archivePuzzles = puzzlesWithSimpleDates
        .filter(({ puzzle, simpleDateStr }) => {
          try {
            // For debugging purposes, log puzzle details (only for first few puzzles)
            if (puzzle.puzzleNumber <= 10) {
              console.log(`Archive filter: Puzzle #${puzzle.puzzleNumber} (${puzzle.difficulty}): date=${simpleDateStr}, today=${todaySimple}`);
            }
            
            // This is a simple string comparison - if the puzzle date is less than today's date
            // We know the dates are in YYYY-MM-DD format, so lexicographic comparison works
            return simpleDateStr < todaySimple;
          } catch (err) {
            console.error(`Date comparison error for puzzle ${puzzle.id}:`, err);
            return false; // Exclude puzzles with invalid dates
          }
        })
        .map(({ puzzle }) => puzzle) // Extract just the puzzle from the wrapper object
        .sort((a, b) => {
          // Sort by date (newest first) for the archive view
          try {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            
            // If dates are valid, use them (newest first)
            if (!isNaN(dateA) && !isNaN(dateB)) {
              return dateB - dateA;
            }
          } catch (e) {
            console.warn('Error sorting dates, falling back to puzzle number');
          }
          
          // Fallback to puzzleNumber if dates aren't valid
          return b.puzzleNumber - a.puzzleNumber;
        })
        .slice(0, limitCount);
      
      // Log detailed archive information
      console.log(`Found ${archivePuzzles.length} archive puzzles out of ${allPuzzles.length} total`);
      console.log(`Archive puzzles IDs: ${archivePuzzles.map(p => p.puzzleNumber).join(', ')}`);
      
      // Count by difficulty
      const normalCount = archivePuzzles.filter(p => p.difficulty === 'normal').length;
      const hardCount = archivePuzzles.filter(p => p.difficulty === 'hard').length; 
      console.log(`Archive: ${normalCount} normal, ${hardCount} hard puzzles`);
      
      // Return the archive puzzles
      return archivePuzzles;
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
      theme: puzzle.theme || "General",
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

  // Patch Notes methods
  async getPatchNotes(): Promise<PatchNote[]> {
    try {
      const q = query(patchNotesCollection, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PatchNote));
    } catch (error) {
      console.error('Error fetching patch notes:', error);
      return [];
    }
  }

  async createPatchNote(patchNote: Omit<PatchNote, 'id'>): Promise<PatchNote> {
    try {
      const docRef = await addDoc(patchNotesCollection, patchNote);
      const createdPatchNote = {
        id: docRef.id,
        ...patchNote
      };

      // Send webhook notification to n8n workflow
      try {
        const webhookUrl = 'https://n8n.shawnlabs.com/webhook/3900525d-7568-4590-8acd-8ee7f2a7f438';
        const webhookPayload = {
          id: createdPatchNote.id,
          title: createdPatchNote.title,
          content: createdPatchNote.content,
          version: createdPatchNote.version,
          date: createdPatchNote.date,
          type: createdPatchNote.type,
          url: `${window.location.origin}/patch-notes`,
          gameUrl: window.location.origin,
          timestamp: new Date().toISOString()
        };

        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        });

        console.log('Webhook notification sent successfully');
      } catch (webhookError) {
        console.error('Failed to send webhook notification:', webhookError);
        // Don't throw here - patch note creation should still succeed even if webhook fails
      }

      return createdPatchNote;
    } catch (error) {
      console.error('Error creating patch note:', error);
      throw error;
    }
  }

  async updatePatchNote(id: string, updates: Partial<Omit<PatchNote, 'id'>>): Promise<void> {
    try {
      const docRef = doc(patchNotesCollection, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating patch note:', error);
      throw error;
    }
  }

  async deletePatchNote(id: string): Promise<void> {
    try {
      const docRef = doc(patchNotesCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting patch note:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const firestoreService = new FirestoreService();