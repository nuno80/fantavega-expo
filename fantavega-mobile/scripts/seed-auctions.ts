// scripts/seed-auctions.ts
// Script per popolare il Firebase Realtime Database con dati di test per le aste
// Eseguire con: npx ts-node scripts/seed-auctions.ts

import { ref, set } from "firebase/database";
import { realtimeDb } from "../lib/firebase";
import type { LiveAuction } from "../types/schemas";

// ID della lega di test (deve esistere in Firestore)
const TEST_LEAGUE_ID = "test-league-001";

// Giocatori di test per le aste
const testPlayers = [
  {
    id: "auction-001",
    playerId: 101,
    playerName: "Lautaro Martínez",
    playerRole: "A" as const,
    playerTeam: "Inter",
    playerPhotoUrl: null,
    currentBid: 45,
    currentBidderId: "user-002",
    currentBidderName: "TeamRossi",
  },
  {
    id: "auction-002",
    playerId: 205,
    playerName: "Nicolò Barella",
    playerRole: "C" as const,
    playerTeam: "Inter",
    playerPhotoUrl: null,
    currentBid: 35,
    currentBidderId: "user-003",
    currentBidderName: "TeamVerdi",
  },
  {
    id: "auction-003",
    playerId: 312,
    playerName: "Alessandro Bastoni",
    playerRole: "D" as const,
    playerTeam: "Inter",
    playerPhotoUrl: null,
    currentBid: 0, // Nessuna offerta ancora
    currentBidderId: null,
    currentBidderName: null,
  },
  {
    id: "auction-004",
    playerId: 401,
    playerName: "Mike Maignan",
    playerRole: "P" as const,
    playerTeam: "Milan",
    playerPhotoUrl: null,
    currentBid: 12,
    currentBidderId: "mock_user_001",
    currentBidderName: "TestManager", // L'utente mock sta vincendo questa
  },
];

async function seedAuctions() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const fiveMinutes = 5 * 60 * 1000;

  console.log("🚀 Seeding auction data to Firebase Realtime Database...\n");

  for (const player of testPlayers) {
    // Varia il tempo rimanente per ogni asta
    let scheduledEndTime: number;
    if (player.id === "auction-003") {
      // Asta urgente: scade in 5 minuti
      scheduledEndTime = now + fiveMinutes;
    } else if (player.id === "auction-004") {
      // Asta critica: scade in 45 secondi
      scheduledEndTime = now + 45 * 1000;
    } else {
      // Aste normali: scadono tra 1-24 ore
      scheduledEndTime = now + oneHour * (Math.random() * 23 + 1);
    }

    const auction: LiveAuction = {
      playerId: player.playerId,
      playerName: player.playerName,
      playerRole: player.playerRole,
      playerTeam: player.playerTeam,
      playerPhotoUrl: player.playerPhotoUrl,
      startTime: now - oneHour, // Iniziata 1 ora fa
      scheduledEndTime,
      currentBid: player.currentBid,
      currentBidderId: player.currentBidderId,
      currentBidderName: player.currentBidderName,
      status: "active",
    };

    const auctionRef = ref(realtimeDb, `auctions/${TEST_LEAGUE_ID}/${player.id}`);
    await set(auctionRef, auction);

    const timeLeft = Math.round((scheduledEndTime - now) / 60000);
    console.log(`✅ ${player.playerName} (${player.playerRole}) - ${timeLeft} min rimanenti`);
  }

  console.log(`\n🎉 Done! Created ${testPlayers.length} test auctions.`);
  console.log(`📍 Path: /auctions/${TEST_LEAGUE_ID}/`);
  console.log("\n⚠️  Ricorda: la lega deve esistere anche in Firestore per apparire nell'app!");

  process.exit(0);
}

seedAuctions().catch((error) => {
  console.error("❌ Error seeding auctions:", error);
  process.exit(1);
});
