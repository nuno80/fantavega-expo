// services/bid.service.ts
// Servizio per la logica delle offerte CON AUTO-BID
// Best Practice: Validazione Zod, transazioni atomiche Firebase

import { realtimeDb } from "@/lib/firebase";
import { Bid, BidSchema, LiveAuction, LiveAuctionSchema } from "@/types/schemas";
import {
  get,
  push,
  ref,
  runTransaction,
  set
} from "firebase/database";

// ============================================
// TYPES
// ============================================

interface PlaceBidParams {
  leagueId: string;
  auctionId: string;
  userId: string;       // TODO: Sostituire con auth reale
  username: string;
  amount: number;
  bidType?: "manual" | "quick";
  maxAmount?: number;   // Auto-bid max amount (eBay-style)
}

interface PlaceBidResult {
  success: boolean;
  message: string;
  newBidId?: string;
  auction?: LiveAuction;
}

interface BudgetCheckResult {
  canBid: boolean;
  availableBudget: number;
  reason?: string;
}

// Mock user ID per development (da sostituire con Firebase Auth)
export const MOCK_USER_ID = "mock_user_001";
export const MOCK_USERNAME = "TestManager";

// ============================================
// BUDGET CHECK (Client-side ottimistico)
// ============================================

/**
 * Verifica client-side se l'utente può permettersi l'offerta
 * NOTA: Il server farà sempre la validazione finale
 */
export const checkBudgetClientSide = (
  currentBudget: number,
  lockedCredits: number,
  proposedBid: number,
  currentBidOnPlayer: number // se già stai vincendo, paghi solo la differenza
): BudgetCheckResult => {
  const availableBudget = currentBudget - lockedCredits;
  const effectiveCost = proposedBid - currentBidOnPlayer;

  if (effectiveCost <= 0) {
    return {
      canBid: false,
      availableBudget,
      reason: "La tua offerta deve essere maggiore di quella attuale",
    };
  }

  if (effectiveCost > availableBudget) {
    return {
      canBid: false,
      availableBudget,
      reason: `Budget insufficiente. Disponibili: ${availableBudget} crediti`,
    };
  }

  return {
    canBid: true,
    availableBudget,
  };
};

// ============================================
// PLACE BID (con transazione atomica)
// ============================================

/**
 * Piazza un'offerta su un'asta esistente
 * Usa Firebase transaction per garantire atomicità
 */
