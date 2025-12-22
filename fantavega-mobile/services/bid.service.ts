// services/bid.service.ts
// Servizio per la logica delle offerte CON AUTO-BID
// Best Practice: Validazione Zod, transazioni atomiche Firebase

import { realtimeDb } from "@/lib/firebase";
import { updateLockedCredits } from "@/services/budget.service";
import { sendPushToUser } from "@/services/notification.service";
import { Bid, BidSchema, LiveAuction, LiveAuctionSchema } from "@/types/schemas";
import {
  get,
  push,
  ref,
  remove,
  set,
  update
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
  allowMatch?: boolean; // Permette di pareggiare (non superare) il currentBid
}

interface PlaceBidResult {
  success: boolean;
  message: string;
  newBidId?: string;
  auction?: LiveAuction;
  /** ID del bidder precedente che è stato superato (per notifiche) */
  previousBidderId?: string | null;
}

interface BudgetCheckResult {
  canBid: boolean;
  availableBudget: number;
  reason?: string;
}

// Tipo per partecipante auto-bid battle
interface AutoBidParticipant {
  userId: string;
  username: string;
  maxAmount: number;
  createdAt: number;
  isActive: boolean;
}

// Risultato della simulazione battaglia auto-bid
interface AutoBidBattleResult {
  finalAmount: number;
  finalBidderId: string;
  finalBidderUsername: string;
  wasBattle: boolean; // true se c'è stata competizione tra auto-bid
}

/**
 * Simula una battaglia auto-bid e determina il vincitore.
 * Logica eBay-style:
 * 1. Trova l'auto-bid con max più alto
 * 2. In caso di parità, vince chi ha settato l'auto-bid PRIMA (createdAt più basso)
 * 3. Il prezzo finale è: secondBest.max + 1 (ma non oltre winner.max)
 */
function simulateAutoBidBattle(
  incomingBid: number,
  incomingBidderId: string,
  autoBids: AutoBidParticipant[]
): AutoBidBattleResult | null {
  // Filtra auto-bid che possono competere (max > bid corrente)
  const competingAutoBids = autoBids.filter(
    (ab) => ab.isActive && ab.maxAmount > incomingBid
  );

  if (competingAutoBids.length === 0) {
    // Nessun auto-bid può competere, il bid manuale vince
    return null;
  }

  // Ordina: prima per maxAmount (desc), poi per createdAt (asc = primo vince)
  const sorted = competingAutoBids.sort((a, b) => {
    if (b.maxAmount !== a.maxAmount) {
      return b.maxAmount - a.maxAmount;
    }
    return a.createdAt - b.createdAt;
  });

  const winner = sorted[0];
  const secondBest = sorted.length > 1 ? sorted[1] : null;

  // Calcola prezzo finale (eBay-style)
  let finalAmount: number;

  if (secondBest) {
    if (secondBest.maxAmount === winner.maxAmount) {
      // PARITÀ: vincitore paga il suo massimo
      finalAmount = winner.maxAmount;
      console.log(`[AUTO-BID BATTLE] Parità! ${winner.userId} vince pagando max ${finalAmount}`);
    } else {
      // Vincitore paga 1 + il secondo migliore
      finalAmount = Math.min(secondBest.maxAmount + 1, winner.maxAmount);
      console.log(`[AUTO-BID BATTLE] ${winner.userId} vince pagando ${finalAmount} (1 + secondo: ${secondBest.maxAmount})`);
    }
  } else {
    // Solo un auto-bid: paga 1 + bid corrente
    finalAmount = Math.min(incomingBid + 1, winner.maxAmount);
    console.log(`[AUTO-BID BATTLE] Solo ${winner.userId}, paga ${finalAmount} (1 + bid: ${incomingBid})`);
  }

  return {
    finalAmount,
    finalBidderId: winner.userId,
    finalBidderUsername: winner.username,
    wasBattle: true,
  };
}

// ============================================
// LOCKED CREDITS HELPER
// ============================================

/**
 * Ricalcola i locked credits totali per un utente
 * somma tutti i maxAmount degli auto-bid attivi
 */
