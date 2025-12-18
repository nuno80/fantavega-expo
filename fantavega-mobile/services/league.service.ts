// services/league.service.ts
// League data service using Firestore with Zod validation

import { firestore } from "@/lib/firebase";
import { LeagueParticipantSchema, LeagueSchema, type League, type LeagueParticipant } from "@/types/schemas";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const LEAGUES_COLLECTION = "leagues";
const PARTICIPANTS_SUBCOLLECTION = "participants";

// Get all leagues
export async function getAllLeagues(): Promise<League[]> {
  const q = query(
    collection(firestore, LEAGUES_COLLECTION),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  const leagues: League[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const parsed = LeagueSchema.safeParse({
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    });
    if (parsed.success) {
      leagues.push(parsed.data);
    }
  });

  return leagues;
}

// Get league by ID
export async function getLeagueById(leagueId: string): Promise<League | null> {
  const docRef = doc(firestore, LEAGUES_COLLECTION, leagueId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  const parsed = LeagueSchema.safeParse({
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  });

  return parsed.success ? parsed.data : null;
}

// Get user's leagues (where user is a participant)
export async function getUserLeagues(userId: string): Promise<League[]> {
  // For now, return all leagues - will filter by participant when auth is implemented
  return getAllLeagues();
}

// Get league by invite code
export async function getLeagueByInviteCode(code: string): Promise<League | null> {
  const q = query(
    collection(firestore, LEAGUES_COLLECTION),
    where("inviteCode", "==", code.toUpperCase())
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();
  const parsed = LeagueSchema.safeParse({
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  });

  return parsed.success ? parsed.data : null;
}

// Get league participants
export async function getLeagueParticipants(leagueId: string): Promise<LeagueParticipant[]> {
  const participantsRef = collection(
    firestore,
    LEAGUES_COLLECTION,
    leagueId,
    PARTICIPANTS_SUBCOLLECTION
  );

  const snapshot = await getDocs(participantsRef);
  const participants: LeagueParticipant[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const parsed = LeagueParticipantSchema.safeParse({
      ...data,
      joinedAt: data.joinedAt?.toDate?.() || new Date(),
    });
    if (parsed.success) {
      participants.push(parsed.data);
    }
  });

  return participants;
}

// Create a new league
export async function createLeague(
  leagueData: Omit<League, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const leagueRef = doc(collection(firestore, LEAGUES_COLLECTION));

  await setDoc(leagueRef, {
    ...leagueData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return leagueRef.id;
}

// Update league status
export async function updateLeagueStatus(
  leagueId: string,
  status: League["status"]
): Promise<void> {
  const leagueRef = doc(firestore, LEAGUES_COLLECTION, leagueId);
  await updateDoc(leagueRef, {
    status,
    updatedAt: new Date(),
  });
}

// Update league settings
export async function updateLeague(
  leagueId: string,
  data: Partial<Omit<League, "id" | "createdAt" | "adminCreatorId">>
): Promise<void> {
  const leagueRef = doc(firestore, LEAGUES_COLLECTION, leagueId);
  await updateDoc(leagueRef, {
    ...data,
    updatedAt: new Date(),
  });
}

// Add participant to league
export async function addParticipant(
  leagueId: string,
  userId: string,
  teamName: string,
  initialBudget: number
): Promise<void> {
  const participantRef = doc(
    firestore,
    LEAGUES_COLLECTION,
    leagueId,
    PARTICIPANTS_SUBCOLLECTION,
    userId
  );

  await setDoc(participantRef, {
    userId,
    managerTeamName: teamName,
    currentBudget: initialBudget,
    lockedCredits: 0,
    playersP: 0,
    playersD: 0,
    playersC: 0,
    playersA: 0,
    joinedAt: new Date(),
  });
}

// Remove participant from league
export async function removeParticipant(
  leagueId: string,
  userId: string
): Promise<void> {
  const participantRef = doc(
    firestore,
    LEAGUES_COLLECTION,
    leagueId,
    PARTICIPANTS_SUBCOLLECTION,
    userId
  );
  await deleteDoc(participantRef);
}
