import { storage } from '../server/storage';
import { firestoreService } from '../client/src/firebase/firestore';

// Define types locally to avoid import issues
interface Puzzle {
  id: number;
  puzzleNumber: number;
  date: string;
  emojis: string[];
  answer?: string;
  hints?: string[];
}

interface InsertPuzzle {
  puzzleNumber: number;
  date: string;
  emojis: string[];
  answer: string;
  hints?: string[];
}

/**
 * This script migrates puzzle data from PostgreSQL to Firebase Firestore
 * To run: npx tsx scripts/migrate-to-firebase.ts
 */
async function migratePuzzles() {
  console.log('Starting migration of puzzles from PostgreSQL to Firebase...');

  try {
    // Get all puzzles from the database
    console.log('Fetching puzzles from PostgreSQL...');
    const puzzles = await storage.getPuzzleArchive(1000); // Get up to 1000 puzzles
    console.log(`Found ${puzzles.length} puzzles to migrate.`);

    // Prepare puzzles for Firestore
    const firestorePuzzles: InsertPuzzle[] = puzzles.map(puzzle => ({
      puzzleNumber: puzzle.puzzleNumber,
      date: puzzle.date,
      emojis: puzzle.emojis,
      answer: puzzle.answer,
      hints: puzzle.hints || []
    }));

    // Migrate puzzles to Firestore in batches
    console.log('Migrating puzzles to Firebase Firestore...');
    const batchSize = 20;
    for (let i = 0; i < firestorePuzzles.length; i += batchSize) {
      const batch = firestorePuzzles.slice(i, i + batchSize);
      console.log(`Migrating batch ${i / batchSize + 1} (${batch.length} puzzles)...`);
      await firestoreService.bulkCreatePuzzles(batch);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration
migratePuzzles();