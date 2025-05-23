import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/firebase/config";
import { LogOut, Trophy, BarChart3, Calendar, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GoogleAuthProps {
  showBenefits?: boolean;
  compact?: boolean;
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({ showBenefits = true, compact = false }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      toast({
        title: "Welcome to Fusdle!",
        description: "Your progress will now be saved to your Google account.",
      });
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: "There was an error signing in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Player';

  if (user) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Hey, {firstName}!</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="text-sm text-gray-600">Signed in as {firstName}</span>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (compact) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleSignIn}
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign in with Google"}
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 space-y-4">
        <div className="text-center">
          <h3 className="flex items-center justify-center gap-2 text-lg font-semibold mb-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Sign in with Google
          </h3>
          <p className="text-gray-600">
            Keep your progress safe and unlock extra features!
          </p>
        </div>
          {showBenefits && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>Track your streak & achievements</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <span>View detailed statistics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span>Sync across all devices</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-purple-500" />
                <span>Never lose your progress</span>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              🔒 Secure
            </Badge>
            <Badge variant="secondary" className="text-xs">
              ⚡ Instant
            </Badge>
            <Badge variant="secondary" className="text-xs">
              🆓 Free
            </Badge>
          </div>

          <Button 
            onClick={handleSignIn} 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? "Signing you in..." : "Continue with Google"}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            We only use your Google account to save your game progress. 
            No spam, no sharing of data.
          </p>
        </div>
    </motion.div>
  );
};

export default GoogleAuth;