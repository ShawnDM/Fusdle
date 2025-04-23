#!/bin/bash

# Script to clear all puzzles from Firebase and generate new ones
echo "Starting puzzle cleanup and generation process..."

# First, clear all puzzles from the database
echo "Clearing all existing puzzles from Firebase..."
npx tsx scripts/generate-90-day-puzzles.ts --clear

# Wait for clearing to complete
sleep 3

echo "Generating new puzzles with improved emoji mapping..."
# Now generate 90 days of puzzles
npx tsx scripts/generate-90-day-puzzles.ts

echo "Process complete! 90 days of puzzles have been generated with improved emoji selection."