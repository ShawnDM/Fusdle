import { useState, useEffect } from "react";
import { GoogleAuth } from "./google-auth";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/firebase/config";

export const WelcomePopup = () => {
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Only show popup if user is not signed in
    if (user) {
      setShowWelcomePopup(false);
      return;
    }

    // Check if user has seen the welcome popup before
    const hasSeenWelcome = localStorage.getItem('fusdle_seen_welcome');
    
    if (!hasSeenWelcome) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setShowWelcomePopup(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClosePopup = (open: boolean) => {
    if (!open) {
      // Mark as seen when popup is closed
      localStorage.setItem('fusdle_seen_welcome', 'true');
      setShowWelcomePopup(false);
    }
  };

  return (
    <GoogleAuth 
      asPopup={true}
      open={showWelcomePopup}
      onOpenChange={handleClosePopup}
      showBenefits={true}
    />
  );
};