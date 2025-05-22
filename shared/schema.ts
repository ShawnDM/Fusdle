import { pgTable, text, serial, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table from original schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// New Puzzle table for Fusdle
export const puzzles = pgTable("puzzles", {
  id: serial("id").primaryKey(),
  puzzleNumber: integer("puzzle_number").notNull().unique(),
  date: date("date").notNull(),
  difficulty: text("difficulty").default("normal").notNull(),
  emojis: text("emojis").array().notNull(),
  answer: text("answer").notNull(),
  theme: text("theme").notNull(),
  hints: text("hints").array().notNull(),
  isFusionTwist: integer("is_fusion_twist").default(0).notNull(),
  twistType: text("twist_type")
});

export const insertPuzzleSchema = createInsertSchema(puzzles).omit(["id"]);

export type InsertPuzzle = z.infer<typeof insertPuzzleSchema>;
// Extended Puzzle type to include wordCount which is calculated at runtime
export type Puzzle = typeof puzzles.$inferSelect & {
  wordCount?: number;
};

// Define Zod schema for validating user guesses
export const guessSchema = z.object({
  guess: z.string().min(1, "Guess cannot be empty").max(100)
});

export type Guess = z.infer<typeof guessSchema>;
