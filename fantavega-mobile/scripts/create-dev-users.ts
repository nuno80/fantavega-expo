// scripts/create-dev-users.ts
// Crea utenti di test in Firebase Auth
// Run with: npx tsx scripts/create-dev-users.ts

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
  { email: "dev1@fantavega.test", displayName: "Mario Rossi", password: "dev123456" },
  { email: "dev2@fantavega.test", displayName: "Luigi Bianchi", password: "dev123456" },
  { email: "dev3@fantavega.test", displayName: "Paolo Verdi", password: "dev123456" },
  { email: "dev4@fantavega.test", displayName: "Andrea Neri", password: "dev123456" },
  { email: "dev5@fantavega.test", displayName: "Marco Gialli", password: "dev123456" },
];

async function main() {
  console.log("🔧 Creazione utenti dev in Firebase Auth\n");

  for (const user of DEV_USERS) {
    try {
      const created = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        emailVerified: true,
      });
      console.log(`✅ ${user.email}`);
      console.log(`   UID: ${created.uid}`);
      console.log(`   Nome: ${created.displayName}`);
      console.log("");
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        console.log(`⏭️ ${user.email} - già esiste`);
      } else {
        console.log(`❌ ${user.email} - Errore: ${error.message}`);
      }
    }
  }

  console.log("\n📋 Credenziali per login:");
  console.log("   Password: dev123456 (uguale per tutti)");
}

main().catch(console.error);
