import { User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

export interface UserProgress {
  userId: string;
  email: string;
  displayName?: string;
  currentStreak: number;
  longestStreak: number;
  totalSolved: number;
  averageAttempts: number;
  lastPlayedDate: string;
  difficulty: 'normal' | 'hard';
  gameHistory: GameSession[];
  achievements: Achievement[];
}

export interface GameSession {
  date: string;
  puzzleId: number;
  difficulty: 'normal' | 'hard';
  solved: boolean;
  attempts: number;
  hintsUsed: number;
  timeToSolve?: number; // in seconds
  wasFlawless: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
  icon: string;
}

export class UserProgressService {
  private static instance: UserProgressService;
  
  static getInstance(): UserProgressService {
    if (!UserProgressService.instance) {
      UserProgressService.instance = new UserProgressService();
    }
    return UserProgressService.instance;
  }

  async saveUserProgress(user: User, gameSession: GameSession): Promise<void> {
    try {
      const userDocRef = doc(db, 'userProgress', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // Update existing progress
        const currentProgress = userDoc.data() as UserProgress;
        const updatedProgress = this.calculateUpdatedProgress(currentProgress, gameSession);
        await updateDoc(userDocRef, updatedProgress);
      } else {
        // Create new progress
        const newProgress: UserProgress = {
          userId: user.uid,
          email: user.email || '',
          displayName: user.displayName || undefined,
          currentStreak: gameSession.solved ? 1 : 0,
          longestStreak: gameSession.solved ? 1 : 0,
          totalSolved: gameSession.solved ? 1 : 0,
          averageAttempts: gameSession.attempts,
          lastPlayedDate: gameSession.date,
          difficulty: gameSession.difficulty,
          gameHistory: [gameSession],
          achievements: []
        };
        await setDoc(userDocRef, newProgress);
      }
    } catch (error) {
      console.error('Error saving user progress:', error);
      throw error;
    }
  }

  async getUserProgress(user: User): Promise<UserProgress | null> {
    try {
      const userDocRef = doc(db, 'userProgress', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProgress;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return null;
    }
  }

  private calculateUpdatedProgress(currentProgress: UserProgress, newSession: GameSession): Partial<UserProgress> {
    const gameHistory = [...currentProgress.gameHistory, newSession];
    
    // Calculate streak
    let currentStreak = 0;
    if (newSession.solved) {
      currentStreak = currentProgress.currentStreak + 1;
    } else {
      currentStreak = 0;
    }
    
    const longestStreak = Math.max(currentProgress.longestStreak, currentStreak);
    
    // Calculate total solved
    const totalSolved = currentProgress.totalSolved + (newSession.solved ? 1 : 0);
    
    // Calculate average attempts
    const totalAttempts = gameHistory.reduce((sum, session) => sum + session.attempts, 0);
    const averageAttempts = totalAttempts / gameHistory.length;
    
    return {
      currentStreak,
      longestStreak,
      totalSolved,
      averageAttempts: Math.round(averageAttempts * 10) / 10, // Round to 1 decimal
      lastPlayedDate: newSession.date,
      difficulty: newSession.difficulty,
      gameHistory
    };
  }

  // Check and award achievements
  checkAchievements(progress: UserProgress): Achievement[] {
    const newAchievements: Achievement[] = [];
    const existingAchievementIds = progress.achievements.map(a => a.id);
    
    // First solve achievement
    if (progress.totalSolved >= 1 && !existingAchievementIds.includes('first_solve')) {
      newAchievements.push({
        id: 'first_solve',
        name: 'First Victory!',
        description: 'Solved your first Fusdle puzzle',
        unlockedAt: new Date().toISOString(),
        icon: '🎉'
      });
    }
    
    // Streak achievements
    if (progress.currentStreak >= 7 && !existingAchievementIds.includes('week_streak')) {
      newAchievements.push({
        id: 'week_streak',
        name: 'Week Warrior',
        description: 'Solved puzzles for 7 days in a row',
        unlockedAt: new Date().toISOString(),
        icon: '🔥'
      });
    }
    
    // More achievements can be added here...
    
    return newAchievements;
  }
}

export const userProgressService = UserProgressService.getInstance();