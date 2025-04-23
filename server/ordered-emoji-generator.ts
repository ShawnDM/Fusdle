
import { Configuration, OpenAIApi } from "openai";
import { InsertPuzzle } from "@shared/schema";

const emojiMap: { [key: string]: string[] } = {
  // Time related
  time: ["⌚", "⏰", "⏳", "🕐"],
  morning: ["🌅", "☀️", "🌄"],
  night: ["🌙", "🌚", "🌃"],
  
  // Nature
  nature: ["🌲", "🌺", "🌿", "🍃"],
  tree: ["🌳", "🌲", "🎄"],
  flower: ["🌸", "🌺", "🌹"],
  plant: ["🌱", "🪴", "🌿"],
  
  // Weather
  weather: ["☀️", "🌧️", "❄️", "⛈️"],
  sun: ["☀️", "🌞", "🌅"],
  rain: ["🌧️", "☔", "⛈️"],
  snow: ["❄️", "⛄", "🌨️"],
  
  // Animals
  animals: ["🐶", "🐱", "🐯", "🦁"],
  dog: ["🐕", "🐶", "🐩"],
  cat: ["🐱", "🐈", "😺"],
  bird: ["🐦", "🦜", "🦢"],
  
  // Food & Drink
  food: ["🍎", "🍕", "🍔", "🥗"],
  fruit: ["🍎", "🍌", "🍊"],
  drink: ["🥤", "☕", "🍺"],
  meal: ["🍽️", "🍴", "🥘"],
  
  // Activities
  activities: ["🏃", "🎮", "📚", "🎨"],
  sport: ["⚽", "🏀", "🎾"],
  game: ["🎮", "🎲", "🎯"],
  art: ["🎨", "🖼️", "🎭"],
  
  // Emotions
  emotions: ["😊", "😢", "😡", "🥰"],
  happy: ["😊", "😄", "🥳"],
  sad: ["😢", "😭", "🥺"],
  love: ["❤️", "💕", "💝"],
  
  // Objects
  objects: ["📱", "💻", "🎮", "📷"],
  tech: ["💻", "📱", "⌚"],
  book: ["📚", "📖", "📕"],
  music: ["🎵", "🎶", "🎼"],
  
  // Places
  places: ["🏠", "🏢", "🏫", "🏭"],
  home: ["🏠", "🏡", "🏘️"],
  office: ["🏢", "🏣", "🏪"],
  school: ["🏫", "🎓", "📚"],
  
  // Transportation
  transport: ["🚗", "✈️", "🚂", "🚢"],
  car: ["🚗", "🚙", "🚘"],
  plane: ["✈️", "🛩️", "🛫"],
  ship: ["🚢", "⛴️", "🛥️"],
  
  // Science & Tech
  science: ["🔬", "🧪", "🔭"],
  computer: ["💻", "🖥️", "⌨️"],
  phone: ["📱", "☎️", "📞"],
  
  // Work & Study
  work: ["💼", "👔", "💻"],
  study: ["📚", "✏️", "📝"],
  write: ["✍️", "📝", "🖊️"],
  
  // Abstract Concepts
  mind: ["🧠", "💭", "💡"],
  idea: ["💡", "✨", "💭"],
  dream: ["💭", "🌙", "✨"],
  power: ["💪", "⚡", "🔋"]
};

function getWordContext(word: string): string[] {
  const lowerWord = word.toLowerCase();
  let contexts: string[] = [];

  // Check word against our categories
  for (const [category, emojis] of Object.entries(emojiMap)) {
    if (lowerWord.includes(category)) {
      contexts.push(...emojis);
    }
  }

  // Specific word mappings for common terms
  const specificMappings: { [key: string]: string[] } = {
    brain: ["🧠", "💭"],
    smart: ["🧠", "💡"],
    digital: ["💻", "📱"],
    virtual: ["💻", "🌐"],
    cloud: ["☁️", "💭"],
    data: ["💾", "📊"],
    social: ["👥", "🤝"],
    network: ["🌐", "🔗"],
    security: ["🔒", "🛡️"],
    peace: ["🕊️", "☮️"],
    space: ["🚀", "🌠"],
    earth: ["🌍", "🌎"],
    market: ["🏪", "💹"],
    money: ["💰", "💵"],
    health: ["❤️", "🏥"],
    medical: ["⚕️", "💊"],
    education: ["📚", "🎓"],
    communication: ["💬", "📱"],
    green: ["🌿", "🌱"],
    eco: ["🌱", "♻️"],
    quantum: ["⚛️", "🔬"],
    artificial: ["🤖", "💻"],
    intelligence: ["🧠", "💡"]
  };

  // Check for specific word matches
  for (const [key, wordEmojis] of Object.entries(specificMappings)) {
    if (lowerWord.includes(key)) {
      contexts.push(...wordEmojis);
    }
  }

  return contexts.length > 0 ? contexts : ["🎯"]; // Changed fallback emoji to be more neutral
}

function analyzePhrase(phrase: string): string[] {
  const words = phrase.split(/\s+/);
  const allContexts: string[][] = words.map(word => getWordContext(word));
  
  // Select most relevant emoji for each word, prioritizing non-duplicate emojis
  const selectedEmojis: string[] = [];
  const usedEmojis = new Set<string>();
  
  allContexts.forEach(contexts => {
    // Try to find an unused emoji first
    let selectedEmoji = contexts.find(emoji => !usedEmojis.has(emoji));
    
    // If all emojis are used, just take the first one
    if (!selectedEmoji && contexts.length > 0) {
      selectedEmoji = contexts[0];
    }
    
    // If we found an emoji, add it
    if (selectedEmoji) {
      selectedEmojis.push(selectedEmoji);
      usedEmojis.add(selectedEmoji);
    } else {
      selectedEmojis.push("🎯"); // Use target emoji as fallback
    }
  });
  
  return selectedEmojis;
}

export function createOrderedEmojis(answer: string): string[] {
  return analyzePhrase(answer);
}

export function processPuzzlesWithOrderedEmojis(puzzles: InsertPuzzle[]): InsertPuzzle[] {
  return puzzles.map(puzzle => ({
    ...puzzle,
    emojis: createOrderedEmojis(puzzle.answer)
  }));
}
