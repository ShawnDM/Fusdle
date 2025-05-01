// Vercel serverless function for handling guesses
const admin = require('firebase-admin');
let serviceAccount;

try {
  // Try to load the service account key from the environment
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    try {
      // Fallback to the file if running locally
      serviceAccount = require('../../../../serviceAccountKey.json');
    } catch (e) {
      console.warn('Failed to load service account key from file:', e.message);
    }
  }
  
  // Initialize Firebase Admin if not already initialized
  if (admin.apps.length === 0 && serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Helper function to check for partial matches
function findPartialMatch(guess, answer) {
  // Convert both to lowercase for case-insensitive matching
  const guessLower = guess.toLowerCase();
  const answerLower = answer.toLowerCase();
  
  // Split by spaces to get individual words
  const guessWords = guessLower.split(/\s+/);
  const answerWords = answerLower.split(/\s+/);
  
  // Check for exact match first
  if (guessLower === answerLower) {
    return {
      isCorrect: true,
      answer: answer
    };
  }
  
  // Check for partial word matches
  const partialMatches = [];
  for (let i = 0; i < guessWords.length; i++) {
    if (answerWords.includes(guessWords[i])) {
      partialMatches.push(i);
    }
  }
  
  // Check for correct words in wrong order
  const hasAllWords = guessWords.length === answerWords.length && 
    guessWords.every(word => answerWords.includes(word));
  
  // Return results
  return {
    isCorrect: false,
    partialMatchFeedback: partialMatches.length > 0 ? partialMatches : null,
    matchedWord: null,
    matchType: partialMatches.length > 0 ? 'partial' : 'none',
    hasCorrectWordsWrongOrder: hasAllWords
  };
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Extract puzzle ID from URL
    const { id } = req.query;
    // Extract guess from request body
    const { guess, difficulty = 'normal' } = req.body;
    
    // Validate inputs
    if (!id || !guess) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // If Firebase is initialized, try to get the puzzle
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      
      // Get the puzzle by ID and difficulty
      const puzzlesRef = db.collection('puzzles');
      const snapshot = await puzzlesRef
        .where('difficulty', '==', difficulty)
        .get();
      
      // Find matching puzzle
      const puzzleDoc = snapshot.docs.find(doc => doc.id === id);
      
      if (puzzleDoc) {
        const puzzleData = puzzleDoc.data();
        
        // Check if the guess is correct
        const result = findPartialMatch(guess, puzzleData.answer);
        
        return res.status(200).json(result);
      }
    }
    
    // If puzzle not found or Firebase not initialized, return default response
    return res.status(200).json({
      isCorrect: false,
      partialMatchFeedback: null,
      matchedWord: null,
      matchType: 'none',
      hasCorrectWordsWrongOrder: false
    });
  } catch (error) {
    console.error('Error processing guess:', error);
    return res.status(500).json({ 
      error: 'Failed to process guess',
      message: error.message
    });
  }
};