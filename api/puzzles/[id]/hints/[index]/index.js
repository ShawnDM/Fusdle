// Vercel serverless function for fetching hints
const admin = require('firebase-admin');
let serviceAccount;

try {
  // Try to load the service account key from the environment
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    try {
      // Fallback to the file if running locally
      serviceAccount = require('../../../../../serviceAccountKey.json');
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

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Extract puzzle ID and hint index from URL
    const { id, index } = req.query;
    const hintIndex = parseInt(index, 10);
    const difficulty = req.query.difficulty || 'normal';
    
    // Validate inputs
    if (!id || isNaN(hintIndex)) {
      return res.status(400).json({ error: 'Missing or invalid parameters' });
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
        
        // Check if hint exists at the requested index
        if (puzzleData.hints && puzzleData.hints[hintIndex]) {
          return res.status(200).json({ hint: puzzleData.hints[hintIndex] });
        } else {
          return res.status(404).json({ error: 'Hint not found' });
        }
      }
    }
    
    // If puzzle not found or Firebase not initialized, return not found
    return res.status(404).json({ error: 'Puzzle or hint not found' });
  } catch (error) {
    console.error('Error fetching hint:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch hint',
      message: error.message
    });
  }
};