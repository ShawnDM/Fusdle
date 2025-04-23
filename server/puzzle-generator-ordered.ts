import { InsertPuzzle } from "@shared/schema";
import { createOrderedEmojis, processPuzzlesWithOrderedEmojis } from "./ordered-emoji-generator";

// A collection of fusion word/phrase puzzles for the game
const fusionPuzzles: Array<{
  answer: string;
  hints: string[];
}> = [
  {
    answer: "Housekeeping",
    hints: [
      "A service that maintains cleanliness",
      "Found in hotels and private homes",
      "Combines where you live with what you do to maintain it"
    ]
  },
  {
    answer: "Bookworm",
    hints: [
      "Someone who loves reading",
      "Not actually related to reptiles",
      "A metaphorical creature that consumes literature"
    ]
  },
  {
    answer: "Apple pie",
    hints: [
      "A classic American dessert",
      "Made with fruit and pastry",
      "Often served with ice cream"
    ]
  },
  {
    answer: "Sunglasses",
    hints: [
      "Eye protection on bright days",
      "Fashion accessory for the beach",
      "Blocks UV rays from damaging your vision"
    ]
  },
  {
    answer: "Fire extinguisher",
    hints: [
      "Safety device for emergencies",
      "Sprays to stop flames",
      "Red canister found in buildings"
    ]
  },
  {
    answer: "Brainstorm",
    hints: [
      "A creative thinking session",
      "When ideas flow rapidly",
      "A mental weather phenomenon"
    ]
  },
  {
    answer: "Surfing",
    hints: [
      "Riding on ocean waves",
      "Popular beach sport",
      "Requires balance on a board"
    ]
  },
  {
    answer: "Butter toast",
    hints: [
      "Common breakfast item",
      "Spread on warm bread",
      "Crispy and savory morning food"
    ]
  },
  {
    answer: "Werewolf",
    hints: [
      "Mythical creature that transforms",
      "Affected by the full moon",
      "Human by day, animal by night"
    ]
  },
  {
    answer: "Tooth fairy",
    hints: [
      "Mythical being that visits children",
      "Collects dental remains",
      "Leaves money under pillows"
    ]
  },
  // Added some new descriptive answers that work well with ordered emojis
  {
    answer: "Morning run",
    hints: [
      "Exercise at dawn",
      "Start your day with cardio",
      "Jogging as the sun rises"
    ]
  },
  {
    answer: "Beach vacation",
    hints: [
      "Relaxing by the ocean",
      "Sand, sun, and waves",
      "Coastal holiday getaway"
    ]
  },
  {
    answer: "Mountain hiking",
    hints: [
      "Climbing elevated terrain",
      "Trail walking at altitude",
      "Outdoor adventure uphill"
    ]
  },
  {
    answer: "Rain boots",
    hints: [
      "Wet weather footwear",
      "Splash protection",
      "Puddle-proof shoes"
    ]
  },
  {
    answer: "Space travel",
    hints: [
      "Journey beyond Earth",
      "Astronaut adventures",
      "Rocket-powered voyages"
    ]
  }
];

// Add more puzzles to reach over 1000 total combinations
const additionalAnswers: Array<string> = [
  "Birthday cake", 
  "Digital mind",
  "Mobile home",
  "Time keeper",
  "Password protection",
  "Burger king",
  "Rainbow colors",
  "Drama call",
  "Board game",
  "Magic medicine",
  "Music box",
  "Singing shower",
  "Rocket science",
  "Love attraction",
  "Tiny musician",
  "Rock climbing",
  "Firefox browser",
  "Floating boat",
  "Food truck",
  "Robot gardener",
  "Night sky",
  "Water park",
  "Phone call",
  "Book club",
  "Dream catcher",
  "Star gazing",
  "Family dinner",
  "City lights",
  "Heart break",
  "Mind reader"
];

