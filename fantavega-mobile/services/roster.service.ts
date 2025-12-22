// services/roster.service.ts
// Servizio per gestione rose dei manager in Firebase Realtime Database
// Struttura: rosters/{leagueId}/{userId}/players/{playerId}

import { realtimeDb } from "@/lib/firebase";
import { PlayerRole } from "@/types";
import { get, onValue, ref, remove, set } from "firebase/database";
import { z } from "zod";

// ============================================
// SCHEMAS
// ============================================

export const RosterPlayerSchema = z.object({
  playerId: z.number(),
  playerName: z.string(),
  playerRole: z.enum(["P", "D", "C", "A"]),
  playerTeam: z.string(),
  playerPhotoUrl: z.string().nullish(),
  purchasePrice: z.number(),
  purchasedAt: z.number(), // timestamp
  auctionId: z.string().optional(), // ID dell'asta che ha generato l'acquisto
});

export type RosterPlayer = z.infer<typeof RosterPlayerSchema>;

// La rosa completa di un utente
export interface UserRoster {
  userId: string;
  leagueId: string;
  players: RosterPlayer[];
  totalSpent: number;
  playersByRole: {
    P: RosterPlayer[];
    D: RosterPlayer[];
    C: RosterPlayer[];
    A: RosterPlayer[];
  };
}

// ============================================
// REFERENCE HELPERS
// ============================================

const getRosterRef = (leagueId: string, userId: string) =>
  ref(realtimeDb, `rosters/${leagueId}/${userId}`);

const getRosterPlayersRef = (leagueId: string, userId: string) =>
  ref(realtimeDb, `rosters/${leagueId}/${userId}/players`);

const getRosterPlayerRef = (leagueId: string, userId: string, playerId: number) =>
  ref(realtimeDb, `rosters/${leagueId}/${userId}/players/${playerId}`);

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Ottiene la rosa completa di un utente (one-time fetch)
 */
export const getUserRoster = async (
  leagueId: string,
  userId: string
): Promise<UserRoster> => {
  const playersRef = getRosterPlayersRef(leagueId, userId);
  const snapshot = await get(playersRef);

  const players: RosterPlayer[] = [];
  const playersByRole: UserRoster["playersByRole"] = { P: [], D: [], C: [], A: [] };
  let totalSpent = 0;

  if (snapshot.exists()) {
    const data = snapshot.val();
    for (const playerData of Object.values(data)) {
      const parsed = RosterPlayerSchema.safeParse(playerData);
      if (parsed.success) {
        players.push(parsed.data);
        playersByRole[parsed.data.playerRole].push(parsed.data);
        totalSpent += parsed.data.purchasePrice;
      }
    }
  }

  return {
    userId,
    leagueId,
    players,
    totalSpent,
    playersByRole,
  };
};

/**
 * Sottoscrizione real-time alla rosa di un utente
 */
export const subscribeToUserRoster = (
  leagueId: string,
  userId: string,
  onData: (roster: UserRoster) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const playersRef = getRosterPlayersRef(leagueId, userId);

  return onValue(
    playersRef,
    (snapshot) => {
      const players: RosterPlayer[] = [];
      const playersByRole: UserRoster["playersByRole"] = { P: [], D: [], C: [], A: [] };
      let totalSpent = 0;

      if (snapshot.exists()) {
        const data = snapshot.val();
        for (const playerData of Object.values(data)) {
          const parsed = RosterPlayerSchema.safeParse(playerData);
          if (parsed.success) {
            players.push(parsed.data);
            playersByRole[parsed.data.playerRole].push(parsed.data);
            totalSpent += parsed.data.purchasePrice;
          }
        }
      }

      onData({
        userId,
        leagueId,
        players,
        totalSpent,
        playersByRole,
      });
    },
    (error) => {
      console.error("Roster subscription error:", error);
      onError?.(error);
    }
  );
};

// ============================================
// WRITE OPERATIONS
// ============================================

/**
 * Aggiunge un giocatore alla rosa (chiamato quando un'asta termina)
 * NOTA: Firebase RTDB non accetta undefined, quindi convertiamo a null
 */
export const addPlayerToRoster = async (
  leagueId: string,
  userId: string,
  player: RosterPlayer
): Promise<void> => {
  const playerRef = getRosterPlayerRef(leagueId, userId, player.playerId);

  // Firebase RTDB non accetta undefined, converti a null
  const sanitizedPlayer = {
    ...player,
    playerPhotoUrl: player.playerPhotoUrl ?? null,
    auctionId: player.auctionId ?? null,
  };

  await set(playerRef, sanitizedPlayer);
};

/**
 * Rimuove un giocatore dalla rosa
 */
export const removePlayerFromRoster = async (
  leagueId: string,
  userId: string,
  playerId: number
): Promise<void> => {
  const playerRef = getRosterPlayerRef(leagueId, userId, playerId);
  await remove(playerRef);
};

/**
 * Assegna il vincitore di un'asta alla sua rosa
 * Chiamato quando il timer scade e l'asta è completata
 */
export const assignAuctionWinnerToRoster = async (
  leagueId: string,
  winnerId: string,
  auctionId: string,
  playerData: {
    playerId: number;
    playerName: string;
    playerRole: PlayerRole;
    playerTeam: string;
    playerPhotoUrl?: string | null;
    purchasePrice: number;
  }
): Promise<void> => {
  const rosterPlayer: RosterPlayer = {
    playerId: playerData.playerId,
    playerName: playerData.playerName,
    playerRole: playerData.playerRole,
    playerTeam: playerData.playerTeam,
    playerPhotoUrl: playerData.playerPhotoUrl,
    purchasePrice: playerData.purchasePrice,
    purchasedAt: Date.now(),
    auctionId,
  };

  await addPlayerToRoster(leagueId, winnerId, rosterPlayer);
};
