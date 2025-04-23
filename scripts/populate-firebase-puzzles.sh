#!/bin/bash

echo "Loading environment variables..."
npx tsx scripts/load-env.ts

echo "Generating puzzles..."
npx tsx scripts/generate-firebase-puzzles.ts

echo "Script completed!"