// scripts/cleanup-leagues.ts
// Script per pulire tutte le leghe e dati correlati
// Run with: npx tsx scripts/cleanup-leagues.ts

import { cert, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

// ============================================
// SETUP
// ============================================

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "../firebase-admin-key.json");

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("❌ File chiave admin non trovato:", SERVICE_ACCOUNT_PATH);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://fantavega-default-rtdb.europe-west1.firebasedatabase.app",
});

const firestore = getFirestore();
const realtimeDb = getDatabase();

// ============================================
// CLEANUP FUNCTIONS
// ============================================

async function deleteFirestoreCollection(collectionPath: string) {
  const collectionRef = firestore.collection(collectionPath);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`  ⏭️  ${collectionPath}: vuota`);
    return 0;
  }

  const batch = firestore.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    // Prima elimina le subcollection (participants)
    const subcollections = await doc.ref.listCollections();
    for (const subcol of subcollections) {
      const subDocs = await subcol.get();
      for (const subDoc of subDocs.docs) {
        batch.delete(subDoc.ref);
        count++;
      }
    }
    batch.delete(doc.ref);
    count++;
  }

  await batch.commit();
  console.log(`  ✅ ${collectionPath}: ${count} documenti eliminati`);
  return count;
}

async function deleteRealtimeNode(nodePath: string) {
  const nodeRef = realtimeDb.ref(nodePath);
  const snapshot = await nodeRef.get();

  if (!snapshot.exists()) {
    console.log(`  ⏭️  ${nodePath}: vuoto`);
    return;
  }

  await nodeRef.remove();
  console.log(`  ✅ ${nodePath}: eliminato`);
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("🧹 CLEANUP DATABASE - Fantavega\n");
  console.log("Questo script eliminerà:");
  console.log("  - Firestore: leagues/* (con subcollections)");
  console.log("  - Realtime DB: auctions/*");
  console.log("  - Realtime DB: autoBids/*");
  console.log("  - Realtime DB: rosters/*\n");

  console.log("📂 FIRESTORE:");
  await deleteFirestoreCollection("leagues");

  console.log("\n📡 REALTIME DATABASE:");
  await deleteRealtimeNode("auctions");
  await deleteRealtimeNode("autoBids");
  await deleteRealtimeNode("rosters");

  console.log("\n✨ Cleanup completato!");
  console.log("Ora puoi creare una nuova lega dall'app.");
}

main().catch(console.error);
