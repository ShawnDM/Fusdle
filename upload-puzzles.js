import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = await import("./serviceAccountKey.json", {
  assert: { type: "json" },
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount.default),
});

const db = admin.firestore();
const puzzles = JSON.parse(readFileSync("./puzzles.json", "utf8"));

async function uploadPuzzles() {
  const batch = db.batch();

  puzzles.forEach((puzzle) => {
    const docRef = db.collection("puzzles").doc(String(puzzle.puzzleNumber));
    batch.set(docRef, puzzle);
  });

  await batch.commit();
  console.log(`✅ Uploaded ${puzzles.length} puzzle(s) to 'puzzles' collection.`);
}

uploadPuzzles().catch(console.error);
