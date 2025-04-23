/**
 * Fusdle Puzzle Generator for 90 days
 * This script generates puzzles for 90 days starting from April 21, 2025
 * Ensuring:
 * - Every day has 1 normal puzzle and 1 hard puzzle
 * - Fusion twist puzzles appear twice every 7 days
 */

import { addDays, format, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { createOrderedEmojis } from '../server/ordered-emoji-generator';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const puzzlesCollection = collection(db, 'puzzles');

// Set starting puzzle number - we'll determine this from the database
let nextPuzzleNumber = 1;

// Set start and end dates (90 days from April 21, 2025)
const START_DATE = new Date('2025-04-21T00:00:00.000Z');
const DAYS_TO_GENERATE = 90;
const END_DATE = addDays(START_DATE, DAYS_TO_GENERATE - 1);

// Configure time zone offset to match 4:00 AM UTC-4
const TIME_ZONE_OFFSET = 4; // UTC-4 (Eastern Daylight Time)

// Helper function to get a random integer
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get an ISO date string at 4:00 AM UTC-4
function getDateStringAt4AM(date: Date): string {
  // Set to 4:00 AM in UTC-4, which is 8:00 AM UTC
  const dateAt4AM = setMilliseconds(setSeconds(setMinutes(setHours(date, 8), 0), 0), 0);
  return dateAt4AM.toISOString();
}

// Helper function to get random item from array without repetition
function getRandomUniqueItem<T>(items: T[], usedItems: Set<number>): [T, number] {
  if (usedItems.size >= items.length) {
    // Reset if all items have been used
    usedItems.clear();
  }
  
  let index: number;
  do {
    index = Math.floor(Math.random() * items.length);
  } while (usedItems.has(index));
  
  usedItems.add(index);
  return [items[index], index];
}

// Helper function to generate hints for a given answer
function generateHints(answer: string): string[] {
  const lowerAnswer = answer.toLowerCase();
  
  // Simple hint generation logic - could be made more sophisticated
  const hints = [
    `Starts with "${lowerAnswer.charAt(0)}"`,
    `Has ${lowerAnswer.split(' ').length} word(s)`,
    `Contains ${lowerAnswer.length} letters`
  ];
  
  return hints;
}

// Smaller content banks - enough for 90 days
const normalPuzzles = [
  { answer: "Sunlight", difficulty: "normal" },
  { answer: "Keyboard", difficulty: "normal" },
  { answer: "Bicycle", difficulty: "normal" },
  { answer: "Coffee Cup", difficulty: "normal" },
  { answer: "Window View", difficulty: "normal" },
  { answer: "Book Club", difficulty: "normal" },
  { answer: "Ocean Wave", difficulty: "normal" },
  { answer: "Guitar Solo", difficulty: "normal" },
  { answer: "Night Sky", difficulty: "normal" },
  { answer: "Raincoat", difficulty: "normal" },
  { answer: "Train Station", difficulty: "normal" },
  { answer: "Breakfast", difficulty: "normal" },
  { answer: "Headphones", difficulty: "normal" },
  { answer: "Garden Path", difficulty: "normal" },
  { answer: "Digital Camera", difficulty: "normal" },
  { answer: "Desk Lamp", difficulty: "normal" },
  { answer: "Board Game", difficulty: "normal" },
  { answer: "Cupcake", difficulty: "normal" },
  { answer: "Wallet", difficulty: "normal" },
  { answer: "Smartphone", difficulty: "normal" },
  { answer: "Shopping List", difficulty: "normal" },
  { answer: "Door Handle", difficulty: "normal" },
  { answer: "Running Shoes", difficulty: "normal" },
  { answer: "Paper Clip", difficulty: "normal" },
  { answer: "Tree Shade", difficulty: "normal" },
  { answer: "Sun Hat", difficulty: "normal" },
  { answer: "Ball Game", difficulty: "normal" },
  { answer: "Dance Floor", difficulty: "normal" },
  { answer: "Movie Time", difficulty: "normal" },
  { answer: "Backpack", difficulty: "normal" },
  { answer: "Sunshine", difficulty: "normal" },
  { answer: "Pencil Case", difficulty: "normal" },
  { answer: "Mail Box", difficulty: "normal" },
  { answer: "Lunch Break", difficulty: "normal" },
  { answer: "Gift Card", difficulty: "normal" },
  { answer: "Bus Stop", difficulty: "normal" },
  { answer: "Water Bottle", difficulty: "normal" },
  { answer: "Alarm Clock", difficulty: "normal" },
  { answer: "Toothbrush", difficulty: "normal" },
  { answer: "Wall Picture", difficulty: "normal" },
  { answer: "Time Travel", difficulty: "normal" },
  { answer: "Dog Walk", difficulty: "normal" },
  { answer: "Beach Day", difficulty: "normal" },
  { answer: "Snow Fall", difficulty: "normal" },
  { answer: "City Lights", difficulty: "normal" },
  { answer: "Apple Pie", difficulty: "normal" },
  { answer: "Key Chain", difficulty: "normal" },
  { answer: "Star Gaze", difficulty: "normal" },
  { answer: "Book Mark", difficulty: "normal" },
  { answer: "Map Search", difficulty: "normal" },
  { answer: "Bird Song", difficulty: "normal" },
  { answer: "Fish Bowl", difficulty: "normal" },
  { answer: "Home Office", difficulty: "normal" },
  { answer: "Cat Nap", difficulty: "normal" },
  { answer: "Voice Mail", difficulty: "normal" },
  { answer: "Wind Chime", difficulty: "normal" },
  { answer: "Tea Time", difficulty: "normal" },
  { answer: "Bike Ride", difficulty: "normal" },
  { answer: "Hand Shake", difficulty: "normal" },
  { answer: "Road Trip", difficulty: "normal" },
  { answer: "Day Dream", difficulty: "normal" },
  { answer: "Bell Ring", difficulty: "normal" },
  { answer: "Hair Cut", difficulty: "normal" },
  { answer: "Pool Party", difficulty: "normal" },
  { answer: "Bread Loaf", difficulty: "normal" },
  { answer: "Cool Breeze", difficulty: "normal" },
  { answer: "Farm House", difficulty: "normal" },
  { answer: "Fresh Start", difficulty: "normal" },
  { answer: "Game Night", difficulty: "normal" },
  { answer: "Hand Wash", difficulty: "normal" },
  { answer: "Ice Cream", difficulty: "normal" },
  { answer: "Juice Box", difficulty: "normal" },
  { answer: "Kitchen Sink", difficulty: "normal" },
  { answer: "Laptop Case", difficulty: "normal" },
  { answer: "Morning Walk", difficulty: "normal" },
  { answer: "New Shoes", difficulty: "normal" },
  { answer: "Old Books", difficulty: "normal" },
  { answer: "Park Bench", difficulty: "normal" },
  { answer: "Quick Lunch", difficulty: "normal" },
  { answer: "Rain Boots", difficulty: "normal" },
  { answer: "Smart Watch", difficulty: "normal" },
  { answer: "Table Lamp", difficulty: "normal" },
  { answer: "Umbrella Stand", difficulty: "normal" },
  { answer: "Video Call", difficulty: "normal" },
  { answer: "Warm Socks", difficulty: "normal" },
  { answer: "Yoga Mat", difficulty: "normal" },
  { answer: "Zoo Visit", difficulty: "normal" },
  { answer: "Art Class", difficulty: "normal" },
  { answer: "Bath Towel", difficulty: "normal" },
  { answer: "Clean Dish", difficulty: "normal" },
  { answer: "Desk Chair", difficulty: "normal" },
  { answer: "Evening News", difficulty: "normal" },
  { answer: "Food Truck", difficulty: "normal" }
];

const hardPuzzles = [
  { answer: "Quantum Physics", difficulty: "hard" },
  { answer: "Artificial Intelligence", difficulty: "hard" },
  { answer: "Molecular Gastronomy", difficulty: "hard" },
  { answer: "Constitutional Amendment", difficulty: "hard" },
  { answer: "Interstellar Nebula", difficulty: "hard" },
  { answer: "Archaeological Excavation", difficulty: "hard" },
  { answer: "Photosynthesis Process", difficulty: "hard" },
  { answer: "Neuroscience Research", difficulty: "hard" },
  { answer: "Cryptocurrency Exchange", difficulty: "hard" },
  { answer: "Renewable Energy Sources", difficulty: "hard" },
  { answer: "Biodiversity Conservation", difficulty: "hard" },
  { answer: "International Relations", difficulty: "hard" },
  { answer: "Statistical Analysis", difficulty: "hard" },
  { answer: "Philosophical Debate", difficulty: "hard" },
  { answer: "Machine Learning Algorithm", difficulty: "hard" },
  { answer: "Linguistic Anthropology", difficulty: "hard" },
  { answer: "Biochemical Reaction", difficulty: "hard" },
  { answer: "Cybersecurity Protocol", difficulty: "hard" },
  { answer: "Economic Forecasting", difficulty: "hard" },
  { answer: "Geopolitical Strategy", difficulty: "hard" },
  { answer: "Psychological Experiment", difficulty: "hard" },
  { answer: "Architectural Innovation", difficulty: "hard" },
  { answer: "Sustainable Development", difficulty: "hard" },
  { answer: "Theoretical Framework", difficulty: "hard" },
  { answer: "Historical Perspective", difficulty: "hard" },
  { answer: "Manufacturing Process", difficulty: "hard" },
  { answer: "Environmental Impact", difficulty: "hard" },
  { answer: "Educational Reform", difficulty: "hard" },
  { answer: "Virtual Reality Experience", difficulty: "hard" },
  { answer: "Global Pandemic Response", difficulty: "hard" },
  { answer: "Legal Jurisprudence", difficulty: "hard" },
  { answer: "Critical Infrastructure", difficulty: "hard" },
  { answer: "Financial Investment", difficulty: "hard" },
  { answer: "Evolutionary Biology", difficulty: "hard" },
  { answer: "Diplomatic Relations", difficulty: "hard" },
  { answer: "Digital Transformation", difficulty: "hard" },
  { answer: "Ethical Consideration", difficulty: "hard" },
  { answer: "Cognitive Development", difficulty: "hard" },
  { answer: "Geological Formation", difficulty: "hard" },
  { answer: "Agricultural Innovation", difficulty: "hard" },
  { answer: "Mechanical Engineering", difficulty: "hard" },
  { answer: "Cultural Anthropology", difficulty: "hard" },
  { answer: "Mathematical Equation", difficulty: "hard" },
  { answer: "Political Campaign", difficulty: "hard" },
  { answer: "Industrial Revolution", difficulty: "hard" },
  { answer: "Astronomical Observation", difficulty: "hard" },
  { answer: "Behavioral Economics", difficulty: "hard" },
  { answer: "Pharmaceutical Research", difficulty: "hard" },
  { answer: "Meteorological Forecast", difficulty: "hard" },
  { answer: "Transportation Infrastructure", difficulty: "hard" },
  { answer: "Sociological Perspective", difficulty: "hard" },
  { answer: "Technological Innovation", difficulty: "hard" },
  { answer: "Corporate Strategy", difficulty: "hard" },
  { answer: "Creative Expression", difficulty: "hard" },
  { answer: "Scientific Method", difficulty: "hard" },
  { answer: "Healthcare Management", difficulty: "hard" },
  { answer: "Athletic Performance", difficulty: "hard" },
  { answer: "Nutritional Guidelines", difficulty: "hard" },
  { answer: "Theatrical Production", difficulty: "hard" },
  { answer: "Commercial Transaction", difficulty: "hard" },
  { answer: "Musical Composition", difficulty: "hard" },
  { answer: "Historical Documentation", difficulty: "hard" },
  { answer: "Geographical Exploration", difficulty: "hard" },
  { answer: "International Diplomacy", difficulty: "hard" },
  { answer: "Psychological Assessment", difficulty: "hard" },
  { answer: "Mechanical Automation", difficulty: "hard" },
  { answer: "Electronic Communication", difficulty: "hard" },
  { answer: "Educational Curriculum", difficulty: "hard" },
  { answer: "Medical Diagnosis", difficulty: "hard" },
  { answer: "Regulatory Compliance", difficulty: "hard" },
  { answer: "Cosmological Expansion", difficulty: "hard" },
  { answer: "Neurological Pathways", difficulty: "hard" }
];

const fusionPuzzles = [
  { 
    answer: "Brunch", 
    isFusionTwist: 1,
    twistType: "Word Fusion",
    hint: "breakfast + lunch" 
  },
  { 
    answer: "Spork", 
    isFusionTwist: 1,
    twistType: "Object Fusion",
    hint: "spoon + fork" 
  },
  { 
    answer: "Liger", 
    isFusionTwist: 1,
    twistType: "Animal Fusion",
    hint: "lion + tiger" 
  },
  { 
    answer: "Smog", 
    isFusionTwist: 1,
    twistType: "Environment Fusion",
    hint: "smoke + fog" 
  },
  { 
    answer: "Motel", 
    isFusionTwist: 1,
    twistType: "Building Fusion",
    hint: "motor + hotel" 
  },
  { 
    answer: "Podcast", 
    isFusionTwist: 1,
    twistType: "Media Fusion",
    hint: "iPod + broadcast" 
  },
  { 
    answer: "Dramedy", 
    isFusionTwist: 1,
    twistType: "Genre Fusion",
    hint: "drama + comedy" 
  },
  { 
    answer: "Cronut", 
    isFusionTwist: 1,
    twistType: "Food Fusion",
    hint: "croissant + donut" 
  },
  { 
    answer: "Chortle", 
    isFusionTwist: 1,
    twistType: "Sound Fusion",
    hint: "chuckle + snort" 
  },
  { 
    answer: "Sitcom", 
    isFusionTwist: 1,
    twistType: "TV Fusion",
    hint: "situation + comedy" 
  },
  { 
    answer: "Workaholic", 
    isFusionTwist: 1,
    twistType: "Behavior Fusion",
    hint: "work + alcoholic" 
  },
  { 
    answer: "Staycation", 
    isFusionTwist: 1,
    twistType: "Travel Fusion",
    hint: "stay + vacation" 
  },
  { 
    answer: "Mocktail", 
    isFusionTwist: 1,
    twistType: "Drink Fusion",
    hint: "mock + cocktail" 
  },
  { 
    answer: "Webinar", 
    isFusionTwist: 1,
    twistType: "Education Fusion",
    hint: "web + seminar" 
  },
  { 
    answer: "Cosplay", 
    isFusionTwist: 1,
    twistType: "Entertainment Fusion",
    hint: "costume + play" 
  },
  { 
    answer: "Biopic", 
    isFusionTwist: 1,
    twistType: "Movie Fusion",
    hint: "biographical + picture" 
  },
  { 
    answer: "Infomercial", 
    isFusionTwist: 1,
    twistType: "Advertising Fusion",
    hint: "information + commercial" 
  },
  { 
    answer: "Emoticon", 
    isFusionTwist: 1,
    twistType: "Digital Fusion",
    hint: "emotion + icon" 
  },
  { 
    answer: "Netiquette", 
    isFusionTwist: 1,
    twistType: "Internet Fusion",
    hint: "internet + etiquette" 
  },
  { 
    answer: "Glamping", 
    isFusionTwist: 1,
    twistType: "Lifestyle Fusion",
    hint: "glamorous + camping" 
  },
  { 
    answer: "Jeggings", 
    isFusionTwist: 1,
    twistType: "Fashion Fusion",
    hint: "jeans + leggings" 
  },
  { 
    answer: "Cyberpunk", 
    isFusionTwist: 1,
    twistType: "Culture Fusion",
    hint: "cybernetics + punk" 
  },
  { 
    answer: "Telemedicine", 
    isFusionTwist: 1,
    twistType: "Healthcare Fusion",
    hint: "telecommunications + medicine" 
  },
  { 
    answer: "Hangry", 
    isFusionTwist: 1,
    twistType: "Emotion Fusion",
    hint: "hungry + angry" 
  },
  { 
    answer: "Edutainment", 
    isFusionTwist: 1,
    twistType: "Content Fusion",
    hint: "education + entertainment" 
  },
  { 
    answer: "Frankenfood", 
    isFusionTwist: 1,
    twistType: "Cuisine Fusion",
    hint: "Frankenstein + food" 
  },
  { 
    answer: "Bromance", 
    isFusionTwist: 1,
    twistType: "Relationship Fusion",
    hint: "brother + romance" 
  },
  { 
    answer: "Frenemy", 
    isFusionTwist: 1,
    twistType: "Social Fusion",
    hint: "friend + enemy" 
  }
];

// Track used puzzles to avoid duplicates
const usedNormalIndexes = new Set<number>();
const usedHardIndexes = new Set<number>();
const usedFusionIndexes = new Set<number>();

// Function to find highest puzzle number
async function getStartingPuzzleNumber() {
  try {
    const latestPuzzlesQuery = query(
      puzzlesCollection,
      orderBy("puzzleNumber", "desc"),
      limit(1)
    );
    
    const latestPuzzlesSnapshot = await getDocs(latestPuzzlesQuery);
    
    if (!latestPuzzlesSnapshot.empty) {
      const latestPuzzle = latestPuzzlesSnapshot.docs[0].data();
      return latestPuzzle.puzzleNumber + 1;
    }
    
    return 1; // If no puzzles exist, start from 1
  } catch (error) {
    console.error("Error finding highest puzzle number:", error);
    return 1;
  }
}

// Generate an array of puzzles for the desired number of days
async function generatePuzzles() {
  // Get the current highest puzzle number
  nextPuzzleNumber = await getStartingPuzzleNumber();
  
  console.log(`Starting puzzle generation for ${DAYS_TO_GENERATE} days...`);
  console.log(`Starting from date: ${START_DATE.toISOString()}`);
  console.log(`Next puzzle number: ${nextPuzzleNumber}`);
  
  const allPuzzles = [];
  
  // Weekly distribution of fusion puzzles - every week will have 2 fusion puzzles
  for (let week = 0; week < Math.ceil(DAYS_TO_GENERATE / 7); week++) {
    // Select 2 random days in this week for fusion puzzles
    const fusionDays = new Set<number>();
    while (fusionDays.size < 2) {
      const randomDay = getRandomInt(0, 6);
      fusionDays.add(randomDay);
    }
    
    // Process each day in the week
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const currentDayIndex = week * 7 + dayOfWeek;
      if (currentDayIndex >= DAYS_TO_GENERATE) break;
      
      const currentDate = addDays(START_DATE, currentDayIndex);
      const dateString = getDateStringAt4AM(currentDate);
      
      // Create a normal puzzle for this day
      const [normalPuzzle, normalIndex] = getRandomUniqueItem(normalPuzzles, usedNormalIndexes);
      const normalEmojis = createOrderedEmojis(normalPuzzle.answer);
      const normalHints = generateHints(normalPuzzle.answer);
      const normalWordCount = normalPuzzle.answer.trim().split(/\s+/).length;
      
      const normalPuzzleObj = {
        puzzleNumber: nextPuzzleNumber++,
        date: dateString,
        difficulty: "normal",
        emojis: normalEmojis,
        answer: normalPuzzle.answer,
        hints: normalHints,
        isFusionTwist: 0,
        twistType: null,
        wordCount: normalWordCount
      };
      
      allPuzzles.push(normalPuzzleObj);
      console.log(`Created Normal puzzle for ${format(currentDate, 'yyyy-MM-dd')} (${normalPuzzle.answer})`);
      
      // Determine if this is a fusion day
      const isFusionDay = fusionDays.has(dayOfWeek);
      
      if (isFusionDay) {
        // Create a fusion puzzle on this day (for hard difficulty)
        const [fusionPuzzle, fusionIndex] = getRandomUniqueItem(fusionPuzzles, usedFusionIndexes);
        
        // Generate hints
        const hints = [
          fusionPuzzle.hint,
          `Fusion of words or concepts`,
          `Twist type: ${fusionPuzzle.twistType}`
        ];
        
        // Create emojis that logically match the answer
        const emojis = createOrderedEmojis(fusionPuzzle.answer);
        
        // Calculate word count
        const wordCount = fusionPuzzle.answer.trim().split(/\s+/).length;
        
        // Create fusion puzzle
        const fusionPuzzleObj = {
          puzzleNumber: nextPuzzleNumber++,
          date: dateString,
          difficulty: "hard", // Always make fusion puzzles the hard puzzle for that day
          emojis,
          answer: fusionPuzzle.answer,
          hints,
          isFusionTwist: 1,
          twistType: fusionPuzzle.twistType,
          wordCount
        };
        
        allPuzzles.push(fusionPuzzleObj);
        console.log(`Created Fusion Twist puzzle for ${format(currentDate, 'yyyy-MM-dd')} (${fusionPuzzle.answer})`);
      } else {
        // Create a regular hard puzzle for this day
        const [hardPuzzle, hardIndex] = getRandomUniqueItem(hardPuzzles, usedHardIndexes);
        const hardEmojis = createOrderedEmojis(hardPuzzle.answer);
        const hardHints = generateHints(hardPuzzle.answer);
        const hardWordCount = hardPuzzle.answer.trim().split(/\s+/).length;
        
        const hardPuzzleObj = {
          puzzleNumber: nextPuzzleNumber++,
          date: dateString,
          difficulty: "hard",
          emojis: hardEmojis,
          answer: hardPuzzle.answer,
          hints: hardHints,
          isFusionTwist: 0,
          twistType: null,
          wordCount: hardWordCount
        };
        
        allPuzzles.push(hardPuzzleObj);
        console.log(`Created Hard puzzle for ${format(currentDate, 'yyyy-MM-dd')} (${hardPuzzle.answer})`);
      }
    }
  }
  
  return allPuzzles;
}

