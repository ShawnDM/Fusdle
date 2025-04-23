// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Helper function to safely access environment variables
const getEnv = (key: string): string => {
  // Try to access from import.meta.env (Vite in browser)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || '';
  }
  
  // Fallback to process.env (Node.js/server-side)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  
  return '';
};

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${getEnv('VITE_FIREBASE_PROJECT_ID') || process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${getEnv('VITE_FIREBASE_PROJECT_ID') || process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: getEnv('VITE_FIREBASE_APP_ID') || process.env.VITE_FIREBASE_APP_ID
};
 
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
export default app;