import { generatePuzzles } from "../server/puzzle-generator-ordered";
import { createOrderedEmojis } from "../server/ordered-emoji-generator";

// Example answers to test with
const testAnswers = [
  "Morning Run",
  "Beach Vacation",
  "Mountain Hiking",
  "Rain Boots",
  "Space Travel",
  "Cloud Computing",
  "Tree House",
  "Music Festival",
  "Dream Catcher",
  "Game Night",
  "Sunglasses",
  "Fire Extinguisher",
  "Housekeeping",
  "Bookworm"
];

console.log("=== TESTING ORDERED EMOJI GENERATOR ===");
console.log("This script demonstrates how the emoji order now matches the word order in answers");
console.log("");

testAnswers.forEach(answer => {
  const emojis = createOrderedEmojis(answer);
  console.log(`Answer: "${answer}"`);
  console.log(`Emojis: ${emojis.join(" ")}`);
  console.log("");
});

console.log("=== GENERATING SAMPLE PUZZLES ===");
console.log("Generating 5 sample puzzles with ordered emojis:");
console.log("");

const samplePuzzles = generatePuzzles(5);
samplePuzzles.forEach((puzzle, index) => {
  console.log(`Puzzle #${index + 1}:`);
  console.log(`Answer: "${puzzle.answer}"`);
  console.log(`Emojis: ${puzzle.emojis.join(" ")}`);
  console.log(`Hints:`);
  puzzle.hints.forEach(hint => console.log(`  - ${hint}`));
  console.log("");
});