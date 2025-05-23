// Main API handler for Vercel deployments (serverless)
// This adapts the Express API to work with Vercel's serverless functions

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit, doc, getDoc, Timestamp } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only once
let firebaseApp;
let db;

function initFirebase() {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
  }
  return { app: firebaseApp, db };
}

// Helper function to get today's date formatted for puzzles
function getTodayDateString() {
  const today = new Date();
  // Set time to 4:00 AM UTC-4 (midnight Eastern Time)
  today.setUTCHours(4, 0, 0, 0);
  return today.toISOString().split('T')[0];
}

// Convert Firestore Timestamp to Date string
function timestampToDate(timestamp) {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toISOString().split('T')[0];
}

// Parse JSON body for POST requests
async function parseBody(req) {
  if (req.body) return req.body;
  
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  const data = Buffer.concat(buffers).toString();
  
  try {
    return JSON.parse(data || '{}');
  } catch (error) {
    return {};
  }
}

// Route handler for requests
export default async function handler(req, res) {
  // Initialize Firebase
  const { db } = initFirebase();
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse URL path and query parameters
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname;
  
  // Extract query parameters
  const params = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  // Basic health check endpoint
  if (path === '/api' || path === '/api/') {
    return res.status(200).json({
      status: 'online',
      message: 'Fusdle API is running on Vercel',
      timestamp: new Date().toISOString()
    });
  }
  
  // Today's puzzle endpoint
  if (path === '/api/puzzles/today') {
    try {
      const difficulty = params.difficulty || 'normal';
      
      // Get today's date for puzzle lookup
      const todayStr = getTodayDateString();
      console.log('Looking for puzzle with date:', todayStr, 'and difficulty:', difficulty);
      
      // Query Firestore for today's puzzle with specified difficulty
      const puzzlesRef = collection(db, 'puzzles');
      const q = query(
        puzzlesRef,
        where('date', '==', todayStr),
        where('difficulty', '==', difficulty),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return res.status(404).json({
          error: 'No puzzle found for today',
          date: todayStr,
          difficulty
        });
      }
      
      // Process the puzzle data
      const puzzleDoc = querySnapshot.docs[0];
      const puzzleData = puzzleDoc.data();
      
      // Format date if it's a Timestamp
      if (puzzleData.date && typeof puzzleData.date !== 'string') {
        puzzleData.date = timestampToDate(puzzleData.date);
      }
      
      // Return the puzzle
      return res.status(200).json({
        id: puzzleDoc.id,
        ...puzzleData
      });
    } catch (error) {
      console.error('Error fetching today\'s puzzle:', error);
      return res.status(500).json({
        error: 'Failed to fetch puzzle',
        message: error.message
      });
    }
  }
  
  // Archive endpoint
  if (path === '/api/puzzles/archive') {
    try {
      const limitCount = parseInt(params.limit || '30');
      
      // Get today's date to filter out future puzzles
      const todayStr = getTodayDateString();
      const today = new Date(todayStr);
      
      // Query Firestore for archive puzzles
      const puzzlesRef = collection(db, 'puzzles');
      const q = query(
        puzzlesRef,
        limit(limitCount + 20) // Get extra to allow for filtering
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return res.status(404).json({
          error: 'No puzzles found in archive'
        });
      }
      
      // Process the puzzle data
      let puzzles = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Format date if it's a Timestamp
        if (data.date && typeof data.date !== 'string') {
          data.date = timestampToDate(data.date);
        }
        
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Filter out future puzzles
      puzzles = puzzles
        .filter(puzzle => {
          const puzzleDate = new Date(puzzle.date);
          return puzzleDate <= today;
        })
        .slice(0, limitCount); // Limit to requested count
      
      // Return the puzzles
      return res.status(200).json(puzzles);
    } catch (error) {
      console.error('Error fetching archive puzzles:', error);
      return res.status(500).json({
        error: 'Failed to fetch archive',
        message: error.message
      });
    }
  }
  
  // Handle puzzle guesses
  if (path.match(/\/api\/puzzles\/\w+\/guess/)) {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      // Extract puzzle ID from URL
      const matches = path.match(/\/api\/puzzles\/(\w+)\/guess/);
      const puzzleId = matches ? matches[1] : null;
      
      if (!puzzleId) {
        return res.status(400).json({ error: 'Invalid puzzle ID' });
      }
      
      // Get difficulty from query params
      const difficulty = params.difficulty || 'normal';
      
      // Parse request body
      const body = await parseBody(req);
      const { guess } = body;
      
      if (!guess) {
        return res.status(400).json({ error: 'Guess is required' });
      }
      
      // Try to get the puzzle by document ID first
      try {
        const docRef = doc(db, 'puzzles', puzzleId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const puzzleData = docSnap.data();
          
          // Check if difficulty matches
          if (puzzleData.difficulty === difficulty) {
            // Compare the guess with the answer (case-insensitive)
            const normalizedGuess = guess.toLowerCase().trim();
            const normalizedAnswer = puzzleData.answer.toLowerCase().trim();
            const isCorrect = normalizedGuess === normalizedAnswer;
            
            // Check for partial match
            let partialMatchFeedback = null;
            if (!isCorrect) {
              // Check if any words in the answer are in the guess
              const answerWords = normalizedAnswer.split(/\s+/);
              const guessWords = normalizedGuess.split(/\s+/);
              
              // Find any matching words
              const matchingWords = answerWords.filter(word => 
                guessWords.some(guessWord => word === guessWord || word.includes(guessWord) || guessWord.includes(word))
              );
              
              if (matchingWords.length > 0) {
                partialMatchFeedback = "You're on the right track! Part of your answer matches.";
              }
            }
            
            // Return the guess result
            return res.status(200).json({
              isCorrect,
              partialMatchFeedback,
              ...(isCorrect ? { answer: puzzleData.answer } : {})
            });
          }
        }
      } catch (error) {
        console.error('Error checking puzzle by doc ID:', error);
        // Continue to numeric ID lookup
      }
      
      // Try to get the puzzle by puzzle number as fallback
      // Convert puzzle ID to number if possible
      let puzzleNumber;
      try {
        puzzleNumber = parseInt(puzzleId);
      } catch (e) {
        puzzleNumber = null;
      }
      
      if (puzzleNumber !== null) {
        // Query by puzzle number
        const puzzlesRef = collection(db, 'puzzles');
        const q = query(
          puzzlesRef,
          where('puzzleNumber', '==', puzzleNumber),
          where('difficulty', '==', difficulty),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return res.status(404).json({ error: 'Puzzle not found' });
        }
        
        // Get puzzle data
        const puzzleDoc = querySnapshot.docs[0];
        const puzzleData = puzzleDoc.data();
        
        // Compare the guess with the answer (case-insensitive)
        const normalizedGuess = guess.toLowerCase().trim();
        const normalizedAnswer = puzzleData.answer.toLowerCase().trim();
        const isCorrect = normalizedGuess === normalizedAnswer;
        
        // Check for partial match
        let partialMatchFeedback = null;
        if (!isCorrect) {
          // Check if any words in the answer are in the guess
          const answerWords = normalizedAnswer.split(/\s+/);
          const guessWords = normalizedGuess.split(/\s+/);
          
          // Find any matching words
          const matchingWords = answerWords.filter(word => 
            guessWords.some(guessWord => word === guessWord || word.includes(guessWord) || guessWord.includes(word))
          );
          
          if (matchingWords.length > 0) {
            partialMatchFeedback = "You're on the right track! Part of your answer matches.";
          }
        }
        
        // Return the guess result
        return res.status(200).json({
          isCorrect,
          partialMatchFeedback,
          ...(isCorrect ? { answer: puzzleData.answer } : {})
        });
      } else {
        return res.status(404).json({ error: 'Puzzle not found' });
      }
    } catch (error) {
      console.error('Error processing guess:', error);
      return res.status(500).json({
        error: 'Failed to process guess',
        message: error.message
      });
    }
  }
  
  // Handle puzzle hints
  if (path.match(/\/api\/puzzles\/\w+\/hints\/\d+/)) {
    try {
      const matches = path.match(/\/api\/puzzles\/(\w+)\/hints\/(\d+)/);
      if (!matches) {
        return res.status(400).json({ error: 'Invalid hint request path' });
      }
      
      const puzzleId = matches[1];
      const hintIndex = parseInt(matches[2]);
      
      // Get difficulty from query params
      const difficulty = params.difficulty || 'normal';
      
      // Try direct document lookup first
      try {
        const docRef = doc(db, 'puzzles', puzzleId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const puzzleData = docSnap.data();
          
          // Check if difficulty matches
          if (puzzleData.difficulty === difficulty) {
            // Check if hint index is valid
            if (!puzzleData.hints || hintIndex >= puzzleData.hints.length) {
              return res.status(404).json({ error: 'Hint not found' });
            }
            
            // Return the hint
            return res.status(200).json({
              hint: puzzleData.hints[hintIndex]
            });
          }
        }
      } catch (error) {
        console.error('Error checking puzzle by doc ID:', error);
        // Continue to numeric ID lookup
      }
      
      // Try to get the puzzle by puzzle number as fallback
      // Convert puzzle ID to number if possible
      let puzzleNumber;
      try {
        puzzleNumber = parseInt(puzzleId);
      } catch (e) {
        puzzleNumber = null;
      }
      
      if (puzzleNumber !== null) {
        // Fetch the puzzle from Firestore
        const puzzlesRef = collection(db, 'puzzles');
        const q = query(
          puzzlesRef,
          where('puzzleNumber', '==', puzzleNumber),
          where('difficulty', '==', difficulty),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return res.status(404).json({ error: 'Puzzle not found' });
        }
        
        // Get puzzle data
        const puzzleDoc = querySnapshot.docs[0];
        const puzzleData = puzzleDoc.data();
        
        // Check if hint index is valid
        if (!puzzleData.hints || hintIndex >= puzzleData.hints.length) {
          return res.status(404).json({ error: 'Hint not found' });
        }
        
        // Return the hint
        return res.status(200).json({
          hint: puzzleData.hints[hintIndex]
        });
      } else {
        return res.status(404).json({ error: 'Puzzle not found' });
      }
    } catch (error) {
      console.error('Error fetching hint:', error);
      return res.status(500).json({
        error: 'Failed to fetch hint',
        message: error.message
      });
    }
  }
  
  // Handle puzzle answers
  if (path.match(/\/api\/puzzles\/\w+\/answer/)) {
    try {
      const matches = path.match(/\/api\/puzzles\/(\w+)\/answer/);
      if (!matches) {
        return res.status(400).json({ error: 'Invalid answer request path' });
      }
      
      const puzzleId = matches[1];
      
      // Get parameters from query
      const difficulty = params.difficulty || 'normal';
      const revealAnswer = params.revealAnswer === 'true';
      
      if (!revealAnswer) {
        return res.status(403).json({ error: 'Not authorized to see answer' });
      }
      
      // Try direct document lookup first
      try {
        const docRef = doc(db, 'puzzles', puzzleId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const puzzleData = docSnap.data();
          
          // Check if difficulty matches
          if (puzzleData.difficulty === difficulty) {
            // Return the answer
            return res.status(200).json({
              answer: puzzleData.answer
            });
          }
        }
      } catch (error) {
        console.error('Error checking puzzle by doc ID:', error);
        // Continue to numeric ID lookup
      }
      
      // Try to get the puzzle by puzzle number as fallback
      // Convert puzzle ID to number if possible
      let puzzleNumber;
      try {
        puzzleNumber = parseInt(puzzleId);
      } catch (e) {
        puzzleNumber = null;
      }
      
      if (puzzleNumber !== null) {
        // Fetch the puzzle from Firestore
        const puzzlesRef = collection(db, 'puzzles');
        const q = query(
          puzzlesRef,
          where('puzzleNumber', '==', puzzleNumber),
          where('difficulty', '==', difficulty),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return res.status(404).json({ error: 'Puzzle not found' });
        }
        
        // Get puzzle data
        const puzzleDoc = querySnapshot.docs[0];
        const puzzleData = puzzleDoc.data();
        
        // Return just the answer
        return res.status(200).json({
          answer: puzzleData.answer
        });
      } else {
        return res.status(404).json({ error: 'Puzzle not found' });
      }
    } catch (error) {
      console.error('Error fetching answer:', error);
      return res.status(500).json({
        error: 'Failed to fetch answer',
        message: error.message
      });
    }
  }
  
  // Patch notes endpoints for Discord automation
  if (path === '/api/patch-notes/latest') {
    try {
      // Get the latest patch note from Firestore
      const patchNotesRef = collection(db, 'patchNotes');
      const querySnapshot = await getDocs(patchNotesRef);
      
      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'No patch notes found' });
      }
      
      // Convert to array and sort by date (most recent first)
      const patchNotes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const latestNote = patchNotes[0];
      
      return res.status(200).json({
        id: latestNote.id,
        title: latestNote.title,
        content: latestNote.content,
        version: latestNote.version,
        date: latestNote.date,
        type: latestNote.type,
        url: `${req.headers.host.includes('localhost') ? 'http' : 'https'}://${req.headers.host}/patch-notes`
      });
    } catch (error) {
      console.error('Error fetching latest patch note:', error);
      return res.status(500).json({
        error: 'Failed to fetch latest patch note',
        message: error.message
      });
    }
  }
  
  if (path === '/api/patch-notes') {
    try {
      const limitCount = parseInt(params.limit || '10');
      
      // Get patch notes from Firestore
      const patchNotesRef = collection(db, 'patchNotes');
      const querySnapshot = await getDocs(patchNotesRef);
      
      // Convert to array and sort by date (most recent first)
      const patchNotes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return res.status(200).json({
        patchNotes: patchNotes.slice(0, limitCount),
        total: patchNotes.length,
        gameUrl: `${req.headers.host.includes('localhost') ? 'http' : 'https'}://${req.headers.host}`
      });
    } catch (error) {
      console.error('Error fetching patch notes:', error);
      return res.status(500).json({
        error: 'Failed to fetch patch notes',
        message: error.message
      });
    }
  }
  
  // Default: route not found
  return res.status(404).json({
    error: 'API endpoint not found',
    path
  });
}