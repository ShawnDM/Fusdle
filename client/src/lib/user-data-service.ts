import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

interface UserStats {
  puzzlesSolved: number;
  currentStreak: number;
  maxStreak: number;
  totalAttempts: number;
  solvedPuzzles: string[]; // Array of puzzle IDs
  lastPlayedDate: string;
  flawlessStreak: number;
  hintsUsed: number;
}

interface GameSession {
  puzzleId: string;
  attempts: string[];
  solved: boolean;
  usedHints: boolean;
  solvedAt?: string;
}

class UserDataService {
  private auth = getAuth();

  // Get current user's stats
  async getUserStats(): Promise<UserStats> {
    const user = this.auth.currentUser;
    
    if (user) {
      // Logged in user - get from Firestore
      try {
        const userDocRef = doc(db, "userStats", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          return userDoc.data() as UserStats;
        } else {
          // Initialize new user stats
          const defaultStats: UserStats = {
            puzzlesSolved: 0,
            currentStreak: 0,
            maxStreak: 0,
            totalAttempts: 0,
            solvedPuzzles: [],
            lastPlayedDate: "",
            flawlessStreak: 0,
            hintsUsed: 0
          };
          await setDoc(userDocRef, defaultStats);
          return defaultStats;
        }
      } catch (error) {
        console.error("Error fetching user stats from Firestore:", error);
        return this.getLocalStats();
      }
    } else {
      // Anonymous user - get from localStorage
      return this.getLocalStats();
    }
  }

  // Save user stats
  async saveUserStats(stats: UserStats): Promise<void> {
    const user = this.auth.currentUser;
    
    if (user) {
      // Logged in user - save to Firestore
      try {
        const userDocRef = doc(db, "userStats", user.uid);
        await setDoc(userDocRef, stats, { merge: true });
      } catch (error) {
        console.error("Error saving user stats to Firestore:", error);
        // Fallback to localStorage
        this.saveLocalStats(stats);
      }
    } else {
      // Anonymous user - save to localStorage
      this.saveLocalStats(stats);
    }
  }

  // Update stats after completing a puzzle
  async updateStatsAfterPuzzle(session: GameSession): Promise<void> {
    const stats = await this.getUserStats();
    const today = new Date().toISOString().split('T')[0];
    
    if (session.solved) {
      // Only count if not already solved
      if (!stats.solvedPuzzles.includes(session.puzzleId)) {
        stats.puzzlesSolved++;
        stats.solvedPuzzles.push(session.puzzleId);
        
        // Update streak
        if (stats.lastPlayedDate === this.getPreviousDay(today)) {
          stats.currentStreak++;
        } else if (stats.lastPlayedDate !== today) {
          stats.currentStreak = 1;
        }
        
        // Update max streak
        if (stats.currentStreak > stats.maxStreak) {
          stats.maxStreak = stats.currentStreak;
        }
        
        // Update flawless streak
        if (!session.usedHints) {
          stats.flawlessStreak++;
        } else {
          stats.flawlessStreak = 0;
        }
        
        stats.lastPlayedDate = today;
      }
    }
    
    stats.totalAttempts += session.attempts.length;
    if (session.usedHints) {
      stats.hintsUsed++;
    }
    
    await this.saveUserStats(stats);
  }

  // Get game session for a puzzle
  getGameSession(puzzleId: string): GameSession | null {
    const user = this.auth.currentUser;
    const key = user ? `gameSession_${user.uid}_${puzzleId}` : `gameSession_${puzzleId}`;
    
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }

  // Save game session
  saveGameSession(puzzleId: string, session: GameSession): void {
    const user = this.auth.currentUser;
    const key = user ? `gameSession_${user.uid}_${puzzleId}` : `gameSession_${puzzleId}`;
    
    localStorage.setItem(key, JSON.stringify(session));
  }

  // Check if puzzle is completed
  async isPuzzleCompleted(puzzleId: string): Promise<boolean> {
    const stats = await this.getUserStats();
    return stats.solvedPuzzles.includes(puzzleId);
  }

