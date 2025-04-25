import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skull, Flame, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { navigationState, updateNavigationState } from "@/lib/queryClient";
import { firestoreService } from "@/firebase/firestore";
import { getApiBaseUrl } from "@/lib/queryClient";
import { calculateFusdleNumber } from "@/lib/utils";
import { getGlobalDateString } from "@/lib/global-time";

interface ArchivePuzzle {
  id: number;
  puzzleNumber: number;
  date: string;
  emojis: string[];
  answer: string;
  difficulty: string;
  isFusionTwist: number;
  twistType: string | null;
}

type DifficultyFilter = 'normal' | 'hard' | 'fusion';

const Archive: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DifficultyFilter>('normal');
  const [currentDate, setCurrentDate] = useState<string>("");
  const [firebaseArchiveData, setFirebaseArchiveData] = useState<ArchivePuzzle[] | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<Error | null>(null);
  
  // Fetch the current date for archive filtering - remove the hardcoded date
  useEffect(() => {
    async function fetchCurrentDate() {
      try {
        const dateStr = await getGlobalDateString();
        console.log(`Archive using current date: ${dateStr}`);
        setCurrentDate(dateStr);
      } catch (e) {
        console.error("Error getting global date:", e);
        // Fallback to browser date
        const today = new Date().toISOString();
        setCurrentDate(today);
      }
    }
    
    fetchCurrentDate();
  }, []);
  
  // Direct Firebase data fetch (this runs on every mount)
  useEffect(() => {
    async function fetchFirebaseArchive() {
      setIsFirebaseLoading(true);
      try {
        console.log("Directly fetching Firebase archive data on mount");
        const archivePuzzles = await firestoreService.getPuzzleArchive(30);
        if (archivePuzzles && archivePuzzles.length > 0) {
          console.log(`Direct Firebase fetch successful: ${archivePuzzles.length} puzzles`);
          setFirebaseArchiveData(archivePuzzles);
          
          // Also update navigation state for future use
          updateNavigationState({
            archiveLoaded: true,
            archiveData: archivePuzzles
          });
        } else {
          console.log("Firebase fetch returned no puzzles, falling back to cached data");
          setFirebaseArchiveData(null);
        }
      } catch (error) {
        console.warn("Error fetching Firebase archive:", error);
        setFirebaseError(error as Error);
        setFirebaseArchiveData(null);
      } finally {
        setIsFirebaseLoading(false);
      }
    }
    
    fetchFirebaseArchive();
  }, []);
  
  // Fallback to React Query if direct Firebase fetch fails
  const { data: archivePuzzles, isLoading: isQueryLoading, error: queryError } = useQuery({
    queryKey: ['/api/puzzles/archive'],
    queryFn: async () => {
      // If direct Firebase fetch was successful, return that data
      if (firebaseArchiveData && firebaseArchiveData.length > 0) {
        console.log("Using directly fetched Firebase data");
        return firebaseArchiveData;
      }
      
      console.log("Using cached or API archive data as fallback");
      // Try using preloaded data from navigation state
      if (navigationState.archiveLoaded && navigationState.archiveData) {
        console.log("Using preloaded archive data from navigation state");
        return navigationState.archiveData;
      }
      
      // Last resort: API fallback
      const archiveResponse = await fetch(`${getApiBaseUrl()}/api/puzzles/archive`);
      if (!archiveResponse.ok) {
        throw new Error("Failed to fetch archive puzzles from API");
      }
      
      const apiData = await archiveResponse.json();
      
      // Store in navigation state for future use
      if (apiData) {
        updateNavigationState({ 
          archiveLoaded: true,
          archiveData: apiData
        });
      }
      
      return apiData;
    },
    staleTime: 1000 * 60, // 1 minute
    enabled: !isFirebaseLoading && firebaseArchiveData === null, // Only run if direct fetch failed
  });
  
  // Combined loading and error states
  const isLoading = isFirebaseLoading || isQueryLoading;
  const error = firebaseError || queryError;
  
  // Combined data source with priority to Firebase direct fetch
  const displayPuzzles = firebaseArchiveData || archivePuzzles;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⌛</div>
          <p className="text-lg">Loading puzzle archive...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in">
        <div className="text-center py-8">
          <div className="text-4xl mb-4 text-destructive">😕</div>
          <h2 className="text-xl font-bold mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600">{error instanceof Error ? error.message : "Failed to load archive"}</p>
        </div>
      </div>
    );
  }
  
  // If we don't have the current date yet, show loading
  if (!currentDate) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⌛</div>
          <p className="text-lg">Loading date information...</p>
        </div>
      </div>
    );
  }

  // Filter puzzles based on active tab and current date
  const getFilteredPuzzles = () => {
    // Use displayPuzzles (combined from Firebase and cache) as source
    const puzzlesToFilter = displayPuzzles || [];
    
    if (puzzlesToFilter.length === 0) {
      console.log("No puzzles available to filter");
      return [];
    }
    
    // Parse the current date for comparison
    const today = new Date(currentDate);
    const currentDateSimple = currentDate.split('T')[0]; // Get YYYY-MM-DD format
    
    const finalPuzzles = puzzlesToFilter.filter((puzzle: ArchivePuzzle) => {
      try {
        // Get simple date for puzzle (YYYY-MM-DD only)
        const puzzleDateSimple = puzzle.date.split('T')[0];
        
        // For debugging - log the comparison for the first few puzzles
        if (puzzle.puzzleNumber <= 10) {
          console.log(`Archive date check: Puzzle #${puzzle.puzzleNumber}, date=${puzzleDateSimple}, today=${currentDateSimple}, is before? ${puzzleDateSimple < currentDateSimple}`);
        }
        
        // Compare dates using string comparison (simpler and more reliable for YYYY-MM-DD format)
        return puzzleDateSimple < currentDateSimple;
      } catch (err) {
        console.error(`Date comparison error for puzzle ${puzzle.id}:`, err);
        return false; // Exclude puzzles with invalid dates
      }
    });
    
    console.log(`Found ${finalPuzzles.length} puzzles for archive`);
    
    if (activeTab === 'fusion') {
      // Show all fusion puzzles regardless of difficulty
      const fusionPuzzles = finalPuzzles.filter((puzzle: ArchivePuzzle) => 
        puzzle.isFusionTwist === 1
      );
      console.log(`Filtered to ${fusionPuzzles.length} fusion puzzles`);
      return fusionPuzzles;
    } else {
      // Show regular puzzles of the selected difficulty
      // Fixed to properly handle normal puzzles by checking just the difficulty
      const filteredByDifficulty = finalPuzzles.filter((puzzle: ArchivePuzzle) => 
        puzzle.difficulty === activeTab
      );
      console.log(`Filtered to ${filteredByDifficulty.length} ${activeTab} puzzles`);
      return filteredByDifficulty;
    }
  };
  
  // Get the filtered puzzles
  const filteredPuzzles = getFilteredPuzzles();
  
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg p-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-4">Puzzle Archive</h2>
      
      <Tabs defaultValue="normal" className="mb-6" onValueChange={(value) => setActiveTab(value as DifficultyFilter)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="normal" 
            className="flex items-center gap-1"
            onClick={() => setActiveTab('normal')}
          >
            <Flame className="h-3.5 w-3.5" /> Normal
          </TabsTrigger>
          <TabsTrigger 
            value="hard" 
            className="flex items-center gap-1"
            onClick={() => setActiveTab('hard')}
          >
            <Skull className="h-3.5 w-3.5" /> Hard
          </TabsTrigger>
          <TabsTrigger 
            value="fusion" 
            className="flex items-center gap-1"
            onClick={() => setActiveTab('fusion')}
          >
            <Sparkles className="h-3.5 w-3.5" /> Fusion
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="normal" className="space-y-4 mt-4">
          {filteredPuzzles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No normal puzzles found in the archive.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPuzzles.map((puzzle: ArchivePuzzle) => (
                <PuzzleCard key={puzzle.id} puzzle={puzzle} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="hard" className="space-y-4 mt-4">
          {filteredPuzzles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hard puzzles found in the archive.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPuzzles.map((puzzle: ArchivePuzzle) => (
                <PuzzleCard key={puzzle.id} puzzle={puzzle} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="fusion" className="space-y-4 mt-4">
          {filteredPuzzles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No fusion puzzles found in the archive.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPuzzles.map((puzzle: ArchivePuzzle) => (
                <PuzzleCard key={puzzle.id} puzzle={puzzle} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

// Puzzle Card component for archive display
const PuzzleCard: React.FC<{ puzzle: ArchivePuzzle }> = ({ puzzle }) => {
  // Determine badge content based on puzzle type
  const getBadge = () => {
    if (puzzle.isFusionTwist) {
      return (
        <Badge variant="outline" className="text-xs py-1 flex items-center gap-1 bg-purple-100">
          <Sparkles className="h-3 w-3" /> {puzzle.twistType}
        </Badge>
      );
    } else if (puzzle.difficulty === 'hard') {
      return (
        <Badge variant="destructive" className="text-xs py-1 flex items-center gap-1">
          <Skull className="h-3 w-3" /> Hard Mode
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="text-xs py-1 flex items-center gap-1">
          <Flame className="h-3 w-3" /> Normal Mode
        </Badge>
      );
    }
  };

  return (
    <motion.div
      className="border rounded-lg p-4 bg-white shadow-sm hover:shadow transition-shadow"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="font-medium">
            Fusdle #{calculateFusdleNumber(puzzle.date, puzzle.puzzleNumber)}
          </span>
          <div className="text-sm text-gray-500 mt-1">
            {format(new Date(puzzle.date), "MMMM d, yyyy")}
          </div>
        </div>
        {getBadge()}
      </div>

      <div className="text-3xl mb-3">{puzzle.emojis.join(" ")}</div>
      
      <div className="p-3 bg-gray-50 rounded-md">
        <div className="text-sm text-gray-500 mb-1">Answer:</div>
        <div className="font-medium">{puzzle.answer}</div>
      </div>
    </motion.div>
  );
};

export default Archive;
