import { db } from "./db";
import { sql } from "drizzle-orm";
import { generatePuzzles } from "./puzzle-generator-fixed";
import { storage } from "./storage";

async function initializeDatabase() {
  try {
    console.log("Starting database initialization...");
    
    // Push the schema to the database using drizzle-orm
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "puzzles" (
        "id" SERIAL PRIMARY KEY,
        "puzzle_number" INTEGER NOT NULL UNIQUE,
        "date" DATE NOT NULL,
        "emojis" TEXT[] NOT NULL,
        "answer" TEXT NOT NULL,
        "hints" TEXT[] NOT NULL
      );
    `);
    
    console.log("Database tables created successfully!");
    
    // Check if puzzles already exist
    const existingPuzzles = await db.execute(sql`SELECT COUNT(*) FROM puzzles`);
    const puzzleCount = parseInt(existingPuzzles.rows[0].count.toString());
    
    if (puzzleCount > 0) {
      console.log(`Database already has ${puzzleCount} puzzles.`);
      process.exit(0);
    }
    
    // Generate and insert 100 puzzles (using 100 instead of 1000 to speed up the process)
    console.log("Generating 100 puzzles...");
    const puzzles = generatePuzzles(100);
    console.log(`Generated ${puzzles.length} puzzles.`);
    
    // Insert puzzles into the database
    console.log("Inserting puzzles into the database...");
    const insertedPuzzles = await storage.bulkCreatePuzzles(puzzles);
    console.log(`Successfully inserted ${insertedPuzzles.length} puzzles into the database.`);
    
    console.log("Database initialization complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

// Run the initialization function
initializeDatabase();