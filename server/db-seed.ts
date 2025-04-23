import { db } from "./db";
import { generatePuzzles } from "./puzzle-generator";
import { storage } from "./storage";

async function seedDatabase() {
  try {
    console.log("Starting database seeding process...");
    
    // Generate 1000 puzzles
    console.log("Generating 1000 puzzles...");
    const puzzles = generatePuzzles(1000);
    console.log(`Generated ${puzzles.length} puzzles.`);
    
    // Insert puzzles into the database
    console.log("Inserting puzzles into the database...");
    const insertedPuzzles = await storage.bulkCreatePuzzles(puzzles);
    console.log(`Successfully inserted ${insertedPuzzles.length} puzzles into the database.`);
    
    // Get today's puzzle to verify
    const today = new Date().toISOString().split('T')[0];
    console.log(`Verifying today's puzzle (${today})...`);
    const todaysPuzzle = await storage.getTodaysPuzzle();
    
    if (todaysPuzzle) {
      console.log("Today's puzzle found!");
      console.log(`Puzzle #${todaysPuzzle.puzzleNumber} for ${todaysPuzzle.date}`);
      console.log(`Emojis: ${todaysPuzzle.emojis.join('')}`);
    } else {
      console.log("No puzzle found for today. Check your date setup.");
    }
    
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase().then(() => {
  console.log("Seeding process finished.");
  process.exit(0);
});