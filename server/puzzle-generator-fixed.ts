import { InsertPuzzle } from "@shared/schema";

// A collection of fusion word/phrase puzzles for the game
const fusionPuzzles: Array<{
  emojis: string[];
  answer: string;
  hints: string[];
}> = [
  {
    emojis: ["🏡", "🧹"],
    answer: "Housekeeping",
    hints: [
      "A service that maintains cleanliness",
      "Found in hotels and private homes",
      "Combines where you live with what you do to maintain it"
    ]
  },
  {
    emojis: ["🐍", "📚"],
    answer: "Bookworm",
    hints: [
      "Someone who loves reading",
      "Not actually related to reptiles",
      "A metaphorical creature that consumes literature"
    ]
  },
  {
    emojis: ["🍎", "🥧"],
    answer: "Apple pie",
    hints: [
      "A classic American dessert",
      "Made with fruit and pastry",
      "Often served with ice cream"
    ]
  },
  {
    emojis: ["☀️", "🕶️"],
    answer: "Sunglasses",
    hints: [
      "Eye protection on bright days",
      "Fashion accessory for the beach",
      "Blocks UV rays from damaging your vision"
    ]
  },
  {
    emojis: ["🔥", "🧯"],
    answer: "Fire extinguisher",
    hints: [
      "Safety device for emergencies",
      "Sprays to stop flames",
      "Red canister found in buildings"
    ]
  },
  {
    emojis: ["🧠", "💨"],
    answer: "Brainstorm",
    hints: [
      "A creative thinking session",
      "When ideas flow rapidly",
      "A mental weather phenomenon"
    ]
  },
  {
    emojis: ["🌊", "🏄"],
    answer: "Surfing",
    hints: [
      "Riding on ocean waves",
      "Popular beach sport",
      "Requires balance on a board"
    ]
  },
  {
    emojis: ["🧈", "🍞"],
    answer: "Butter toast",
    hints: [
      "Common breakfast item",
      "Spread on warm bread",
      "Crispy and savory morning food"
    ]
  },
  {
    emojis: ["🌙", "🐺"],
    answer: "Werewolf",
    hints: [
      "Mythical creature that transforms",
      "Affected by the full moon",
      "Human by day, animal by night"
    ]
  },
  {
    emojis: ["🦷", "🧚"],
    answer: "Tooth fairy",
    hints: [
      "Mythical being that visits children",
      "Collects dental remains",
      "Leaves money under pillows"
    ]
  }
];

// Add more puzzles to reach over 1000 total combinations
const additionalEmojis: Array<[string, string]> = [
  ["🎂", "🐶"], // Cake dog / Birthday pup
  ["📱", "🧠"], // Smartphone brain / Digital mind
  ["🚗", "🏠"], // Car house / Mobile home
  ["⌚", "👁️"], // Watch eye / Timekeeper
  ["🔑", "💻"], // Key computer / Password
  ["🍔", "👑"], // Burger king
  ["🌈", "🧔"], // Rainbow beard / Color whiskers
  ["🎭", "📱"], // Theater phone / Drama call
  ["🎲", "🎮"], // Dice game / Board video
  ["🧙", "💊"], // Wizard pill / Magic medicine
  ["🎵", "📦"], // Music box
  ["🎤", "🚿"], // Microphone shower / Singing bath
  ["🚀", "🧠"], // Rocket brain / Launch thinking
  ["🧲", "💖"], // Magnet heart / Attraction love
  ["🎻", "🐜"], // Violin ant / Tiny musician
  ["🗿", "👟"], // Stone shoe / Rock sneaker
  ["🦊", "🔥"], // Fox fire / Firefox
  ["🎈", "🐢"], // Balloon turtle / Floating shell
  ["🌮", "🚗"], // Taco car / Food truck
  ["🤖", "🌱"], // Robot plant / Mechanical growth
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
    `A fusion of two common concepts`,
    `Think about the combination of "${firstWord}" and "${secondWord}"`,
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
    
    allPuzzles.push({
      puzzleNumber: index + 1,
      date: dateString,
      emojis: puzzle.emojis,
      answer: puzzle.answer,
      hints: puzzle.hints
    });
  });
  
  // Generate additional puzzles from combinations
  let puzzleNumber = allPuzzles.length + 1;
  let dateCounter = allPuzzles.length;
  
  // Create puzzles from additionalEmojis array
  additionalEmojis.forEach(([emoji1, emoji2]) => {
    // Skip if we've reached the desired count
    if (allPuzzles.length >= count) return;
    
    const puzzleDate = new Date(baseDate);
    puzzleDate.setDate(baseDate.getDate() + dateCounter);
    const dateString = puzzleDate.toISOString().split('T')[0];
    dateCounter++;
    
    // Generate a compound answer by combining words
    const randomIndex1 = Math.floor(Math.random() * combineWords.length);
    const randomIndex2 = Math.floor(Math.random() * combineWords.length);
    
    // Ensure we don't get the same word twice
    const word1 = combineWords[randomIndex1];
    let word2 = combineWords[randomIndex2];
    if (word1 === word2) {
      word2 = combineWords[(randomIndex2 + 1) % combineWords.length];
    }
    
    const answer = `${word1} ${word2}`;
    const hints = generateHints(answer);
    
    allPuzzles.push({
      puzzleNumber,
      date: dateString,
      emojis: [emoji1, emoji2],
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
    
    // Pick two random emojis from a broader set
    const emojiSet = "🎂🐶📱🧠🚗🏠⌚👁️🔑💻🍔👑🌈🧔🎭📱🎲🎮🧙💊🎵📦🎤🚿🚀🧲💖🎻🐜🗿👟🦊🔥🎈🐢🌮🤖🌱☀️🕶️🔥🧯🧠💨🌊🏄🧈🍞🌙🐺🦷🧚".split('');
    
    const randomEmojiIndex1 = Math.floor(Math.random() * emojiSet.length);
    let randomEmojiIndex2 = Math.floor(Math.random() * emojiSet.length);
    // Ensure we don't get the same emoji twice
    while (randomEmojiIndex1 === randomEmojiIndex2) {
      randomEmojiIndex2 = Math.floor(Math.random() * emojiSet.length);
    }
    
    const emoji1 = emojiSet[randomEmojiIndex1];
    const emoji2 = emojiSet[randomEmojiIndex2];
    
    // Generate a compound answer
    const randomIndex1 = Math.floor(Math.random() * combineWords.length);
    const randomIndex2 = Math.floor(Math.random() * combineWords.length);
    
    // Ensure we don't get the same word twice
    const word1 = combineWords[randomIndex1];
    let word2 = combineWords[randomIndex2];
    if (word1 === word2) {
      word2 = combineWords[(randomIndex2 + 1) % combineWords.length];
    }
    
    const answer = `${word1} ${word2}`;
    const hints = generateHints(answer);
    
    allPuzzles.push({
      puzzleNumber,
      date: dateString,
      emojis: [emoji1, emoji2],
      answer,
      hints
    });
    
    puzzleNumber++;
  }
  
  return allPuzzles;
}

export function generatePuzzles(count: number = 1000): InsertPuzzle[] {
  return generateMorePuzzles(count);
}