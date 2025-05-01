// Vercel API handler
const express = require('express');
const bodyParser = require('body-parser');
const { db } = require('../client/src/firebase/firestore');

// Create Express app
const app = express();
app.use(bodyParser.json());

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Utility function to get today's date in user's timezone
function getTodayDateString() {
  const now = new Date();
  // Account for EST timezone (UTC-5)
  const estOffset = -5 * 60; // -5 hours in minutes
  const userOffset = now.getTimezoneOffset(); // User's timezone offset in minutes
  const offsetDiff = userOffset - estOffset; // Difference between user and EST timezone
  
  // Adjust date for EST timezone
  const estTime = new Date(now.getTime() + offsetDiff * 60 * 1000);
  
  return formatDate(estTime);
}

// Process guess and check if it's correct
async function processGuess(puzzle, guess) {
  if (!puzzle || !puzzle.answer) {
    return { error: 'Invalid puzzle data' };
  }

  // Normalize both strings: convert to lowercase and remove all spaces
  const normalizeString = (str) => str.toLowerCase().replace(/\s+/g, '');
  
  // Check if the guess is correct (case insensitive and ignoring spaces)
  const normalizedAnswer = normalizeString(puzzle.answer);
  const normalizedGuess = normalizeString(guess);
  const isCorrect = normalizedAnswer === normalizedGuess;
  
  // If correct, return the answer
  if (isCorrect) {
    return { isCorrect, answer: puzzle.answer };
  }
  
  // Check for partial word matches
  let partialMatchFeedback = null;
  let matchedWord = null; // Explicit matched word for client highlighting
  let matchType = 'none';
  let hasCorrectWordsWrongOrder = false; // New flag for tracking words in wrong order
  
  // Split answer into words and check if any match
  const answerWords = puzzle.answer.toLowerCase().split(/\s+/);
  const guessWords = guess.toLowerCase().split(/\s+/);
  
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
      partialMatchFeedback = "So close! You have all the right words, but in the wrong order.";
      matchType = 'wrong-order';
      return { 
        isCorrect: false, 
        partialMatchFeedback, 
        matchType, 
        hasCorrectWordsWrongOrder
      };
    }
  }
  
  // Improved matching algorithm - only proceed if we haven't found words in wrong order
  // Step 1: Find exact word matches first (preferred)
  // We prioritize matching the primary words in the answer if possible
  const primaryWords = answerWords.filter(w => w.length >= 4); // Primary words are longer
  
  // Only look for partial matches if we haven't found a wrong order match
  if (!hasCorrectWordsWrongOrder) {
    // First check for primary word matches (like "escape" or "artist")
    for (const guessWord of guessWords) {
      if (guessWord.length >= 4 && primaryWords.includes(guessWord)) {
        matchedWord = guessWord;
        matchType = 'primary';
        break;
      }
    }
    
    // If no primary match, look for any exact word match
    if (!matchedWord) {
      for (const guessWord of guessWords) {
        if (guessWord.length >= 3 && answerWords.includes(guessWord)) {
          matchedWord = guessWord;
          matchType = 'exact';
          break;
        }
      }
    }
    
    // If still no match, try substring matches with significant words
    if (!matchedWord) {
      for (const guessWord of guessWords) {
        // Skip very short words (2 chars or less) as they often give false positives
        if (guessWord.length < 3) continue;
        
        for (const answerWord of answerWords) {
          // Only consider meaningful answer words
          if (answerWord.length < 4) continue;
          
          // Check if the guess word is contained in the answer word, or vice versa
          if (answerWord.includes(guessWord) || guessWord.includes(answerWord)) {
            matchedWord = guessWord;
            matchType = 'substring';
            break;
          }
        }
        if (matchedWord) break; // Exit once we find a match
      }
    }
    
    // Generate appropriate feedback based on the match found
    if (matchedWord) {
      // Include the matched word in the feedback with quotes for consistency
      partialMatchFeedback = `You're on the right track! Your guess contains "${matchedWord}".`;
    } else {
      // Only use generic feedback if we're very confident there's some match we couldn't identify
      // This is safer than potentially giving false feedback
      const guessText = guess.toLowerCase();
      const answerText = puzzle.answer.toLowerCase();
      
      // If there's some textual overlap, provide generic feedback
      if (guessText.length > 3 && (answerText.includes(guessText.substring(0, 4)) || 
          guessText.includes(answerText.substring(0, 4)))) {
        partialMatchFeedback = "You're on the right track! Part of your answer matches.";
      }
    }
  }
  
  // Return the result with partial match feedback and matched word
  return { 
    isCorrect: false, 
    partialMatchFeedback,
    matchedWord, 
    matchType,
    hasCorrectWordsWrongOrder
  };
}

