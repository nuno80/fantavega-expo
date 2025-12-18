// services/player.service.ts
// Player data service using Firestore with Zod validation

import { firestore } from "@/lib/firebase";
import type { PlayerRole } from "@/types";
import { PlayerSchema, type Player } from "@/types/schemas";
import {
  collection,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";

const PLAYERS_COLLECTION = "players";

// Get all players (simple query for development)
export async function getAllPlayers(): Promise<Player[]> {
  const q = query(
    collection(firestore, PLAYERS_COLLECTION),
    orderBy("name"),
    limit(200)
  );

  const snapshot = await getDocs(q);
  const players: Player[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const parsed = PlayerSchema.safeParse({
      ...data,
      id: parseInt(doc.id, 10),
    });
    if (parsed.success) {
      players.push(parsed.data);
    }
  });

  return players;
}

// Get all players with pagination
export async function getPlayers(
  lastDoc?: DocumentSnapshot,
  pageSize: number = 50
): Promise<{ players: Player[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    collection(firestore, PLAYERS_COLLECTION),
    orderBy("name"),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const players: Player[] = [];
  let newLastDoc: DocumentSnapshot | null = null;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const parsed = PlayerSchema.safeParse({
      ...data,
      id: parseInt(doc.id, 10),
    });
    if (parsed.success) {
      players.push(parsed.data);
    }
  });

  if (snapshot.docs.length > 0) {
    newLastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  return { players, lastDoc: newLastDoc };
}

// Get player by ID
export async function getPlayerById(id: number): Promise<Player | null> {
  const docRef = doc(firestore, PLAYERS_COLLECTION, id.toString());
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const parsed = PlayerSchema.safeParse({
    ...docSnap.data(),
    id,
  });

  return parsed.success ? parsed.data : null;
}

// Search players by name
export async function searchPlayers(
  searchTerm: string,
  roleFilter?: PlayerRole
): Promise<Player[]> {
  // Firestore doesn't support full-text search, so we fetch and filter client-side
  // For production, consider Algolia or ElasticSearch
  const q = roleFilter
    ? query(
      collection(firestore, PLAYERS_COLLECTION),
      where("role", "==", roleFilter),
      orderBy("name"),
      limit(100)
    )
    : query(
      collection(firestore, PLAYERS_COLLECTION),
      orderBy("name"),
      limit(100)
    );

  const snapshot = await getDocs(q);
  const players: Player[] = [];
  const searchLower = searchTerm.toLowerCase();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const name = (data.name as string).toLowerCase();

    if (name.includes(searchLower)) {
      const parsed = PlayerSchema.safeParse({
        ...data,
        id: parseInt(doc.id, 10),
      });
      if (parsed.success) {
        players.push(parsed.data);
      }
    }
  });

  return players;
}

// Get players by role
export async function getPlayersByRole(role: PlayerRole): Promise<Player[]> {
  const q = query(
    collection(firestore, PLAYERS_COLLECTION),
    where("role", "==", role),
    orderBy("currentQuotation", "desc"),
    limit(100)
  );

  const snapshot = await getDocs(q);
  const players: Player[] = [];

  snapshot.docs.forEach((doc) => {
    const parsed = PlayerSchema.safeParse({
      ...doc.data(),
      id: parseInt(doc.id, 10),
    });
    if (parsed.success) {
      players.push(parsed.data);
    }
  });

  return players;
}
