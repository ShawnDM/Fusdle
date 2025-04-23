import { Router } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { guessSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { generatePuzzles } from "./puzzle-generator-fixed";
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = Router();
  
  // Get today's puzzle
  apiRouter.get("/api/puzzles/today", async (req, res) => {
    try {
      const puzzle = await storage.getTodaysPuzzle();
      
      if (!puzzle) {
        return res.status(404).json({ message: "No puzzle available for today" });
      }
      
      // Return only the necessary information, not the answer
      res.json({
        id: puzzle.id,
        puzzleNumber: puzzle.puzzleNumber,
        date: puzzle.date,
        emojis: puzzle.emojis
      });
    } catch (error) {
      console.error("Error getting today's puzzle:", error);
      res.status(500).json({ message: "Failed to retrieve today's puzzle" });
    }
  });
  
  // Verify a guess for a puzzle
  apiRouter.post("/api/puzzles/:id/guess", async (req, res) => {
    try {
      const { id } = req.params;
      const puzzleId = parseInt(id);
      
      if (isNaN(puzzleId)) {
        return res.status(400).json({ message: "Invalid puzzle ID" });
      }
      
      const puzzle = await storage.getPuzzleById(puzzleId);
      
      if (!puzzle) {
        return res.status(404).json({ message: "Puzzle not found" });
      }
      
      // Validate the guess
      const validatedData = guessSchema.parse(req.body);
      const userGuess = validatedData.guess.trim().toLowerCase();
      const correctAnswer = puzzle.answer.toLowerCase();
      
      // Check if the guess is correct
      const isCorrect = userGuess === correctAnswer;
      
      if (isCorrect) {
        return res.json({ isCorrect: true, answer: puzzle.answer });
      } else {
        return res.json({ isCorrect: false });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error validating guess:", error);
      res.status(500).json({ message: "An error occurred while validating your guess" });
    }
  });
  
  // Get hints for a puzzle
  apiRouter.get("/api/puzzles/:id/hints/:hintIndex", async (req, res) => {
    try {
      const { id, hintIndex } = req.params;
      const puzzleId = parseInt(id);
      const index = parseInt(hintIndex);
      
      if (isNaN(puzzleId) || isNaN(index)) {
        return res.status(400).json({ message: "Invalid puzzle ID or hint index" });
      }
      
      const puzzle = await storage.getPuzzleById(puzzleId);
      
      if (!puzzle) {
        return res.status(404).json({ message: "Puzzle not found" });
      }
      
      if (index < 0 || index >= puzzle.hints.length) {
        return res.status(400).json({ message: "Hint index out of range" });
      }
      
      res.json({ hint: puzzle.hints[index] });
    } catch (error) {
      console.error("Error getting hint:", error);
      res.status(500).json({ message: "Failed to retrieve hint" });
    }
  });
  
  // Get archive of puzzles
  apiRouter.get("/api/puzzles/archive", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const puzzles = await storage.getPuzzleArchive(limit);
      
      // Return puzzles with their answers for archive view
      res.json(puzzles.map(puzzle => ({
        id: puzzle.id,
        puzzleNumber: puzzle.puzzleNumber,
        date: puzzle.date,
        emojis: puzzle.emojis,
        answer: puzzle.answer
      })));
    } catch (error) {
      console.error("Error getting puzzle archive:", error);
      res.status(500).json({ message: "Failed to retrieve puzzle archive" });
    }
  });
  
  // Get the answer for a puzzle
  // Modified to provide answers for today's puzzle after failed attempts
  apiRouter.get("/api/puzzles/:id/answer", async (req, res) => {
    try {
      const { id } = req.params;
      const puzzleId = parseInt(id);
      const revealAnswer = req.query.revealAnswer === 'true';
      
      if (isNaN(puzzleId)) {
        return res.status(400).json({ message: "Invalid puzzle ID" });
      }
      
      const puzzle = await storage.getPuzzleById(puzzleId);
      
      if (!puzzle) {
        return res.status(404).json({ message: "Puzzle not found" });
      }
      
      // If revealAnswer query param is true, we're allowing the user to see the answer
      // This will be used after max attempts are used
      if (revealAnswer) {
        return res.json({ answer: puzzle.answer });
      }
      
      // Check if this puzzle is from the past (to prevent cheating on today's puzzle)
      const puzzleDate = new Date(puzzle.date);
      
      // Get today's date in EST timezone
      const today = new Date();
      const estOptions = { timeZone: 'America/New_York' };
      const estDateStr = today.toLocaleDateString('en-US', estOptions);
      const estDate = new Date(estDateStr);
      
      if (puzzleDate >= estDate) {
        return res.status(403).json({ message: "Cannot view answer for today's or future puzzles" });
      }
      
      res.json({ answer: puzzle.answer });
    } catch (error) {
      console.error("Error getting puzzle answer:", error);
      res.status(500).json({ message: "Failed to retrieve puzzle answer" });
    }
  });
  
  // Database initialization and seeding endpoint
  apiRouter.post("/api/admin/init-db", async (req, res) => {
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
        return res.json({ 
          success: true, 
          message: `Database initialized. ${puzzleCount} puzzles already exist.` 
        });
      }
      
      // Generate and insert 1000 puzzles
      console.log("Generating 1000 puzzles...");
      const puzzles = generatePuzzles(1000);
      console.log(`Generated ${puzzles.length} puzzles.`);
      
      // Insert puzzles into the database
      console.log("Inserting puzzles into the database...");
      const insertedPuzzles = await storage.bulkCreatePuzzles(puzzles);
      console.log(`Successfully inserted ${insertedPuzzles.length} puzzles into the database.`);
      
      res.json({ 
        success: true, 
        message: `Database initialized and seeded with ${insertedPuzzles.length} puzzles.` 
      });
    } catch (error) {
      console.error("Error initializing database:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to initialize database", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.use(apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
