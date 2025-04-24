import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

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

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
