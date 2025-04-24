import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { initDatabase, migrateFromLocalStorage, checkDataExists } from "./lib/indexed-db";

// Create a FontFace for Quicksand font and add it to the document
const quicksandFont = new FontFace(
  "Quicksand",
  "url(https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap)"
);

// Create a FontFace for Nunito font and add it to the document
const nunitoFont = new FontFace(
  "Nunito",
  "url(https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap)"
);

// Add fonts to document fonts
Promise.all([quicksandFont.load(), nunitoFont.load()])
  .then(fonts => {
    fonts.forEach(font => {
      document.fonts.add(font);
    });
  })
  .catch(error => {
    console.error("Error loading fonts:", error);
  });

// Set document title
document.title = "Fusdle - Daily Emoji Word Game";

// Initialize storage systems
const initApp = async () => {
  try {
    // Initialize IndexedDB
    await initDatabase();
    
    // Check if we already have data in IndexedDB
    const hasData = await checkDataExists();
    
    // If no data in IndexedDB, migrate from localStorage
    if (!hasData) {
      await migrateFromLocalStorage();
      console.log('✅ Data migration from localStorage to IndexedDB completed');
    } else {
      console.log('Using existing IndexedDB data');
    }
    
    // Add event listener for beforeunload to ensure data is saved
    window.addEventListener('beforeunload', () => {
      // No need to do anything - IndexedDB operations are already async and will complete
      console.log('Page unloading - data is preserved in IndexedDB');
    });
    
    // Listen for app updates/refreshes (for PWA support)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('App updated - data is preserved in IndexedDB');
      });
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

// Run the initialization
initApp().finally(() => {
  // Once storage is initialized, render the app
  createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
});
