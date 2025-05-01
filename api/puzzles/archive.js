// Vercel serverless function for /api/puzzles/archive
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
    // Get query params
    const limit = parseInt(req.query.limit) || 30;
    const difficulty = req.query.difficulty;
    
    // If Firebase is initialized, try to get archive puzzles
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      const puzzlesRef = db.collection('puzzles');
      
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Build query
      let query = puzzlesRef
        .where('date', '<', today)
        .orderBy('date', 'desc')
        .limit(limit);
      
      // Add difficulty filter if provided
      if (difficulty) {
        query = puzzlesRef
          .where('difficulty', '==', difficulty)
          .where('date', '<', today)
          .orderBy('date', 'desc')
          .limit(limit);
      }
      
      const snapshot = await query.get();
      
      if (!snapshot.empty) {
        // Convert snapshot to array of puzzle data
        const puzzles = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            puzzleNumber: data.puzzleNumber,
            date: data.date.toDate().toISOString(),
            emojis: data.emojis,
            answer: data.answer, // Include answers for archive view
            difficulty: data.difficulty,
            isFusionTwist: data.isFusionTwist || false,
            twistType: data.twistType || null
          };
        });
        
        return res.status(200).json(puzzles);
      }
    }
    
    // Return empty array if no puzzles found or Firebase is not initialized
    return res.status(200).json([]);
  } catch (error) {
    console.error('Error fetching puzzle archive:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch puzzle archive',
      message: error.message
    });
  }
};