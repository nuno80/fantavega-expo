// scripts/seed-players.ts
// Script to upload players from Excel to Firestore
// Run with: npx tsx scripts/seed-players.ts

import { initializeApp } from "firebase/app";
import { doc, getFirestore, writeBatch } from "firebase/firestore";
import * as path from "path";
import * as XLSX from "xlsx";

// Firebase config (same as app)
const firebaseConfig = {
  apiKey: "AIzaSyC4Sw7SwyW2ZPn9P3-uOeFsUAXRsPzhiIg",
  authDomain: "fantavega.firebaseapp.com",
  databaseURL: "https://fantavega-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fantavega",
  storageBucket: "fantavega.firebasestorage.app",
  messagingSenderId: "201333299716",
  appId: "1:201333299716:web:ab1182838b45b133977351",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Column mapping based on Excel structure
const COL = {
  ID: "Quotazioni Fantacalcio Stagione 2025 26",
  ROLE: "__EMPTY",
  ROLE_MANTRA: "__EMPTY_1",
  NAME: "__EMPTY_2",
  TEAM: "__EMPTY_3",
  QT_A: "__EMPTY_4",
  QT_I: "__EMPTY_5",
  FVM: "__EMPTY_10",
};

async function seedPlayers() {
  // Read Excel file
  const excelPath = path.resolve(__dirname, "../../Quotazioni_Fantacalcio_Stagione_2025_26 (1).xlsx");
  console.log("📖 Reading Excel file:", excelPath);

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets["Tutti"]; // Use "Tutti" sheet

  // Convert to JSON
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);
  console.log(`📊 Found ${rows.length} rows (including header)`);

  // Skip first row (it's the header row)
  const dataRows = rows.slice(1);
  console.log(`📊 Processing ${dataRows.length} players`);

  // Upload in batches of 500 (Firestore limit)
  const BATCH_SIZE = 500;
  let uploaded = 0;
  let skipped = 0;

  for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestore);
    const batchRows = dataRows.slice(i, i + BATCH_SIZE);

    for (const row of batchRows) {
      const id = row[COL.ID];
      const name = row[COL.NAME] as string;

      // Skip invalid rows
      if (!id || typeof id !== "number" || !name) {
        skipped++;
        continue;
      }

      const docRef = doc(firestore, "players", id.toString());

      batch.set(docRef, {
        id: id,
        role: (row[COL.ROLE] as string) || "C",
        roleMantra: (row[COL.ROLE_MANTRA] as string) || null,
        name: name,
        team: (row[COL.TEAM] as string) || "Sconosciuta",
        currentQuotation: (row[COL.QT_A] as number) || 1,
        initialQuotation: (row[COL.QT_I] as number) || 1,
        fvm: (row[COL.FVM] as number) || null,
        photoUrl: null,
        isStarter: false,
        isFavorite: false,
        integrityValue: 0,
        hasFmv: !!(row[COL.FVM] as number),
      });

      uploaded++;
    }

    await batch.commit();
    console.log(`✅ Uploaded ${uploaded}/${dataRows.length} players (skipped: ${skipped})`);
  }

  console.log(`\n🎉 Done! ${uploaded} players uploaded to Firestore.`);
  console.log(`⚠️ Skipped ${skipped} invalid rows.`);
}

seedPlayers().catch(console.error);