// Words to combine with emojis for more puzzles
const combineWords: string[] = [
  "time", "house", "city", "world", "water", 
  "light", "fire", "earth", "air", "space",
  "book", "phone", "car", "tree", "flower",
  "dog", "cat", "bird", "fish", "rabbit",
  "star", "moon", "sun", "cloud", "rain",
  "game", "music", "movie", "dream", "night",
  "day", "food", "drink", "love", "heart",
  "mind", "body", "soul", "life", "death",
  "work", "play", "art", "science", "magic",
  "king", "queen", "child", "parent", "friend"
];

// Create more hints for generated puzzles
function generateHints(answer: string): string[] {
  const parts = answer.split(' ');
  const firstWord = parts[0].toLowerCase();
  const secondWord = parts.length > 1 ? parts[1].toLowerCase() : '';
  
  const hints = [
    `A fusion of two concepts`,
    `Think about the connection between "${firstWord}" and "${secondWord}"`,
    `The answer has ${answer.length} characters in total`
  ];
  
  return hints;
}

// Generate a set of emoji combinations
function generateMorePuzzles(count: number): InsertPuzzle[] {
  const allPuzzles: InsertPuzzle[] = [];
  const baseDate = new Date('2025-04-22'); // Start date (tomorrow)
  
  // Add the pre-defined puzzles first
  fusionPuzzles.forEach((puzzle, index) => {
    const puzzleDate = new Date(baseDate);
    puzzleDate.setDate(baseDate.getDate() + index);
    const dateString = puzzleDate.toISOString().split('T')[0];
    
    // Generate ordered emojis for this puzzle
    const orderedEmojis = createOrderedEmojis(puzzle.answer);
    
    allPuzzles.push({
      puzzleNumber: index + 1,
      date: dateString,
      emojis: orderedEmojis,
      answer: puzzle.answer,
      hints: puzzle.hints
    });
  });
  
  // Generate additional puzzles from predefined answers
  let puzzleNumber = allPuzzles.length + 1;
  let dateCounter = allPuzzles.length;
  
  // Create puzzles from additionalAnswers array
  additionalAnswers.forEach((answer) => {
    // Skip if we've reached the desired count
    if (allPuzzles.length >= count) return;
    
    const puzzleDate = new Date(baseDate);
    puzzleDate.setDate(baseDate.getDate() + dateCounter);
    const dateString = puzzleDate.toISOString().split('T')[0];
    dateCounter++;
    
    const hints = generateHints(answer);
    const orderedEmojis = createOrderedEmojis(answer);
    
    allPuzzles.push({
      puzzleNumber,
      date: dateString,
      emojis: orderedEmojis,
      answer,
      hints
    });
    
    puzzleNumber++;
  });
  
  // Generate the remaining puzzles to reach the desired count
  while (allPuzzles.length < count) {
    const puzzleDate = new Date(baseDate);
    puzzleDate.setDate(baseDate.getDate() + dateCounter);
    const dateString = puzzleDate.toISOString().split('T')[0];
    dateCounter++;
    
    // Generate a compound answer
    const randomIndex1 = Math.floor(Math.random() * combineWords.length);
    const randomIndex2 = Math.floor(Math.random() * combineWords.length);
    
    // Ensure we don't get the same word twice
    const word1 = combineWords[randomIndex1];
    let word2 = combineWords[randomIndex2];
    if (word1 === word2) {
      word2 = combineWords[(randomIndex2 + 1) % combineWords.length];
    }
    
    // Capitalize first letters
    const capitalizedWord1 = word1.charAt(0).toUpperCase() + word1.slice(1);
    const capitalizedWord2 = word2.charAt(0).toUpperCase() + word2.slice(1);
    
    const answer = `${capitalizedWord1} ${capitalizedWord2}`;
    const hints = generateHints(answer);
    const orderedEmojis = createOrderedEmojis(answer);
    
    allPuzzles.push({
      puzzleNumber,
      date: dateString,
      emojis: orderedEmojis,
      answer,
      hints
    });
    
    puzzleNumber++;
  }
  
  return allPuzzles;
}

/**
 * Generates puzzles with emojis ordered to match the answer structure
 * @param count The number of puzzles to generate
 * @returns An array of puzzles with properly ordered emojis
 */
export function generatePuzzles(count: number = 1000): InsertPuzzle[] {
  return generateMorePuzzles(count);
}