// Function to upload puzzles to Firestore
async function uploadPuzzlesToFirestore(puzzles: any[]) {
  console.log(`Uploading ${puzzles.length} puzzles to Firestore...`);
  
  for (let i = 0; i < puzzles.length; i++) {
    const puzzle = puzzles[i];
    const docId = `puzzle_${puzzle.puzzleNumber}_${puzzle.difficulty}`;
    
    try {
      await setDoc(doc(puzzlesCollection, docId), {
        ...puzzle,
        date: new Date(puzzle.date) // Convert string to Firestore timestamp
      });
      
      if (i % 10 === 0) {
        console.log(`Uploaded ${i + 1}/${puzzles.length} puzzles...`);
      }
    } catch (error) {
      console.error(`Error uploading puzzle ${docId}:`, error);
    }
  }
  
  console.log('All puzzles uploaded successfully!');
}

// Main function to run the script
async function main() {
  try {
    console.log(`Starting Fusdle puzzle generator for 90 days from April 21, 2025...`);
    console.log(`Will generate puzzles from ${format(START_DATE, 'yyyy-MM-dd')} to ${format(END_DATE, 'yyyy-MM-dd')}`);
    console.log(`Total days to generate: ${DAYS_TO_GENERATE}`);
    
    // Ask if user wants to clear existing puzzles
    const args = process.argv.slice(2);
    let shouldClearExisting = false;
    
    if (args.includes('--clear') || args.includes('-c')) {
      shouldClearExisting = true;
      console.log('Will clear existing puzzles before generating new ones.');
    } else {
      console.log('Will append to existing puzzles. Use --clear or -c flag to clear existing puzzles.');
    }
    
    if (shouldClearExisting) {
      console.log('Clearing existing puzzles from Firestore...');
      const existingPuzzles = await getDocs(query(puzzlesCollection));
      
      const deletePromises = [];
      existingPuzzles.forEach((document) => {
        deletePromises.push(deleteDoc(doc(puzzlesCollection, document.id)));
      });
      
      await Promise.all(deletePromises);
      console.log(`Cleared ${existingPuzzles.size} existing puzzles.`);
    }
    
    // Generate new puzzles
    const puzzles = await generatePuzzles();
    
    // Upload to Firestore
    await uploadPuzzlesToFirestore(puzzles);
    
    console.log('Puzzle generation and upload complete!');
    console.log(`Generated ${puzzles.length} puzzles covering ${DAYS_TO_GENERATE} days.`);
    console.log(`Puzzle coverage: ${format(START_DATE, 'yyyy-MM-dd')} to ${format(END_DATE, 'yyyy-MM-dd')}`);
  } catch (error) {
    console.error('Error in puzzle generation:', error);
  }
}

// Run the script
main();