export const placeBid = async (
  params: PlaceBidParams
): Promise<PlaceBidResult> => {
  const { leagueId, auctionId, userId, username, amount, bidType = "manual", maxAmount } = params;

  const auctionRef = ref(realtimeDb, `auctions/${leagueId}/${auctionId}`);

  try {
    // Transazione atomica per evitare race conditions
    const result = await runTransaction(auctionRef, (currentData) => {
      if (currentData === null) {
        // L'asta non esiste
        return undefined; // Abort transaction
      }

      const parsed = LiveAuctionSchema.safeParse(currentData);
      if (!parsed.success) {
        console.warn("Invalid auction data:", parsed.error);
        return undefined;
      }

      const auction = parsed.data;

      // Validazioni
      if (auction.status !== "active") {
        return undefined; // Asta non attiva
      }

      if (amount <= auction.currentBid) {
        return undefined; // Offerta troppo bassa
      }

      const now = Date.now();
      if (now >= auction.scheduledEndTime) {
        return undefined; // Asta scaduta
      }

      // Aggiorna l'asta con la nuova offerta
      const updatedAuction: LiveAuction = {
        ...auction,
        currentBid: amount,
        currentBidderId: userId,
        currentBidderName: username,
        // Reset timer se mancano meno di 5 minuti (anti-snipe)
        scheduledEndTime:
          auction.scheduledEndTime - now < 5 * 60 * 1000
            ? now + 5 * 60 * 1000
            : auction.scheduledEndTime,
      };

      return updatedAuction;
    });

    if (!result.committed) {
      return {
        success: false,
        message: "Offerta non valida. L'asta potrebbe essere chiusa o l'offerta troppo bassa.",
      };
    }

    // Aggiungi il bid allo storico
    const bidsRef = ref(realtimeDb, `auctions/${leagueId}/${auctionId}/bids`);
    const newBidRef = push(bidsRef);

    const bidRecord: Bid = {
      userId,
      username,
      amount,
      bidTime: Date.now(),
      bidType,
    };

    // Valida prima di scrivere
    const validatedBid = BidSchema.parse(bidRecord);
    await push(bidsRef, validatedBid);

    // Se c'è un auto-bid, salvalo PRIMA di registrare il bid
    // Questo garantisce atomicità (auto-bid salvato insieme all'offerta)
    if (maxAmount && maxAmount > amount) {
      const autoBidRef = ref(realtimeDb, `autoBids/${leagueId}/${auctionId}/${userId}`);
      await set(autoBidRef, {
        userId,
        username,
        maxAmount,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      message: maxAmount
        ? `Offerta ${amount} + Auto-bid max ${maxAmount} piazzati!`
        : `Offerta di ${amount} crediti piazzata con successo!`,
      newBidId: newBidRef.key ?? undefined,
      auction: result.snapshot.val() as LiveAuction,
    };
  } catch (error) {
    console.error("Error placing bid:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Errore durante l'offerta",
    };
  }
};

// ============================================
// QUICK BID HELPERS
// ============================================

/**
 * Calcola l'importo per quick bid (+1, +5, +10)
 */
export const calculateQuickBidAmount = (
  currentBid: number,
  increment: 1 | 5 | 10
): number => {
  return currentBid + increment;
};

/**
 * Piazza un quick bid (+1, +5, +10)
 */
export const placeQuickBid = async (
  leagueId: string,
  auctionId: string,
  userId: string,
  username: string,
  currentBid: number,
  increment: 1 | 5 | 10
): Promise<PlaceBidResult> => {
  const newAmount = calculateQuickBidAmount(currentBid, increment);

  return placeBid({
    leagueId,
    auctionId,
    userId,
    username,
    amount: newAmount,
    bidType: "quick",
  });
};

// ============================================
// BID HISTORY
// ============================================

/**
 * Ottiene lo storico delle offerte per un'asta
 */
export const getBidHistory = async (
  leagueId: string,
  auctionId: string
): Promise<Bid[]> => {
  const bidsRef = ref(realtimeDb, `auctions/${leagueId}/${auctionId}/bids`);
  const snapshot = await get(bidsRef);

  if (!snapshot.exists()) return [];

  const bids: Bid[] = [];
  const data = snapshot.val();

  for (const bidData of Object.values(data)) {
    const parsed = BidSchema.safeParse(bidData);
    if (parsed.success) {
      bids.push(parsed.data);
    }
  }

  // Ordina per tempo (più recente prima)
  return bids.sort((a, b) => b.bidTime - a.bidTime);
};

// ============================================
// CLOSE AUCTION & ASSIGN WINNER
// ============================================

import { PlayerRole } from "@/types";
import { getAuction, updateAuctionStatus } from "./auction.service";
import { assignAuctionWinnerToRoster } from "./roster.service";

interface CloseAuctionResult {
  success: boolean;
  message: string;
  winnerId?: string;
  winnerName?: string;
  finalPrice?: number;
}

/**
 * Chiude un'asta scaduta e assegna il giocatore al vincitore
 * Chiamare quando il timer è scaduto
 */
export const closeAuctionAndAssign = async (
  leagueId: string,
  auctionId: string
): Promise<CloseAuctionResult> => {
  try {
    // 1. Ottieni l'asta
    const auction = await getAuction(leagueId, auctionId);

    if (!auction) {
      return { success: false, message: "Asta non trovata" };
    }

    if (auction.status !== "active") {
      return { success: false, message: `Asta già ${auction.status}` };
    }

    const now = Date.now();
    if (now < auction.scheduledEndTime) {
      return { success: false, message: "Il timer non è ancora scaduto" };
    }

    // 2. Controlla se c'è un vincitore
    if (!auction.currentBidderId || auction.currentBid === 0) {
      // Nessun offerente - asta cancellata
      await updateAuctionStatus(leagueId, auctionId, "cancelled");
      return { success: true, message: "Asta chiusa senza vincitori" };
    }

    // 3. Assegna il giocatore al vincitore
    await assignAuctionWinnerToRoster(
      leagueId,
      auction.currentBidderId,
      auctionId,
      {
        playerId: auction.playerId,
        playerName: auction.playerName,
        playerRole: auction.playerRole as PlayerRole,
        playerTeam: auction.playerTeam,
        playerPhotoUrl: auction.playerPhotoUrl,
        purchasePrice: auction.currentBid,
      }
    );

    // 4. Aggiorna stato asta a "completed"
    await updateAuctionStatus(leagueId, auctionId, "sold");

    return {
      success: true,
      message: `${auction.playerName} assegnato a ${auction.currentBidderName} per ${auction.currentBid} crediti!`,
      winnerId: auction.currentBidderId,
      winnerName: auction.currentBidderName ?? undefined,
      finalPrice: auction.currentBid,
    };
  } catch (error) {
    console.error("Error closing auction:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Errore chiusura asta",
    };
  }
};

/**
 * Controlla e chiudi tutte le aste scadute di una lega
 * Utile per chiamata periodica o al caricamento
 */
export const closeExpiredAuctions = async (
  leagueId: string,
  auctions: Map<string, LiveAuction>
): Promise<CloseAuctionResult[]> => {
  const now = Date.now();
  const results: CloseAuctionResult[] = [];

  for (const [auctionId, auction] of auctions) {
    if (auction.status === "active" && now >= auction.scheduledEndTime) {
      const result = await closeAuctionAndAssign(leagueId, auctionId);
      results.push(result);
    }
  }

  return results;
};
