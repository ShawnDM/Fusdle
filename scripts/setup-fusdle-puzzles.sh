#!/bin/bash

# Fusdle Puzzle Generator Setup
# This script helps with the initial setup and running of the puzzle generation scripts

# Make sure we're in the project root directory
cd "$(dirname "$0")/.."

# Color for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Header
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}      Fusdle Puzzle Generator Setup     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check for required environment variables
if [[ -z "$VITE_FIREBASE_API_KEY" || -z "$VITE_FIREBASE_PROJECT_ID" || -z "$VITE_FIREBASE_APP_ID" ]]; then
    echo -e "${RED}Error: Required Firebase environment variables are missing.${NC}"
    echo "Please make sure the following environment variables are set:"
    echo "  - VITE_FIREBASE_API_KEY"
    echo "  - VITE_FIREBASE_PROJECT_ID"
    echo "  - VITE_FIREBASE_APP_ID"
    echo ""
    echo "You can set these by running the following commands:"
    echo "export VITE_FIREBASE_API_KEY=your_api_key"
    echo "export VITE_FIREBASE_PROJECT_ID=your_project_id"
    echo "export VITE_FIREBASE_APP_ID=your_app_id"
    exit 1
fi

# Check if we need to install dependencies
if ! command -v tsx &> /dev/null; then
    echo -e "${YELLOW}Installing required dependencies...${NC}"
    npm install -g tsx
fi

# Display options
echo "What would you like to do?"
echo "1. Generate 90 days of puzzles (starting from April 21, 2025)"
echo "2. Generate 90 days of puzzles (starting from a custom date)"
echo "3. Set up automation for puzzle generation every 90 days"
echo "4. Help / Instructions"
echo "5. Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "${GREEN}Generating 90 days of puzzles starting from April 21, 2025...${NC}"
        npx tsx scripts/generate-90-day-puzzles.ts
        ;;
    2)
        echo -e "${BLUE}Enter a custom start date (format: YYYY-MM-DD):${NC}"
        read custom_date
        
        # Validate date format
        if [[ ! $custom_date =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
            echo -e "${RED}Invalid date format. Please use YYYY-MM-DD.${NC}"
            exit 1
        fi
        
        # Set custom date as an environment variable and run
        echo -e "${GREEN}Generating 90 days of puzzles starting from $custom_date...${NC}"
        FUSDLE_START_DATE=$custom_date npx tsx scripts/generate-90-day-puzzles.ts
        ;;
    3)
        echo -e "${GREEN}Setting up automation for puzzle generation...${NC}"
        npx tsx scripts/automate-puzzle-generation.ts --setup-cron
        echo ""
        echo -e "${YELLOW}Note: This will attempt to create a cron job to check weekly if new puzzles are needed.${NC}"
        echo "If the automated setup fails, you can manually set up a scheduled task to run:"
        echo "npx tsx $(pwd)/scripts/automate-puzzle-generation.ts"
        ;;
    4)
        echo -e "${BLUE}========== Instructions ==========${NC}"
        echo "This setup helps you generate and maintain Fusdle puzzles for your app."
        echo ""
        echo "1. Initial Generation:"
        echo "   - Run option 1 to generate your first 90 days of puzzles"
        echo "   - This will create normal, hard, and fusion twist puzzles"
        echo "   - The puzzles are stored in your Firebase Firestore database"
        echo ""
        echo "2. Automation:"
        echo "   - Run option 3 to set up automated generation"
        echo "   - The system will check weekly if new puzzles are needed"
        echo "   - New puzzles are automatically generated when less than 14 days remain"
        echo ""
        echo "3. Customization:"
        echo "   - You can modify the puzzle content in scripts/generate-90-day-puzzles.ts"
        echo "   - Adjust the difficulty levels, answers, hints, or fusion twist types"
        echo ""
        echo "4. Managing Puzzles:"
        echo "   - All puzzles are stored in the 'puzzles' collection in Firestore"
        echo "   - You can manually edit puzzles through the Firebase console"
        echo ""
        echo "5. Troubleshooting:"
        echo "   - Check puzzle-automation.log in the scripts directory for automation logs"
        echo "   - Ensure your Firebase credentials are correctly set up in environment variables"
        echo -e "${BLUE}=================================${NC}"
        ;;
    5)
        echo -e "${GREEN}Exiting.${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice. Please enter a number between 1-5.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Operation completed!${NC}"