// API endpoint to handle guesses
app.post('/api/puzzles/:id/guess', async (req, res) => {
  try {
    const { id } = req.params;
    const { difficulty, puzzleType } = req.query;
    
    // Validate request body
    if (!req.body || !req.body.guess) {
      return res.status(400).json({ error: 'Invalid guess format' });
    }
    
    const { guess } = req.body;
    
    // Get the puzzle from Firebase
    const { firestoreService } = require('../client/src/firebase/firestore');
    let puzzle;
    
    // Handle special case for fusion twist puzzles
    if (puzzleType === 'fusion') {
      // Use the specific fusion puzzle method
      puzzle = await firestoreService.getFusionPuzzleById(id);
      
      if (!puzzle) {
        return res.status(404).json({ error: 'Fusion puzzle not found' });
      }
    } else {
      // Regular non-fusion puzzle handling
      puzzle = await firestoreService.getPuzzleById(id, difficulty || 'normal');
      if (!puzzle) {
        return res.status(404).json({ error: 'Puzzle not found' });
      }
    }
    
    // Process the guess
    const result = await processGuess(puzzle, guess);
    
    // Return the result
    return res.json(result);
  } catch (error) {
    console.error('Error processing guess:', error);
    res.status(500).json({ error: 'Failed to process guess' });
  }
});

// API endpoint to get today's puzzle
app.get('/api/puzzles/today', async (req, res) => {
  try {
    // Check if difficulty is specified in query params
    const { difficulty } = req.query;
    
    // Get the puzzle from Firebase
    const { firestoreService } = require('../client/src/firebase/firestore');
    
    // Get puzzle with optional difficulty parameter
    let puzzle = await firestoreService.getTodaysPuzzle(difficulty);
    
    // If no puzzle found for today, use the earliest available puzzle
    if (!puzzle) {
      console.log('No puzzle found for today, using earliest available puzzle');
      const archive = await firestoreService.getPuzzleArchive(1);
      
      if (archive.length > 0) {
        puzzle = archive[0];
        
        // Apply difficulty override if specified
        if (difficulty && ['normal', 'hard'].includes(difficulty)) {
          puzzle.difficulty = difficulty;
        }
      } else {
        return res.status(404).json({ error: 'No puzzles available' });
      }
    }
    
    // Remove answer and hints from response
    const { answer, hints, ...puzzleWithoutSpoilers } = puzzle;
    
    res.json(puzzleWithoutSpoilers);
  } catch (error) {
    console.error('Error fetching today\'s puzzle:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s puzzle' });
  }
});

// API endpoint to get a hint for a puzzle
app.get('/api/puzzles/:id/hints/:index', async (req, res) => {
  try {
    const { id, index } = req.params;
    const { difficulty, puzzleType } = req.query;
    const hintIndex = parseInt(index);
    
    if (isNaN(hintIndex)) {
      return res.status(400).json({ error: 'Invalid hint index' });
    }
    
    // Get the puzzle from Firebase
    const { firestoreService } = require('../client/src/firebase/firestore');
    let puzzle;
    
    // Handle special case for fusion twist puzzles
    if (puzzleType === 'fusion') {
      // Use the specific fusion puzzle method
      puzzle = await firestoreService.getFusionPuzzleById(id);
      
      if (!puzzle) {
        return res.status(404).json({ error: 'Fusion puzzle not found' });
      }
    } else {
      // Regular non-fusion puzzle handling
      puzzle = await firestoreService.getPuzzleById(id, difficulty || 'normal');
      if (!puzzle) {
        return res.status(404).json({ error: 'Puzzle not found' });
      }
    }
    
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

// API endpoint to get the answer for a puzzle
app.get('/api/puzzles/:id/answer', async (req, res) => {
  try {
    const { id } = req.params;
    const { revealAnswer, difficulty, puzzleType } = req.query;
    
    // Get the puzzle from Firebase
    const { firestoreService } = require('../client/src/firebase/firestore');
    let puzzle;
    
    // Handle special case for fusion twist puzzles
    if (puzzleType === 'fusion') {
      // Use the specific fusion puzzle method
      puzzle = await firestoreService.getFusionPuzzleById(id);
      
      if (!puzzle) {
        return res.status(404).json({ error: 'Fusion puzzle not found' });
      }
    } else {
      // Regular non-fusion puzzle handling
      puzzle = await firestoreService.getPuzzleById(id, difficulty || 'normal');
      if (!puzzle) {
        return res.status(404).json({ error: 'Puzzle not found' });
      }
    }
    
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

// API endpoint to get puzzle archive
app.get('/api/puzzles/archive', async (req, res) => {
  try {
    // Get the puzzle from Firebase
    const { firestoreService } = require('../client/src/firebase/firestore');
    const archive = await firestoreService.getPuzzleArchive();
    
    // For the archive, we want to include the answers but not the hints
    // This allows the archive to display past answers for each puzzle
    const archiveWithAnswers = archive.map(({ hints, ...puzzleWithAnswer }) => puzzleWithAnswer);
    
    res.json(archiveWithAnswers);
  } catch (error) {
    console.error('Error fetching puzzle archive:', error);
    res.status(500).json({ error: 'Failed to fetch puzzle archive' });
  }
});

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'Fusdle API' });
});

// Export as serverless function
module.exports = app;