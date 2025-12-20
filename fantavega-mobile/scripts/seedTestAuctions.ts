// scripts/seedTestAuctions.ts
// Script per creare aste di test in Firebase Realtime Database
// Uso: npx ts-node scripts/seedTestAuctions.ts

import { initializeApp } from "firebase/app";
import { getDatabase, push, ref, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC4Sw7SwyW2ZPn9P3-uOeFsUAXRsPzhiIg",
  authDomain: "fantavega.firebaseapp.com",
  databaseURL: "https://fantavega-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fantavega",
  storageBucket: "fantavega.firebasestorage.app",
  messagingSenderId: "201333299716",
  appId: "1:201333299716:web:ab1182838b45b133977351",
  measurementId: "G-BCJJ4TJTQZ"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Giocatori di test
const testPlayers = [
  { id: 1001, name: "Mike Maignan", role: "P", team: "Milan", photoUrl: null },
  { id: 1002, name: "Alessandro Bastoni", role: "D", team: "Inter", photoUrl: null },
  { id: 1003, name: "Nicolò Barella", role: "C", team: "Inter", photoUrl: null },
  { id: 1004, name: "Victor Osimhen", role: "A", team: "Napoli", photoUrl: null },
  { id: 1005, name: "Lautaro Martinez", role: "A", team: "Inter", photoUrl: null },
];

// Crea aste per una lega
async function createTestAuctions(leagueId: string) {
  console.log(`Creating test auctions for league: ${leagueId}`);

  const now = Date.now();
  const timerMs = 60 * 60 * 1000; // 1 hour

  for (const player of testPlayers) {
    const auctionRef = push(ref(db, `auctions/${leagueId}`));

    const auction = {
      playerId: player.id,
      playerName: player.name,
      playerRole: player.role,
      playerTeam: player.team,
      playerPhotoUrl: player.photoUrl,
      startTime: now,
      scheduledEndTime: now + timerMs,
      currentBid: 1, // Starting bid
      currentBidderId: null,
      currentBidderName: null,
      status: "active",
      userStates: {},
    };

    await set(auctionRef, auction);
    console.log(`Created auction for ${player.name} (ID: ${auctionRef.key})`);
  }

  console.log("Done! Created 5 test auctions.");
}

// ID della lega dalla Firebase Console
const LEAGUE_ID = "1gh2vWvzs7A8OVGxD37J"; // Test5

createTestAuctions(LEAGUE_ID)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
