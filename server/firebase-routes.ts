import express, { Express, Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import { guessSchema, Puzzle } from '@shared/schema';
import { firestoreService } from '../client/src/firebase/firestore';
import { z } from 'zod';

// Utility function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Utility function to get today's date in user's timezone
function getTodayDateString(): string {
  const now = new Date();
  // Account for EST timezone (UTC-5)
  const estOffset = -5 * 60; // -5 hours in minutes
  const userOffset = now.getTimezoneOffset(); // User's timezone offset in minutes
  const offsetDiff = userOffset - estOffset; // Difference between user and EST timezone
  
  // Adjust date for EST timezone
  const estTime = new Date(now.getTime() + offsetDiff * 60 * 1000);
  
  return formatDate(estTime);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Root API endpoint
  app.get('/api', (req: Request, res: Response) => {
    res.json({ message: 'Fusdle API' });
  });

  // Get today's puzzle with optional difficulty parameter
  app.get('/api/puzzles/today', async (req: Request, res: Response) => {
    try {
      // Check if difficulty is specified in query params
      const { difficulty } = req.query;
      
      // Get puzzle with optional difficulty parameter
      let puzzle = await firestoreService.getTodaysPuzzle(difficulty as string);
      
      // If no puzzle found for today, use the earliest available puzzle
      if (!puzzle) {
        console.log('No puzzle found for today, using earliest available puzzle');
        const archive = await firestoreService.getPuzzleArchive(1);
        
        if (archive.length > 0) {
          puzzle = archive[0];
          
          // Apply difficulty override if specified
          if (difficulty && ['normal', 'hard'].includes(difficulty as string)) {
            puzzle.difficulty = difficulty as string;
          }
        } else {
          return res.status(404).json({ error: 'No puzzles available' });
        }
      }
      
      console.log(`Serving puzzle for today with ${puzzle.difficulty} difficulty`);
      
      // Remove answer and hints from response
      const { answer, hints, ...puzzleWithoutSpoilers } = puzzle;
      
      res.json(puzzleWithoutSpoilers);
    } catch (error) {
      console.error('Error fetching today\'s puzzle:', error);
      res.status(500).json({ error: 'Failed to fetch today\'s puzzle' });
    }
  });

  // Get archive of puzzles (previous puzzles)
  app.get('/api/puzzles/archive', async (req: Request, res: Response) => {
    try {
      const archive = await firestoreService.getPuzzleArchive();
      
      // For the archive, we want to include the answers but not the hints
      // This allows the archive to display past answers for each puzzle
      const archiveWithAnswers = archive.map(({ hints, ...puzzleWithAnswer }: Puzzle) => puzzleWithAnswer);
      
      res.json(archiveWithAnswers);
    } catch (error) {
      console.error('Error fetching puzzle archive:', error);
      res.status(500).json({ error: 'Failed to fetch puzzle archive' });
    }
  });

  // Submit a guess for a puzzle
  app.post('/api/puzzles/:id/guess', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { difficulty, puzzleType } = req.query;
      
      // Validate request body
      const result = guessSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid guess format' });
      }
      
      const { guess } = result.data;
      
      let puzzle;
      
      // Handle special case for fusion twist puzzles
      if (puzzleType === 'fusion') {
        console.log(`Processing guess for fusion puzzle ${id}`);
        
        // Use the specific fusion puzzle method
        puzzle = await firestoreService.getFusionPuzzleById(id);
        
        if (!puzzle) {
          return res.status(404).json({ error: 'Fusion puzzle not found' });
        }
        
        console.log(`Found fusion puzzle: ${puzzle.twistType}`);
      
      } else {
        // Regular non-fusion puzzle handling
        puzzle = await firestoreService.getPuzzleById(id, difficulty as string);
        if (!puzzle) {
          return res.status(404).json({ error: 'Puzzle not found' });
        }
      }
      
      console.log(`Processing guess for puzzle ${id} with difficulty ${difficulty || 'normal'}`);
      
      // Normalize both strings: convert to lowercase and remove all spaces
      const normalizeString = (str: string) => str.toLowerCase().replace(/\s+/g, '');
      
      // Check if the guess is correct (case insensitive and ignoring spaces)
      const normalizedAnswer = normalizeString(puzzle.answer);
      const normalizedGuess = normalizeString(guess);
      const isCorrect = normalizedAnswer === normalizedGuess;
      
      // If correct, return the answer
      if (isCorrect) {
        return res.json({ isCorrect, answer: puzzle.answer });
      }
      
      // Check for partial word matches
      let partialMatchFeedback = null;
      let matchedWord = null; // Explicit matched word for client highlighting
      let matchType = 'none';
      let hasCorrectWordsWrongOrder = false; // New flag for tracking words in wrong order
      
      // Split answer into words and check if any match
      const answerWords = puzzle.answer.toLowerCase().split(/\s+/);
      const guessWords = guess.toLowerCase().split(/\s+/);
      
      console.log('Checking for matches between:', { answer: puzzle.answer, guess });
      
      // First, check if the guess has all the right words but in the wrong order
      // This is a special case we want to detect and handle differently
      if (answerWords.length > 1 && guessWords.length === answerWords.length) {
        // This only makes sense for multi-word phrases
        const sortedAnswerWords = [...answerWords].sort();
        const sortedGuessWords = [...guessWords].sort();
        
        // Check if the sorted arrays match (same words, different order)
        let allWordsMatch = true;
        for (let i = 0; i < sortedAnswerWords.length; i++) {
          if (sortedAnswerWords[i] !== sortedGuessWords[i]) {
            allWordsMatch = false;
            break;
          }
        }
        
        if (allWordsMatch && !isCorrect) {
          hasCorrectWordsWrongOrder = true;
          console.log("Found all correct words but in wrong order!");
          partialMatchFeedback = "So close! You have all the right words, but in the wrong order.";
          matchType = 'wrong-order';
        }
      }
      
      // Improved matching algorithm - only proceed if we haven't found words in wrong order
      // Step 1: Find exact word matches first (preferred)
      // We prioritize matching the primary words in the answer if possible
      const primaryWords = answerWords.filter(w => w.length >= 4); // Primary words are longer
      
      // Only look for EXACT word matches - no partial matching allowed
      if (!hasCorrectWordsWrongOrder) {
        // Only check for exact word matches
        for (const guessWord of guessWords) {
          if (guessWord.length >= 3 && answerWords.includes(guessWord)) {
            matchedWord = guessWord;
            matchType = 'exact';
            console.log(`Found exact word match: "${matchedWord}"`);
            break;
          }
        }
      
        // Generate feedback only for exact matches
        if (matchedWord) {
          partialMatchFeedback = `You're on the right track! Your guess contains "${matchedWord}".`;
          console.log(`Found exact match: ${matchedWord}`);
        } else {
          // No matches found - no partial match feedback
          console.log("No exact word matches found");
        }
      } // Close the hasCorrectWordsWrongOrder if block
      
      // If incorrect, return the result with partial match feedback and matched word
      return res.json({ 
        isCorrect, 
        partialMatchFeedback,
        matchedWord, // Send the matched word to the client for better highlighting
        matchType,   // Include match type so client knows if it's a 'wrong-order' match
        hasCorrectWordsWrongOrder  // Flag to indicate if we have correct words in wrong order
      });
    } catch (error) {
      console.error('Error processing guess:', error);
      res.status(500).json({ error: 'Failed to process guess' });
    }
  });

  // Get a hint for a puzzle
  app.get('/api/puzzles/:id/hints/:index', async (req: Request, res: Response) => {
    try {
      const { id, index } = req.params;
      const { difficulty, puzzleType } = req.query;
      const hintIndex = parseInt(index);
      
      if (isNaN(hintIndex)) {
        return res.status(400).json({ error: 'Invalid hint index' });
      }
      
      let puzzle;
      
      // Handle special case for fusion twist puzzles
      if (puzzleType === 'fusion') {
        console.log(`Fetching hint ${hintIndex} for fusion puzzle ${id}`);
        
        // Use the specific fusion puzzle method
        puzzle = await firestoreService.getFusionPuzzleById(id);
        
        if (!puzzle) {
          return res.status(404).json({ error: 'Fusion puzzle not found' });
        }
        
        console.log(`Found fusion puzzle: ${puzzle.twistType}`);
      
      } else {
        // Regular non-fusion puzzle handling
        puzzle = await firestoreService.getPuzzleById(id, difficulty as string);
        if (!puzzle) {
          return res.status(404).json({ error: 'Puzzle not found' });
        }
      }
      
      console.log(`Fetching hint ${hintIndex} for puzzle ${id} with difficulty ${difficulty || 'normal'}`);
      
      // Check if hint exists
      if (!puzzle.hints || hintIndex >= puzzle.hints.length) {
        return res.status(404).json({ error: 'Hint not available' });
      }
      
      // Return the hint
      return res.json({ hint: puzzle.hints[hintIndex] });
    } catch (error) {
      console.error('Error fetching hint:', error);
      res.status(500).json({ error: 'Failed to fetch hint' });
    }
  });

  // Get the answer for a puzzle (only allowed for past puzzles)
  app.get('/api/puzzles/:id/answer', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { revealAnswer, difficulty, puzzleType } = req.query;
      
      let puzzle;
      
      // Handle special case for fusion twist puzzles
      if (puzzleType === 'fusion') {
        console.log(`Fetching answer for fusion puzzle ${id}`);
        
        // Use the specific fusion puzzle method
        puzzle = await firestoreService.getFusionPuzzleById(id);
        
        if (!puzzle) {
          return res.status(404).json({ error: 'Fusion puzzle not found' });
        }
        
        console.log(`Found fusion puzzle: ${puzzle.twistType}`);
      
      } else {
        // Regular non-fusion puzzle handling
        puzzle = await firestoreService.getPuzzleById(id, difficulty as string);
        if (!puzzle) {
          return res.status(404).json({ error: 'Puzzle not found' });
        }
      }
      
      console.log(`Fetching answer for puzzle ${id} with difficulty ${difficulty || 'normal'}`);
      
      // Only allow revealing the answer for past puzzles or if explicitly requested
      const today = getTodayDateString();
      const isPastPuzzle = puzzle.date < today;
      
      if (isPastPuzzle || revealAnswer === 'true') {
        return res.json({ answer: puzzle.answer });
      }
      
      return res.status(403).json({ error: 'Answer is only available for past puzzles' });
    } catch (error) {
      console.error('Error fetching answer:', error);
      res.status(500).json({ error: 'Failed to fetch answer' });
    }
  });

  // API endpoint to get latest patch note for Discord automation
  app.get('/api/patch-notes/latest', async (req: Request, res: Response) => {
    try {
      const patchNotes = await firestoreService.getPatchNotes();
      const latestNote = patchNotes[0]; // First item is most recent
      
      if (!latestNote) {
        return res.status(404).json({ error: 'No patch notes found' });
      }
      
      res.json({
        id: latestNote.id,
        title: latestNote.title,
        content: latestNote.content,
        version: latestNote.version,
        date: latestNote.date,
        type: latestNote.type,
        url: `${req.protocol}://${req.get('host')}/patch-notes`
      });
    } catch (error) {
      console.error('Error fetching latest patch note:', error);
      res.status(500).json({ error: 'Failed to fetch latest patch note' });
    }
  });

  // API endpoint to get all patch notes for external integrations
  app.get('/api/patch-notes', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const patchNotes = await firestoreService.getPatchNotes();
      
      res.json({
        patchNotes: patchNotes.slice(0, limit),
        total: patchNotes.length,
        gameUrl: `${req.protocol}://${req.get('host')}`
      });
    } catch (error) {
      console.error('Error fetching patch notes:', error);
      res.status(500).json({ error: 'Failed to fetch patch notes' });
    }
  });

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Create server but don't start listening yet - this will be done in index.ts
  const { Server } = await import('http');
  const server = new Server(app);
  console.log('Firebase routes registered - server ready');

  return server;
}