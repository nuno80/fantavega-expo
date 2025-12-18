// lib/firestore.ts
// Firestore helpers for structured data (leagues, players, users)

import {
  collection,
  doc,
  Timestamp
} from "firebase/firestore";
import { firestore } from "./firebase";

// Collection references
export const usersCollection = collection(firestore, "users");
export const playersCollection = collection(firestore, "players");
export const leaguesCollection = collection(firestore, "leagues");

// Helper: Get document reference
export const getDocRef = (collectionName: string, docId: string) =>
  doc(firestore, collectionName, docId);

// Helper: Get subcollection reference
export const getSubcollection = (
  parentCollection: string,
  parentId: string,
  subcollectionName: string
) => collection(firestore, parentCollection, parentId, subcollectionName);

// Timestamp helpers
export const serverTimestamp = () => Timestamp.now();
export const toTimestamp = (date: Date) => Timestamp.fromDate(date);
export const fromTimestamp = (timestamp: Timestamp) => timestamp.toDate();

// Export Firestore for direct usage if needed
export { firestore };
