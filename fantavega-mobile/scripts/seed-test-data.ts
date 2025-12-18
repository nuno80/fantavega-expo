// scripts/seed-test-data.ts
// Script per popolare Firebase con dati di test completi (Lega + Aste)
// Eseguire con: pnpm exec ts-node scripts/seed-test-data.ts

import { ref, set } from "firebase/database";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { firestore, realtimeDb } from "../lib/firebase";
import type { LiveAuction } from "../types/schemas";

const TEST_LEAGUE_ID = "test-league-001";

async function seedTestData() {
  console.log("🚀 Seeding test data to Firebase...\n");

  // ========================================
  // 1. CREA LEGA IN FIRESTORE
  // ========================================
  console.log("📋 Creating test league in Firestore...");

  const leagueRef = doc(firestore, "leagues", TEST_LEAGUE_ID);
  await setDoc(leagueRef, {
    name: "Test Fantavega",
    leagueType: "classic",
    initialBudgetPerManager: 500,
    status: "draft_active", // Asta attiva!
    activeAuctionRoles: "P,D,C,A",
    slotsP: 3,
    slotsD: 8,
    slotsC: 8,
    slotsA: 6,
    minBid: 1,
    timerDurationMinutes: 1440,
    adminCreatorId: "admin-001",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  console.log(`✅ League "${TEST_LEAGUE_ID}" created\n`);

  // ========================================
  // 2. CREA ASTE IN REALTIME DATABASE
  // ========================================
  console.log("🎯 Creating test auctions in Realtime DB...");

  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const fiveMinutes = 5 * 60 * 1000;

  const testAuctions: Array<{ id: string; data: LiveAuction }> = [
    {
      id: "auction-001",
      data: {
        playerId: 101,
        playerName: "Lautaro Martínez",
        playerRole: "A",
        playerTeam: "Inter",
        playerPhotoUrl: null,
        startTime: now - oneHour,
        scheduledEndTime: now + oneHour * 12, // 12 ore
        currentBid: 45,
        currentBidderId: "user-002",
        currentBidderName: "TeamRossi",
        status: "active",
      },
    },
    {
      id: "auction-002",
      data: {
        playerId: 205,
        playerName: "Nicolò Barella",
        playerRole: "C",
        playerTeam: "Inter",
        playerPhotoUrl: null,
        startTime: now - oneHour,
        scheduledEndTime: now + oneHour * 6, // 6 ore
        currentBid: 35,
        currentBidderId: "user-003",
        currentBidderName: "TeamVerdi",
        status: "active",
      },
    },
    {
      id: "auction-003",
      data: {
        playerId: 312,
        playerName: "Alessandro Bastoni",
        playerRole: "D",
        playerTeam: "Inter",
        playerPhotoUrl: null,
        startTime: now - fiveMinutes,
        scheduledEndTime: now + fiveMinutes, // 5 minuti - URGENTE!
        currentBid: 0,
        currentBidderId: null,
        currentBidderName: null,
        status: "active",
      },
    },
    {
      id: "auction-004",
      data: {
        playerId: 401,
        playerName: "Mike Maignan",
        playerRole: "P",
        playerTeam: "Milan",
        playerPhotoUrl: null,
        startTime: now - 60000,
        scheduledEndTime: now + 45 * 1000, // 45 secondi - CRITICO!
        currentBid: 12,
        currentBidderId: "mock_user_001",
        currentBidderName: "TestManager",
        status: "active",
      },
    },
  ];

  for (const auction of testAuctions) {
    const auctionRef = ref(realtimeDb, `auctions/${TEST_LEAGUE_ID}/${auction.id}`);
    await set(auctionRef, auction.data);

    const timeLeft = Math.round((auction.data.scheduledEndTime - now) / 60000);
    const urgency = timeLeft < 1 ? "🔴" : timeLeft < 5 ? "🟡" : "🟢";
    console.log(`${urgency} ${auction.data.playerName} (${auction.data.playerRole}) - ${timeLeft} min`);
  }

  console.log(`\n🎉 Done! Created:`);
  console.log(`   - 1 league in Firestore: /leagues/${TEST_LEAGUE_ID}`);
  console.log(`   - ${testAuctions.length} auctions in RTDB: /auctions/${TEST_LEAGUE_ID}/`);
  console.log(`\n👉 Riavvia l'app Expo per vedere le aste!`);

  process.exit(0);
}

seedTestData().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
