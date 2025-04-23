import { users, type User, type InsertUser, puzzles, type Puzzle, type InsertPuzzle } from "@shared/schema";
import { db } from "./db";
import { eq, desc, lte, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Puzzle related methods
  getPuzzleByDate(date: string): Promise<Puzzle | undefined>;
  getPuzzleById(id: number): Promise<Puzzle | undefined>;
  getPuzzleArchive(limit?: number): Promise<Puzzle[]>;
  createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle>;
  bulkCreatePuzzles(puzzlesList: InsertPuzzle[]): Promise<Puzzle[]>;
  getTodaysPuzzle(): Promise<Puzzle | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getPuzzleByDate(date: string): Promise<Puzzle | undefined> {
    // Convert string date to Date object for comparison
    const queryDate = new Date(date);
    // Format date parts to match postgres format 'YYYY-MM-DD'
    const formattedDate = queryDate.toISOString().split('T')[0];
    
    const [puzzle] = await db
      .select()
      .from(puzzles)
      .where(eq(puzzles.date, formattedDate));
    
    return puzzle;
  }

  async getTodaysPuzzle(): Promise<Puzzle | undefined> {
    // Get today's date in EST timezone
    const today = new Date();
    const estOptions = { timeZone: 'America/New_York' };
    const estDateStr = today.toLocaleDateString('en-US', estOptions);
    const estDate = new Date(estDateStr);
    const formattedDate = estDate.toISOString().split('T')[0];
    
    // Try to get puzzle for today
    const todaysPuzzle = await this.getPuzzleByDate(formattedDate);
    
    if (todaysPuzzle) {
      return todaysPuzzle;
    }
    
    // If no puzzle is found for today, get the earliest available puzzle
    // This is useful for testing or when the system is first set up
    const [earliestPuzzle] = await db
      .select()
      .from(puzzles)
      .orderBy(asc(puzzles.date))
      .limit(1);
    
    console.log("No puzzle found for today, using earliest available puzzle:", earliestPuzzle);
    return earliestPuzzle;
  }

  async getPuzzleById(id: number): Promise<Puzzle | undefined> {
    const [puzzle] = await db
      .select()
      .from(puzzles)
      .where(eq(puzzles.id, id));
    
    return puzzle;
  }

  async getPuzzleArchive(limitCount = 30): Promise<Puzzle[]> {
    // Get today's date in EST timezone
    const today = new Date();
    const estOptions = { timeZone: 'America/New_York' };
    const estDateStr = today.toLocaleDateString('en-US', estOptions);
    const estDate = new Date(estDateStr);
    const formattedDate = estDate.toISOString().split('T')[0];
    
    // Only get puzzles with dates < today (not including today)
    // This ensures only past puzzles are shown
    const yesterdayDate = new Date(estDate);
    yesterdayDate.setDate(estDate.getDate() - 1);
    const yesterdayFormatted = yesterdayDate.toISOString().split('T')[0];
    
    return await db
      .select()
      .from(puzzles)
      .where(lte(puzzles.date, yesterdayFormatted))
      .orderBy(desc(puzzles.date))
      .limit(limitCount);
  }
  
  async createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle> {
    const [newPuzzle] = await db
      .insert(puzzles)
      .values(puzzle)
      .returning();
    
    return newPuzzle;
  }
  
  async bulkCreatePuzzles(puzzlesList: InsertPuzzle[]): Promise<Puzzle[]> {
    if (puzzlesList.length === 0) {
      return [];
    }
    
    const newPuzzles = await db
      .insert(puzzles)
      .values(puzzlesList)
      .returning();
    
    return newPuzzles;
  }
}

export const storage = new DatabaseStorage();
