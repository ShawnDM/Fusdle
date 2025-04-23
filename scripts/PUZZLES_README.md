# Fusdle Puzzle Generation System

This directory contains scripts to generate and maintain puzzles for your Fusdle game app. These scripts help you create and manage 90 days worth of puzzles, with automation to ensure you always have fresh content.

## Files Overview

- **generate-90-day-puzzles.ts**: Main script that generates 90 days worth of puzzles
- **automate-puzzle-generation.ts**: Automation script to check and generate new puzzles when needed
- **setup-fusdle-puzzles.sh**: Helper script to guide you through the setup process

## Puzzle Structure

Each puzzle generated follows these specifications:

- **Puzzles per Day**: 1 Normal puzzle and 1 Hard puzzle
- **Fusion Twist puzzles**: 2 per week (about 26 total), randomly replacing either a normal or hard puzzle slot
- **Time for each puzzle**: Set at 4:00 AM UTC-4 for the assigned date
- **Emoji order**: Logically matches the flow/order of the answer phrase
- **Word count**: Automatically calculated and stored in a wordCount field
- **Puzzle Number**: Sequential for each puzzle (starting from 1), regardless of difficulty

## Getting Started

### Prerequisites

- Node.js installed
- Firebase project set up with Firestore
- Environment variables configured (see below)

### Environment Variables

Make sure these environment variables are set:

```bash
export VITE_FIREBASE_API_KEY=your_api_key
export VITE_FIREBASE_PROJECT_ID=your_project_id
export VITE_FIREBASE_APP_ID=your_app_id
```

### Running the Setup

The easiest way to get started is to run the setup script:

```bash
bash scripts/setup-fusdle-puzzles.sh
```

This interactive script will guide you through:
1. Generating your first 90 days of puzzles
2. Setting up automation for continuous puzzle generation
3. Providing help and instructions

### Manual Generation

If you prefer to run the scripts directly:

```bash
# Generate 90 days of puzzles starting from April 21, 2025
npx tsx scripts/generate-90-day-puzzles.ts

# Generate 90 days of puzzles with a custom start date
FUSDLE_START_DATE="2025-05-01" npx tsx scripts/generate-90-day-puzzles.ts

# Clear existing puzzles before generating new ones
npx tsx scripts/generate-90-day-puzzles.ts --clear
```

### Setting Up Automation

```bash
# Set up a scheduled task to check and generate puzzles when needed
npx tsx scripts/automate-puzzle-generation.ts --setup-cron

# Manually run the automation check
npx tsx scripts/automate-puzzle-generation.ts
```

## Puzzle Types

### Normal Puzzles
- Quick and satisfying (2–3 emojis)
- Designed to be solved in 2-3 guesses
- Standard difficulty level

### Hard Puzzles
- Require deeper thinking (4–5 emojis)
- Designed to be solved in 2-4 guesses
- More complex words and phrases

### Fusion Twist Puzzles
- Playful, clever, or meme-like
- Special combinations or portmanteaus
- Occur twice per week, randomly distributed

## Customization

To customize puzzle content:

1. Edit the `normalPuzzles`, `hardPuzzles`, and `fusionPuzzles` arrays in `generate-90-day-puzzles.ts`
2. Adjust the emoji mappings in `server/ordered-emoji-generator.ts` for better emoji matches
3. Modify hint generation in the `generateHints` function

## Troubleshooting

- Check `puzzle-automation.log` for automation logs
- Ensure Firebase credentials are correctly set up
- Verify the Firestore database is properly configured with the correct collection

## Scheduling

The automation script is designed to:

1. Check weekly if puzzles need to be generated
2. Generate new puzzles when less than 14 days of content remains
3. Keep a continuous flow of puzzles with no gaps

The automated setup creates a cron job that runs weekly to ensure you never run out of puzzles.