  // Migrate local data to Firebase when user logs in
  async migrateLocalDataToFirebase(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    // Get local stats
    const localStats = this.getLocalStats();
    
    // Get Firebase stats
    const userDocRef = doc(db, "userStats", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // No Firebase data exists, migrate everything
      await setDoc(userDocRef, localStats);
    } else {
      // Merge data (keep the higher values)
      const firebaseStats = userDoc.data() as UserStats;
      const mergedStats: UserStats = {
        puzzlesSolved: Math.max(localStats.puzzlesSolved, firebaseStats.puzzlesSolved),
        currentStreak: Math.max(localStats.currentStreak, firebaseStats.currentStreak),
        maxStreak: Math.max(localStats.maxStreak, firebaseStats.maxStreak),
        totalAttempts: localStats.totalAttempts + firebaseStats.totalAttempts,
        solvedPuzzles: Array.from(new Set([...localStats.solvedPuzzles, ...firebaseStats.solvedPuzzles])),
        lastPlayedDate: localStats.lastPlayedDate > firebaseStats.lastPlayedDate ? localStats.lastPlayedDate : firebaseStats.lastPlayedDate,
        flawlessStreak: Math.max(localStats.flawlessStreak, firebaseStats.flawlessStreak),
        hintsUsed: localStats.hintsUsed + firebaseStats.hintsUsed
      };
      
      await setDoc(userDocRef, mergedStats);
    }
  }

  // Private helper methods
  private getLocalStats(): UserStats {
    const saved = localStorage.getItem('userStats');
    if (saved) {
      return JSON.parse(saved);
    }
    
    return {
      puzzlesSolved: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalAttempts: 0,
      solvedPuzzles: [],
      lastPlayedDate: "",
      flawlessStreak: 0,
      hintsUsed: 0
    };
  }

  private saveLocalStats(stats: UserStats): void {
    localStorage.setItem('userStats', JSON.stringify(stats));
  }

  private getPreviousDay(dateStr: string): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }

  // Calculate win rate
  async getWinRate(): Promise<number> {
    const stats = await this.getUserStats();
    if (stats.totalAttempts === 0) return 0;
    return Math.round((stats.puzzlesSolved / stats.totalAttempts) * 100);
  }

  private getLocalGameHistory(): GameSession[] {
    try {
      const history = localStorage.getItem(this.GAME_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading game history:', error);
      return [];
    }
  }

  async getDetailedStats(): Promise<{
    normal: { solved: number; attempted: number };
    hard: { solved: number; attempted: number };
    fusion: { solved: number; attempted: number };
    overall: { winRate: number; totalSolved: number; totalAttempted: number };
  }> {
    const gameHistory = this.getLocalGameHistory();
    
    const stats = {
      normal: { solved: 0, attempted: 0 },
      hard: { solved: 0, attempted: 0 },
      fusion: { solved: 0, attempted: 0 },
      overall: { winRate: 0, totalSolved: 0, totalAttempted: 0 }
    };

    // Count puzzles by difficulty and type
    for (const session of gameHistory) {
      // Determine difficulty from puzzle ID or assume normal if not specified
      const difficulty = session.difficulty || 'normal';
      const isFusion = session.isFusion || false;

      if (isFusion) {
        stats.fusion.attempted++;
        if (session.solved) stats.fusion.solved++;
      } else if (difficulty === 'hard') {
        stats.hard.attempted++;
        if (session.solved) stats.hard.solved++;
      } else {
        stats.normal.attempted++;
        if (session.solved) stats.normal.solved++;
      }
    }

    // Calculate overall stats
    stats.overall.totalSolved = stats.normal.solved + stats.hard.solved + stats.fusion.solved;
    stats.overall.totalAttempted = stats.normal.attempted + stats.hard.attempted + stats.fusion.attempted;
    stats.overall.winRate = stats.overall.totalAttempted > 0 
      ? Math.round((stats.overall.totalSolved / stats.overall.totalAttempted) * 100)
      : 0;

    return stats;
  }
}

export const userDataService = new UserDataService();
export type { UserStats, GameSession };