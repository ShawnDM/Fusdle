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
      
      // Split answer into words and check if any match
      const answerWords = puzzle.answer.toLowerCase().split(/\s+/);
      const guessWords = guess.toLowerCase().split(/\s+/);
      
      // Step 1: Find exact word matches first (preferred)
      const exactWordMatches = guessWords.filter(guessWord => 
        answerWords.some(answerWord => answerWord === guessWord)
      );
      
      // Step 2: If no exact matches, look for partial word matches (substring)
      if (exactWordMatches.length > 0) {
        // Include the matched word in the feedback with quotes for consistency
        partialMatchFeedback = `You're on the right track! Your guess contains "${exactWordMatches[0]}".`;
      } else {
        // Look for partial matches (one word contains the other)
        const partialMatches = [];
        
        for (const guessWord of guessWords) {
          // Skip very short words (2 chars or less) as they often give false positives
          if (guessWord.length < 3) continue;
          
          for (const answerWord of answerWords) {
            // Check if the guess word is contained in the answer word, or vice versa
            if (answerWord.includes(guessWord) || guessWord.includes(answerWord)) {
              partialMatches.push(guessWord);
              break;
            }
          }
        }
        
        if (partialMatches.length > 0) {
          // Include the matched word in the feedback with quotes for consistency
          partialMatchFeedback = `You're on the right track! Your guess contains "${partialMatches[0]}".`;
        } else {
          // Generic feedback (fallback) if we can't identify a specific match but still want feedback
          partialMatchFeedback = "You're on the right track! Part of your answer matches.";
        }
      }
      
      // If incorrect, return the result with partial match feedback
      return res.json({ isCorrect, partialMatchFeedback });
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