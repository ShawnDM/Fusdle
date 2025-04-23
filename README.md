# Fusdle: Emoji Fusion Puzzle Game

A daily emoji puzzle game where players guess fused concepts based on emoji combinations. 

## Features

- **Daily Puzzles**: New puzzles rotate at midnight Eastern Time
- **Multiple Difficulty Tiers**: Normal and Hard modes with varying challenge levels
- **Fusion Twist Puzzles**: Special fusion puzzle types appearing twice weekly
- **Streak Tracking**: Track your winning streaks with multipliers for perfect solves
- **Social Sharing**: Share your results with colorful patterns showing your performance

## Tech Stack

- **Frontend**: React, Tailwind CSS, Shadcn/UI components
- **Backend**: Express.js serverless API
- **Database**: Firebase Firestore
- **Deployment**: Vercel-ready configuration

## Game Mechanics

- Players view a set of emojis and guess the combined concept
- Normal mode allows 3 guesses, Hard mode allows 4 guesses
- Hard mode is unlocked after completing the day's Normal puzzle
- Optional hints are available but affect your streak multiplier
- Partial match detection provides feedback when close to the answer

## Deployment

The app is configured to work flawlessly on Vercel. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

## Environment Variables

The following environment variables are required:

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_APP_ID` - Firebase application ID

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the development server: `npm run dev`

## License

MIT