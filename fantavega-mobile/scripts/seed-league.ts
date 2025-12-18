// scripts/seed-league.ts
// Script to create a test league in Firestore
// Run with: npx tsx scripts/seed-league.ts

import { initializeApp } from "firebase/app";
import { collection, doc, getFirestore, setDoc } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC4Sw7SwyW2ZPn9P3-uOeFsUAXRsPzhiIg",
  authDomain: "fantavega.firebaseapp.com",
  projectId: "fantavega",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

async function seedLeague() {
  console.log("🏆 Creating test league...");

  // Create league document
  const leagueRef = doc(collection(firestore, "leagues"));

  await setDoc(leagueRef, {
    name: "Test Fantavega 2025",
    leagueType: "classic",
    status: "participants_joining",
    initialBudgetPerManager: 500,
    slotsP: 3,
    slotsD: 8,
    slotsC: 8,
    slotsA: 6,
    minBid: 1,
    timerDurationMinutes: 1440,
    adminCreatorId: "test-admin",
    activeAuctionRoles: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`✅ League created with ID: ${leagueRef.id}`);

  // Add a test participant
  const participantRef = doc(firestore, "leagues", leagueRef.id, "participants", "test-user-1");
  await setDoc(participantRef, {
    userId: "test-user-1",
    currentBudget: 500,
    lockedCredits: 0,
    managerTeamName: "Team Nuno",
    playersP: 0,
    playersD: 0,
    playersC: 0,
    playersA: 0,
    joinedAt: new Date(),
  });

  console.log("✅ Test participant added");
  console.log("\n🎉 Done! Refresh the app to see the league.");
}

seedLeague().catch(console.error);
