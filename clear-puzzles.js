import admin from "firebase-admin";

const serviceAccount = await import("./serviceAccountKey.json", {
  assert: { type: "json" },
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount.default),
});

const db = admin.firestore();

async function clearCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) {
    console.log(`Collection '${collectionName}' is already empty.`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`✅ Cleared ${snapshot.size} document(s) from '${collectionName}'`);
}

clearCollection("puzzles").catch(console.error);
