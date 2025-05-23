import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/firebase/config";
import { LogOut, User as UserIcon, Trophy, BarChart3, Calendar, Shield } from "lucide-react";
import GoogleAuth from "@/components/google-auth";

const UserMenu: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserMenu;