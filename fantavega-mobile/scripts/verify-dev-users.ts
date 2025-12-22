// scripts/verify-dev-users.ts
// Verifica che gli utenti dev esistano in Firebase Auth
// Run with: npx tsx scripts/verify-dev-users.ts

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as fs from "fs";
import * as path from "path";

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "../firebase-admin-key.json");
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();

const DEV_USERS = [
  "dev1@fantavega.test",
  "dev2@fantavega.test",
  "dev3@fantavega.test",
  "dev4@fantavega.test",
  "dev5@fantavega.test",
];

async function main() {
  console.log("🔍 Verifica utenti dev in Firebase Auth\n");

  for (const email of DEV_USERS) {
    try {
      const user = await auth.getUserByEmail(email);
      console.log(`✅ ${email}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Nome: ${user.displayName ?? "(non impostato)"}`);
      console.log("");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        console.log(`❌ ${email} - NON ESISTE`);
      } else {
        console.log(`⚠️ ${email} - Errore: ${error.message}`);
      }
    }
  }
}

main().catch(console.error);
