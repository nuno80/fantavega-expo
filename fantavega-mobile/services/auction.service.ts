// services/auction.service.ts
// Servizio per operazioni CRUD su aste via Firebase Realtime Database
// Best Practice: Validazione Zod su tutti i dati esterni

import { realtimeDb } from "@/lib/firebase";
import { LiveAuction, LiveAuctionSchema } from "@/types/schemas";
import {
  get,
  onValue,
  push,
  ref,
  serverTimestamp,
  set,
  update
} from "firebase/database";

// ============================================
// REFERENCE HELPERS
// ============================================

const getLeagueAuctionsRef = (leagueId: string) =>
  ref(realtimeDb, `auctions/${leagueId}`);

const getAuctionRef = (leagueId: string, auctionId: string) =>
  ref(realtimeDb, `auctions/${leagueId}/${auctionId}`);

const getBidsRef = (leagueId: string, auctionId: string) =>
  ref(realtimeDb, `auctions/${leagueId}/${auctionId}/bids`);

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Ottiene tutte le aste attive di una lega (one-time fetch)
 */
export const getActiveAuctions = async (
  leagueId: string
): Promise<Map<string, LiveAuction>> => {
  const leagueRef = getLeagueAuctionsRef(leagueId);
  const snapshot = await get(leagueRef);

  const auctions = new Map<string, LiveAuction>();

  if (snapshot.exists()) {
    const data = snapshot.val();
    for (const [auctionId, auctionData] of Object.entries(data)) {
      // Valida con Zod prima di usare
      const parsed = LiveAuctionSchema.safeParse(auctionData);
      if (parsed.success && parsed.data.status === "active") {
        auctions.set(auctionId, parsed.data);
      }
    }
  }

  return auctions;
};

/**
 * Ottiene una singola asta (one-time fetch)
 */
export const getAuction = async (
  leagueId: string,
  auctionId: string
): Promise<LiveAuction | null> => {
  const auctionRef = getAuctionRef(leagueId, auctionId);
  const snapshot = await get(auctionRef);

  if (!snapshot.exists()) return null;

  const parsed = LiveAuctionSchema.safeParse(snapshot.val());
  return parsed.success ? parsed.data : null;
};

/**
 * Cerca un'asta attiva per un dato giocatore in una lega
 * Restituisce l'ID dell'asta se esiste, null altrimenti
 */
export const getActiveAuctionByPlayerId = async (
  leagueId: string,
  playerId: number
): Promise<{ auctionId: string; auction: LiveAuction } | null> => {
  const leagueRef = getLeagueAuctionsRef(leagueId);
  const snapshot = await get(leagueRef);

  if (!snapshot.exists()) return null;

  const data = snapshot.val();
  for (const [auctionId, auctionData] of Object.entries(data)) {
    const parsed = LiveAuctionSchema.safeParse(auctionData);
    if (parsed.success && parsed.data.status === "active" && parsed.data.playerId === playerId) {
      return { auctionId, auction: parsed.data };
    }
  }

  return null;
};

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Sottoscrizione real-time a una singola asta
 * Restituisce funzione di unsubscribe
 */
export const subscribeToAuction = (
  leagueId: string,
  auctionId: string,
  onData: (auction: LiveAuction | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const auctionRef = getAuctionRef(leagueId, auctionId);

  return onValue(
    auctionRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      const parsed = LiveAuctionSchema.safeParse(snapshot.val());
      if (parsed.success) {
        onData(parsed.data);
      } else {
        console.warn("Auction data validation failed:", parsed.error);
        onData(null);
      }
    },
    (error) => {
      console.error("Auction subscription error:", error);
      onError?.(error);
    }
  );
};

/**
 * Sottoscrizione real-time a tutte le aste di una lega
 * Restituisce funzione di unsubscribe
 */
export const subscribeToLeagueAuctions = (
  leagueId: string,
  onData: (auctions: Map<string, LiveAuction>) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const leagueRef = getLeagueAuctionsRef(leagueId);

  return onValue(
    leagueRef,
    (snapshot) => {
      const auctions = new Map<string, LiveAuction>();

      if (snapshot.exists()) {
        const data = snapshot.val();
        for (const [auctionId, auctionData] of Object.entries(data)) {
          const parsed = LiveAuctionSchema.safeParse(auctionData);
          if (parsed.success) {
            auctions.set(auctionId, parsed.data);
          }
        }
      }

      onData(auctions);
    },
    (error) => {
      console.error("League auctions subscription error:", error);
      onError?.(error);
    }
  );
};

// ============================================
// WRITE OPERATIONS (per admin/testing)
// ============================================

/**
 * Crea una nuova asta (solo per admin/testing)
 * In produzione questo sarà fatto dall'admin via Firestore trigger
 */
export const createAuction = async (
  leagueId: string,
  auctionData: Omit<LiveAuction, "startTime" | "currentBid" | "currentBidderId" | "currentBidderName" | "status">
): Promise<string> => {
  const leagueRef = getLeagueAuctionsRef(leagueId);
  const newAuctionRef = push(leagueRef);

  const now = Date.now();
  const timerMinutes = 1440; // Default 24h, in produzione preso da league config

  const fullAuction: LiveAuction = {
    ...auctionData,
    startTime: now,
    scheduledEndTime: now + timerMinutes * 60 * 1000,
    currentBid: 0,
    currentBidderId: null,
    currentBidderName: null,
    status: "active",
  };

  await set(newAuctionRef, fullAuction);

  return newAuctionRef.key!;
};

/**
 * Aggiorna lo stato di un'asta
 */
export const updateAuctionStatus = async (
  leagueId: string,
  auctionId: string,
  status: LiveAuction["status"]
): Promise<void> => {
  const auctionRef = getAuctionRef(leagueId, auctionId);
  await update(auctionRef, { status });
};

// Export per uso diretto se necessario
export { serverTimestamp };
