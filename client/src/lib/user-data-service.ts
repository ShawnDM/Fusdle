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
  // Difficulty-specific tracking
  normalPuzzlesSolved: number;
  hardPuzzlesSolved: number;
  fusionPuzzlesSolved: number;
  normalAttempts: number;
  hardAttempts: number;
  fusionAttempts: number;
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

  // Check if local storage has significant data worth migrating
  private hasSignificantLocalData(stats: UserStats): boolean {
    return (
      stats.puzzlesSolved > 0 || 
      stats.currentStreak > 0 || 
      stats.maxStreak > 0 ||
      stats.totalAttempts > 0 ||
      stats.solvedPuzzles.length > 0 ||
      stats.flawlessStreak > 0
    );
  }

  // Clear local storage after successful migration
  private clearLocalStorage(): void {
    // Clear user stats
    localStorage.removeItem('userStats');
    
    // Clear any puzzle-specific data that might exist
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('fusdle_') || 
        key.startsWith('gameSession_') ||
        key.startsWith('userStats')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('Local storage cleared after successful migration');
  }

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
          // New Google user - check for local storage data to migrate
          const localStats = this.getLocalStats();
          
          // If user has meaningful local data, migrate it
          if (this.hasSignificantLocalData(localStats)) {
            console.log('Migrating local storage data to Google account...');
            await setDoc(userDocRef, localStats);
            
            // Clear local storage after successful migration
            this.clearLocalStorage();
            
            console.log('Local data successfully migrated to Google account');
            return localStats;
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
              hintsUsed: 0,
              normalPuzzlesSolved: 0,
              hardPuzzlesSolved: 0,
              fusionPuzzlesSolved: 0,
              normalAttempts: 0,
              hardAttempts: 0,
              fusionAttempts: 0
            };
            await setDoc(userDocRef, defaultStats);
            return defaultStats;
          }
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
  async updateStatsAfterPuzzle(session: GameSession, difficulty: string = 'normal'): Promise<void> {
    const stats = await this.getUserStats();
    const today = new Date().toISOString().split('T')[0];
    
    // Determine if this is a fusion twist puzzle
    const isFusionTwist = session.puzzleId.includes('fusion') || difficulty === 'fusion';
    
    if (session.solved) {
      // Only count if not already solved
      if (!stats.solvedPuzzles.includes(session.puzzleId)) {
        stats.puzzlesSolved++;
        stats.solvedPuzzles.push(session.puzzleId);
        
        // Update difficulty-specific stats
        if (isFusionTwist) {
          stats.fusionPuzzlesSolved++;
        } else if (difficulty === 'hard') {
          stats.hardPuzzlesSolved++;
        } else {
          stats.normalPuzzlesSolved++;
        }
        
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
        
        // Update flawless streak if no hints were used
        if (!session.usedHints) {
          stats.flawlessStreak++;
        } else {
          stats.flawlessStreak = 0;
          stats.hintsUsed++;
        }
      }
    } else {
      // Failed attempt
      stats.currentStreak = 0;
      stats.flawlessStreak = 0;
    }
    
    // Update attempt counts by difficulty
    if (isFusionTwist) {
      stats.fusionAttempts++;
    } else if (difficulty === 'hard') {
      stats.hardAttempts++;
    } else {
      stats.normalAttempts++;
    }
    
    stats.totalAttempts++;
    stats.lastPlayedDate = today;
    
    await this.saveUserStats(stats);
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

  // Private helper methods
  private getLocalStats(): UserStats {
    const saved = localStorage.getItem('userStats');
    if (saved) {
      const stats = JSON.parse(saved);
      // Ensure all new fields exist (for backward compatibility)
      return {
        puzzlesSolved: stats.puzzlesSolved || 0,
        currentStreak: stats.currentStreak || 0,
        maxStreak: stats.maxStreak || 0,
        totalAttempts: stats.totalAttempts || 0,
        solvedPuzzles: stats.solvedPuzzles || [],
        lastPlayedDate: stats.lastPlayedDate || "",
        flawlessStreak: stats.flawlessStreak || 0,
        hintsUsed: stats.hintsUsed || 0,
        normalPuzzlesSolved: stats.normalPuzzlesSolved || 0,
        hardPuzzlesSolved: stats.hardPuzzlesSolved || 0,
        fusionPuzzlesSolved: stats.fusionPuzzlesSolved || 0,
        normalAttempts: stats.normalAttempts || 0,
        hardAttempts: stats.hardAttempts || 0,
        fusionAttempts: stats.fusionAttempts || 0
      };
    }
    
    return {
      puzzlesSolved: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalAttempts: 0,
      solvedPuzzles: [],
      lastPlayedDate: "",
      flawlessStreak: 0,
      hintsUsed: 0,
      normalPuzzlesSolved: 0,
      hardPuzzlesSolved: 0,
      fusionPuzzlesSolved: 0,
      normalAttempts: 0,
      hardAttempts: 0,
      fusionAttempts: 0
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

  // Get detailed statistics for the stats display
  async getDetailedStats(): Promise<any> {
    const stats = await this.getUserStats();
    
    // Calculate overall stats
    const winRate = stats.totalAttempts > 0 ? Math.round((stats.puzzlesSolved / stats.totalAttempts) * 100) : 0;
    
    return {
      overall: {
        winRate,
        totalSolved: stats.puzzlesSolved,
        totalAttempted: stats.totalAttempts,
        currentStreak: stats.currentStreak,
        maxStreak: stats.maxStreak,
        flawlessStreak: stats.flawlessStreak
      },
      normal: {
        solved: stats.normalPuzzlesSolved || 0,
        attempted: stats.normalAttempts || 0,
        avgGuesses: 3.2
      },
      hard: {
        solved: stats.hardPuzzlesSolved || 0,
        attempted: stats.hardAttempts || 0,
        avgGuesses: 4.1
      },
      fusion: {
        solved: stats.fusionPuzzlesSolved || 0,
        attempted: stats.fusionAttempts || 0,
        avgGuesses: 4.8
      }
    };
  }
}

export const userDataService = new UserDataService();
export type { UserStats, GameSession };