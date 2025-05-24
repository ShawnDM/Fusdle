import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/firebase/config";
import { LogOut, User as UserIcon, Trophy, BarChart3, Calendar, Shield, AlertTriangle, Trash2 } from "lucide-react";
import GoogleAuth from "@/components/google-auth";
import { userDataService } from "@/lib/user-data-service";

const UserMenu: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleResetStats = async () => {
    try {
      // Reset user stats to default values
      const defaultStats = {
        puzzlesSolved: 0,
        currentStreak: 0,
        maxStreak: 0,
        totalAttempts: 0,
        solvedPuzzles: [],
        lastPlayedDate: "",
        flawlessStreak: 0,
        hintsUsed: 0
      };
      
      await userDataService.saveUserStats(defaultStats);
      
      // Close all dialogs
      setShowResetConfirm(false);
      setShowResetWarning(false);
      setShowUserDialog(false);
      
      // Refresh the page to reflect the reset
      window.location.reload();
    } catch (error) {
      console.error('Error resetting stats:', error);
    }
  };

  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Player';

  if (!user) {
    return (
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Sign In
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to Fusdle!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <GoogleAuth showBenefits={true} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline">Hey, {firstName}!</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {firstName.charAt(0).toUpperCase()}
            </div>
            Welcome back, {firstName}!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>Progress tracking enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-500" />
                  <span>Statistics being saved</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>Synced across devices</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-xs text-gray-500 text-center">
            Signed in as {user.email}
          </div>
          
          <GoogleAuth compact={true} showBenefits={false} />
          
          {/* Reset Stats Section */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-red-700 mb-3">
                Reset all your game statistics and progress. This action cannot be undone.
              </p>
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full flex items-center gap-2"
                onClick={() => setShowResetWarning(true)}
              >
                <Trash2 className="h-4 w-4" />
                Reset All Stats
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
      
      {/* Reset Warning Dialog */}
      <Dialog open={showResetWarning} onOpenChange={setShowResetWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Reset All Statistics?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will permanently delete all of your game data including:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Current and maximum streaks</li>
              <li>• Total puzzles solved</li>
              <li>• All attempt history</li>
              <li>• Flawless streak progress</li>
            </ul>
            <p className="text-sm font-medium text-red-600">
              This action cannot be undone!
            </p>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowResetWarning(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  setShowResetWarning(false);
                  setShowResetConfirm(true);
                }}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Final Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Final Confirmation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you absolutely sure you want to reset all your statistics? 
              This will erase all your progress permanently.
            </p>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowResetConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleResetStats}
                className="flex-1 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Reset Stats
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default UserMenu;