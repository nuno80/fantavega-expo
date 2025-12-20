// scripts/updateLeagueStatus.ts
import { initializeApp } from "firebase/app";
import { doc, getFirestore, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4Sw7SwyW2ZPn9P3-uOeFsUAXRsPzhiIg",
  authDomain: "fantavega.firebaseapp.com",
  projectId: "fantavega",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateStatus(leagueId: string, newStatus: string) {
  const leagueRef = doc(db, "leagues", leagueId);
  await updateDoc(leagueRef, { status: newStatus });
  console.log(`League ${leagueId} status updated to: ${newStatus}`);
}

const LEAGUE_ID = "1gh2vWvzs7A8OVGxD37J";
updateStatus(LEAGUE_ID, "draft_active")
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
