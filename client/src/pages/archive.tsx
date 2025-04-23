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

  // Use React Query with optimized caching
  const { data: archivePuzzles, isLoading, error } = useQuery({
    queryKey: ['/api/puzzles/archive'],
    queryFn: async () => {
      // If we already have preloaded data, use it
      if (navigationState.archiveLoaded && navigationState.archiveData) {
        console.log("Using preloaded archive data");
        return navigationState.archiveData;
      }
      
      console.log("Fetching archive data");
      // Try Firebase service first
      let archiveData = null;
      
      try {
        // Use getPuzzleArchive to get past puzzles of all types
        const archivePuzzles = await firestoreService.getPuzzleArchive(30);
        if (archivePuzzles && archivePuzzles.length > 0) {
          archiveData = archivePuzzles;
        }
      } catch (error) {
        console.warn("Firebase archive fetch failed, trying API:", error);
      }
      
      // Fallback to API
      if (!archiveData) {
        const archiveResponse = await fetch(`${getApiBaseUrl()}/api/puzzles/archive`);
        if (!archiveResponse.ok) {
          throw new Error("Failed to fetch archive puzzles");
        }
        archiveData = await archiveResponse.json();
      }
      
      // Store in navigation state for future use
      if (archiveData) {
        updateNavigationState({ 
          archiveLoaded: true,
          archiveData: archiveData
        });
      }
      
      return archiveData;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: true,
  });

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

  // Filter puzzles based on active tab
  const getFilteredPuzzles = () => {
    if (!archivePuzzles) return [];
    
    // Get current date to filter only past puzzles
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for proper comparison
    
    // Filter puzzles to only include past puzzles first
    const pastPuzzles = archivePuzzles.filter((puzzle: ArchivePuzzle) => {
      try {
        const puzzleDate = new Date(puzzle.date);
        return puzzleDate < today;
      } catch (err) {
        console.error(`Invalid date format for puzzle ${puzzle.id}:`, err);
        return false;
      }
    });
    
    console.log(`Found ${pastPuzzles.length} past puzzles out of ${archivePuzzles.length} total`);
    
    if (activeTab === 'fusion') {
      // Show all fusion puzzles regardless of difficulty
      const fusionPuzzles = pastPuzzles.filter((puzzle: ArchivePuzzle) => puzzle.isFusionTwist === 1);
      console.log(`Filtered to ${fusionPuzzles.length} fusion puzzles`);
      return fusionPuzzles;
    } else {
      // Show regular puzzles of the selected difficulty
      const filteredByDifficulty = pastPuzzles.filter((puzzle: ArchivePuzzle) => 
        puzzle.difficulty === activeTab && (puzzle.isFusionTwist === 0 || puzzle.isFusionTwist === undefined)
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
          <TabsTrigger value="normal" className="flex items-center gap-1">
            <Flame className="h-3.5 w-3.5" /> Normal
          </TabsTrigger>
          <TabsTrigger value="hard" className="flex items-center gap-1">
            <Skull className="h-3.5 w-3.5" /> Hard
          </TabsTrigger>
          <TabsTrigger value="fusion" className="flex items-center gap-1">
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
