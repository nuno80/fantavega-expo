// lib/realtime.ts
// Realtime Database helpers for live auction data

import {
  DataSnapshot,
  onValue,
  ref,
  serverTimestamp
} from "firebase/database";
import { realtimeDb } from "./firebase";

// Reference helpers
export const getAuctionRef = (leagueId: string, auctionId?: string) =>
  auctionId
    ? ref(realtimeDb, `auctions/${leagueId}/${auctionId}`)
    : ref(realtimeDb, `auctions/${leagueId}`);

export const getBidsRef = (leagueId: string, auctionId: string) =>
  ref(realtimeDb, `auctions/${leagueId}/${auctionId}/bids`);

export const getAutoBidsRef = (leagueId: string, auctionId: string) =>
  ref(realtimeDb, `autoBids/${leagueId}/${auctionId}`);

export const getUserPresenceRef = (userId: string) =>
  ref(realtimeDb, `userPresence/${userId}`);

// Subscribe to auction updates (returns unsubscribe function)
export const subscribeToAuction = (
  leagueId: string,
  auctionId: string,
  callback: (data: unknown) => void
) => {
  const auctionRef = getAuctionRef(leagueId, auctionId);
  return onValue(auctionRef, (snapshot: DataSnapshot) => {
    callback(snapshot.val());
  });
};

// Subscribe to all auctions in a league
export const subscribeToLeagueAuctions = (
  leagueId: string,
  callback: (data: unknown) => void
) => {
  const leagueAuctionsRef = getAuctionRef(leagueId);
  return onValue(leagueAuctionsRef, (snapshot: DataSnapshot) => {
    callback(snapshot.val());
  });
};

// Get server timestamp for bid times
export { serverTimestamp };

// Export realtimeDb for direct usage if needed
export { realtimeDb };
