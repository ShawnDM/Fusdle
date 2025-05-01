// Vercel serverless function for /api/puzzles/today
const admin = require('firebase-admin');
let serviceAccount;

try {
  // Try to load the service account key from the environment
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    try {
      // Fallback to the file if running locally
      serviceAccount = require('../../serviceAccountKey.json');
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
    // Extract the difficulty from the query params, default to normal
    const difficulty = req.query.difficulty || 'normal';
    
    // If Firebase is initialized, try to get today's puzzle
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Query for today's puzzle with the requested difficulty
      const puzzlesRef = db.collection('puzzles');
      const snapshot = await puzzlesRef
        .where('difficulty', '==', difficulty)
        .where('date', '>=', new Date(todayStr))
        .where('date', '<', new Date(new Date(todayStr).getTime() + 24*60*60*1000))
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        // Get the puzzle data
        const puzzleDoc = snapshot.docs[0];
        const puzzleData = puzzleDoc.data();
        
        // Create a safe version without the answer
        const safePuzzle = {
          id: puzzleDoc.id,
          puzzleNumber: puzzleData.puzzleNumber,
          date: puzzleData.date.toDate().toISOString(),
          emojis: puzzleData.emojis,
          difficulty: puzzleData.difficulty,
          isFusionTwist: puzzleData.isFusionTwist || false,
          twistType: puzzleData.twistType || null
        };
        
        return res.status(200).json(safePuzzle);
      }
    }
    
    // If we couldn't find a puzzle or Firebase isn't initialized, return empty data
    return res.status(200).json({ 
      message: "No puzzle available. Please make sure Firebase service account is configured."
    });
  } catch (error) {
    console.error('Error fetching today puzzle:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch puzzle',
      message: error.message
    });
  }
};