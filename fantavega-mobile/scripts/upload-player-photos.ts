// scripts/upload-player-photos.ts
// Script to upload player photos from fantavega webapp to Firebase Storage
// Run with: npx tsx scripts/upload-player-photos.ts

import { cert, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import * as fs from "fs";
import * as path from "path";

// ============================================
// CONFIGURAZIONE
// ============================================

// Path alla cartella foto della webapp
const PHOTOS_DIR = path.join(__dirname, "../../fantavega/public/seria_A");
// Bucket Firebase Storage
const BUCKET_NAME = "fantavega.firebasestorage.app";
// Prefisso nella bucket
const STORAGE_PREFIX = "player-photos";

// ============================================
// SETUP FIREBASE ADMIN
// ============================================

// Per autenticazione, devi:
// 1. Vai su Firebase Console > Project Settings > Service Accounts
// 2. Genera nuova chiave privata
// 3. Salva il file JSON e aggiorna il path sotto

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "../firebase-admin-key.json");

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`
❌ File chiave admin non trovato: ${SERVICE_ACCOUNT_PATH}

Per generare la chiave:
1. Vai su https://console.firebase.google.com/project/fantavega/settings/serviceaccounts/adminsdk
2. Clicca "Generate new private key"
3. Salva come: fantavega-mobile/firebase-admin-key.json

⚠️ NON committare questo file! Aggiungi a .gitignore.
`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: BUCKET_NAME,
});

const bucket = getStorage().bucket();

// ============================================
// UPLOAD LOGIC
// ============================================

interface UploadResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

async function uploadFile(localPath: string, remotePath: string): Promise<boolean> {
  try {
    // Check if already exists
    const [exists] = await bucket.file(remotePath).exists();
    if (exists) {
      return false; // skipped
    }

    await bucket.upload(localPath, {
      destination: remotePath,
      metadata: {
        contentType: "image/webp",
        cacheControl: "public, max-age=31536000", // 1 year cache
      },
    });
    return true;
  } catch (error) {
    throw error;
  }
}

async function uploadAllPhotos(): Promise<UploadResult> {
  const result: UploadResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  if (!fs.existsSync(PHOTOS_DIR)) {
    console.error(`❌ Cartella foto non trovata: ${PHOTOS_DIR}`);
    process.exit(1);
  }

  // Get all team directories
  const teams = fs.readdirSync(PHOTOS_DIR).filter((item) => {
    const itemPath = path.join(PHOTOS_DIR, item);
    return fs.statSync(itemPath).isDirectory() && item !== "loghi";
  });

  console.log(`📁 Trovate ${teams.length} squadre\n`);

  for (const team of teams) {
    const teamDir = path.join(PHOTOS_DIR, team);
    const files = fs.readdirSync(teamDir).filter((f) => f.endsWith(".webp"));

    console.log(`⚽ ${team}: ${files.length} foto`);

    for (const file of files) {
      const localPath = path.join(teamDir, file);
      const remotePath = `${STORAGE_PREFIX}/${team}/${file}`;

      try {
        const uploaded = await uploadFile(localPath, remotePath);
        if (uploaded) {
          result.success++;
          process.stdout.write(".");
        } else {
          result.skipped++;
          process.stdout.write("s");
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push(`${team}/${file}: ${error.message}`);
        process.stdout.write("x");
      }
    }
    console.log(); // newline after each team
  }

  return result;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("🚀 Upload Player Photos to Firebase Storage\n");
  console.log(`📂 Source: ${PHOTOS_DIR}`);
  console.log(`☁️  Bucket: ${BUCKET_NAME}`);
  console.log(`📍 Prefix: ${STORAGE_PREFIX}/\n`);

  const result = await uploadAllPhotos();

  console.log("\n========================================");
  console.log("📊 RISULTATO:");
  console.log(`   ✅ Caricati: ${result.success}`);
  console.log(`   ⏭️  Skipped:  ${result.skipped}`);
  console.log(`   ❌ Falliti:  ${result.failed}`);

  if (result.errors.length > 0) {
    console.log("\n⚠️ Errori:");
    result.errors.slice(0, 10).forEach((e) => console.log(`   - ${e}`));
    if (result.errors.length > 10) {
      console.log(`   ... e altri ${result.errors.length - 10}`);
    }
  }

  console.log("\n✨ URL base per le foto:");
  console.log(`   https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/player-photos%2F{team}%2F{file}?alt=media`);
}

main().catch(console.error);
