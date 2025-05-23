import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate the Fusdle number based on date
 * Ensures consistent numbering across all parts of the application
 * 
 * @param dateStr ISO date string in format YYYY-MM-DD
 * @param fallbackNumber Optional fallback number to use if date is invalid
 * @returns The calculated Fusdle number (1-based)
 */
export function calculateFusdleNumber(dateStr?: string | undefined | null, fallbackNumber?: number): number {
  if (!dateStr) {
    // If no date provided, use today's date
    dateStr = new Date().toISOString().split('T')[0];
  }
  
  try {
    // Game starts on May 22, 2025 (Fusdle #1)
    const baseDate = new Date('2025-05-22'); // May 22, 2025 = Fusdle #1
    const puzzleDate = new Date(dateStr);
    
    // Calculate days between dates
    const daysDiff = Math.floor((puzzleDate.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // Ensure we get a positive number (1-based index)
    // May 22 = Fusdle #1, May 23 = Fusdle #2, etc.
    return daysDiff >= 0 ? daysDiff + 1 : fallbackNumber || 1;
  } catch (error) {
    console.error(`Error calculating Fusdle number for date ${dateStr}:`, error);
    return fallbackNumber || 1;
  }
}