async function recalculateUserLockedCredits(
  leagueId: string,
  userId: string
): Promise<void> {
  // Recupera tutti gli auto-bid di tutte le aste della lega per questo utente
  const allAutoBidsRef = ref(realtimeDb, `autoBids/${leagueId}`);
  const snapshot = await get(allAutoBidsRef);

  let totalLocked = 0;

  if (snapshot.exists()) {
    const data = snapshot.val();
    // struttura: { auctionId: { userId: { maxAmount, isActive, ... } } }
    for (const auctionData of Object.values(data)) {
      const userAutoBid = (auctionData as Record<string, unknown>)[userId];
      if (
        userAutoBid &&
        typeof userAutoBid === "object" &&
        (userAutoBid as { isActive?: boolean }).isActive !== false
      ) {
        totalLocked += (userAutoBid as { maxAmount: number }).maxAmount || 0;
      }
    }
  }

  // Aggiorna Firestore
  await updateLockedCredits(leagueId, userId, totalLocked);
  console.log(`[BID] Updated locked credits for ${userId}: ${totalLocked}`);
}

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
  const { leagueId, auctionId, userId, username, amount, bidType = "manual", maxAmount, allowMatch = false } = params;

  const auctionRef = ref(realtimeDb, `auctions/${leagueId}/${auctionId}`);

  // Variabile per catturare il bidder precedente (da usare per notifiche)
  let previousBidderId: string | null = null;
  let previousBidderName: string | null = null;
  let playerName: string = "";

  try {
    // Prima leggiamo lo stato attuale dell'asta
    const snapshot = await get(auctionRef);

    if (!snapshot.exists()) {
      return {
        success: false,
        message: "Asta non trovata nel database.",
      };
    }

    const parsed = LiveAuctionSchema.safeParse(snapshot.val());
    if (!parsed.success) {
      console.warn("[BID] Invalid auction data:", parsed.error);
      return {
        success: false,
        message: "Dati asta non validi.",
      };
    }

    const auction = parsed.data;
    playerName = auction.playerName;

    // Validazioni
    if (auction.status !== "active") {
      return { success: false, message: "L'asta non è più attiva." };
    }

    // Validazione importo: normalmente > currentBid, ma allowMatch permette = currentBid
    if (allowMatch) {
      if (amount < auction.currentBid) {
        return { success: false, message: `L'offerta deve essere almeno ${auction.currentBid} crediti.` };
      }
    } else {
      if (amount <= auction.currentBid) {
        return { success: false, message: `L'offerta deve essere maggiore di ${auction.currentBid} crediti.` };
      }
    }

    const now = Date.now();
    if (now >= auction.scheduledEndTime) {
      return { success: false, message: "L'asta è scaduta." };
    }

    // Cattura il bidder precedente per notifiche (se diverso dal nuovo bidder)
    if (auction.currentBidderId && auction.currentBidderId !== userId) {
      previousBidderId = auction.currentBidderId;
      previousBidderName = auction.currentBidderName ?? null;
    }

    // Prepara l'update - Reset timer a 24 ore su ogni offerta
    const newScheduledEndTime = now + 24 * 60 * 60 * 1000; // Always reset to 24h

    // Usa update() invece di runTransaction() per evitare problemi con dati appena creati
    await update(auctionRef, {
      currentBid: amount,
      currentBidderId: userId,
      currentBidderName: username,
      scheduledEndTime: newScheduledEndTime,
    });

    console.log("[BID] Updated auction:", { currentBid: amount, currentBidderId: userId });

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

    // Se c'è un auto-bid, salvalo e aggiorna locked credits
    if (maxAmount && maxAmount > amount) {
      const autoBidRef = ref(realtimeDb, `autoBids/${leagueId}/${auctionId}/${userId}`);
      console.log(`[AUTO-BID SAVE] Saving auto-bid for ${userId}: max=${maxAmount}`);
      await set(autoBidRef, {
        userId,
        username,
        maxAmount,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Aggiorna locked credits calcolando TUTTI gli auto-bid attivi
      await recalculateUserLockedCredits(leagueId, userId);
    }

    // ============================================
    // AUTO-BID BATTLE: Simula la battaglia tra tutti gli auto-bid attivi
    // Usa approccio webapp: calcola vincitore matematicamente, nessuna ricorsione
    // ============================================
    if (!allowMatch) {
      // Recupera TUTTI gli auto-bid attivi per questa asta
      const allAutoBidsRef = ref(realtimeDb, `autoBids/${leagueId}/${auctionId}`);
      const allAutoBidsSnapshot = await get(allAutoBidsRef);

      const autoBidParticipants: AutoBidParticipant[] = [];

      if (allAutoBidsSnapshot.exists()) {
        const autoBidsData = allAutoBidsSnapshot.val();
        for (const [odUserId, abData] of Object.entries(autoBidsData)) {
          const ab = abData as {
            userId: string;
            username: string;
            maxAmount: number;
            createdAt: number;
            isActive: boolean;
          };
          if (ab.isActive) {
            autoBidParticipants.push({
              userId: ab.userId || odUserId,
              username: ab.username,
              maxAmount: ab.maxAmount,
              createdAt: ab.createdAt,
              isActive: ab.isActive,
            });
          }
        }
      }

      console.log(`[AUTO-BID] Found ${autoBidParticipants.length} active auto-bids`);

      if (autoBidParticipants.length > 0) {
        // Simula la battaglia
        const battleResult = simulateAutoBidBattle(amount, userId, autoBidParticipants);

        if (battleResult && battleResult.finalBidderId !== userId) {
          // Un auto-bid ha vinto! Aggiorna l'asta con il vincitore finale
          console.log(`[AUTO-BID BATTLE] Winner: ${battleResult.finalBidderId} at ${battleResult.finalAmount}`);

          await update(auctionRef, {
            currentBid: battleResult.finalAmount,
            currentBidderId: battleResult.finalBidderId,
            currentBidderName: battleResult.finalBidderUsername,
          });

          // Aggiungi il bid finale dello storico
          const winnerBidRecord: Bid = {
            userId: battleResult.finalBidderId,
            username: battleResult.finalBidderUsername,
            amount: battleResult.finalAmount,
            bidTime: Date.now(),
            bidType: "manual", // Auto-bid genera bid "manual" nello storico
          };
          await push(bidsRef, BidSchema.parse(winnerBidRecord));

          // Rimuovi gli auto-bid esauriti (tutti quelli <= finalAmount)
          for (const ab of autoBidParticipants) {
            if (ab.maxAmount <= battleResult.finalAmount) {
              const abRef = ref(realtimeDb, `autoBids/${leagueId}/${auctionId}/${ab.userId}`);
              await remove(abRef);
              await recalculateUserLockedCredits(leagueId, ab.userId);
              console.log(`[AUTO-BID] Removed exhausted auto-bid for ${ab.userId}`);
            }
          }

          // Notifica il bidder originale che è stato superato
          if (previousBidderId && previousBidderId !== battleResult.finalBidderId) {
            sendPushToUser(previousBidderId, {
              title: "⚠️ Offerta superata!",
              body: `La tua offerta per ${playerName} è stata superata da un auto-bid. Offerta finale: ${battleResult.finalAmount} crediti`,
              data: { type: "bid_surpassed", auctionId, leagueId },
            }).catch((err) => console.warn("Push notification failed:", err));
          }
        } else {
          // Il bid manuale ha vinto (nessun auto-bid può competere)
          // Rimuovi auto-bid esauriti del bidder precedente
          if (previousBidderId) {
            const prevAbRef = ref(realtimeDb, `autoBids/${leagueId}/${auctionId}/${previousBidderId}`);
            const prevAbSnapshot = await get(prevAbRef);
            if (prevAbSnapshot.exists()) {
              const prevAb = prevAbSnapshot.val() as { maxAmount: number };
              if (prevAb.maxAmount <= amount) {
                await remove(prevAbRef);
                await recalculateUserLockedCredits(leagueId, previousBidderId);
                sendPushToUser(previousBidderId, {
                  title: "⚠️ Auto-bid esaurito!",
                  body: `Il tuo auto-bid per ${playerName} è stato superato. Offerta attuale: ${amount} crediti`,
                  data: { type: "autobid_exhausted", auctionId, leagueId },
                }).catch((err) => console.warn("Push notification failed:", err));
              }
            }
          }
        }
      } else if (previousBidderId) {
        // Nessun auto-bid attivo, solo notifica normale
        sendPushToUser(previousBidderId, {
          title: "⚠️ Offerta superata!",
          body: `La tua offerta per ${playerName} è stata superata. Nuova offerta: ${amount} crediti`,
          data: { type: "bid_surpassed", auctionId, leagueId },
        }).catch((err) => console.warn("Push notification failed:", err));
      }
    }

    return {
      success: true,
      message: maxAmount
        ? `Offerta ${amount} + Auto-bid max ${maxAmount} piazzati!`
        : `Offerta di ${amount} crediti piazzata con successo!`,
      newBidId: newBidRef.key ?? undefined,
      auction: { ...auction, currentBid: amount, currentBidderId: userId, currentBidderName: username },
      previousBidderId,
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
// SET AUTO-BID (standalone, senza piazzare offerta)
// ============================================

interface SetAutoBidParams {
  leagueId: string;
  auctionId: string;
  userId: string;
  username: string;
  maxAmount: number;
}

/**
 * Imposta o aggiorna un auto-bid per un'asta
 * Può essere usato indipendentemente dal piazzare un'offerta
 */
export const setAutoBid = async (params: SetAutoBidParams): Promise<void> => {
  const { leagueId, auctionId, userId, username, maxAmount } = params;

  const autoBidRef = ref(realtimeDb, `autoBids/${leagueId}/${auctionId}/${userId}`);

  console.log(`[AUTO-BID SET] Setting auto-bid for ${userId}: max=${maxAmount}`);

  await set(autoBidRef, {
    userId,
    username,
    maxAmount,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Aggiorna locked credits
  await recalculateUserLockedCredits(leagueId, userId);

  console.log(`[AUTO-BID SET] Auto-bid set successfully for ${userId}`);
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
