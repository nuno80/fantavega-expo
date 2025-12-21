// services/budget.service.ts
// Servizio per gestione budget e transazioni
// Best Practice: Zod validation, Firebase Realtime DB per transactions

import { firestore, realtimeDb } from "@/lib/firebase";
import { get, push, ref } from "firebase/database";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { z } from "zod";

// ============================================
// SCHEMAS
// ============================================

export const BudgetTransactionSchema = z.object({
  userId: z.string(),
  type: z.enum([
    "initial_allocation",
    "auction_win",
    "penalty",
    "adjustment",
    "auto_bid_lock",
    "auto_bid_unlock",
  ]),
  amount: z.number(), // positivo = credito, negativo = debito
  description: z.string(),
  balanceAfter: z.number(),
  createdAt: z.number(),
  relatedAuctionId: z.string().nullish(),
  relatedPlayerId: z.number().nullish(),
  playerName: z.string().nullish(),
});
export type BudgetTransaction = z.infer<typeof BudgetTransactionSchema>;

// ============================================
// REFERENCE HELPERS
// ============================================

const getTransactionsRef = (leagueId: string, userId: string) =>
  ref(realtimeDb, `budgetTransactions/${leagueId}/${userId}`);

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Recupera cronologia transazioni budget per un utente
 */
export async function getBudgetHistory(
  leagueId: string,
  userId: string
): Promise<BudgetTransaction[]> {
  const transactionsRef = getTransactionsRef(leagueId, userId);
  const snapshot = await get(transactionsRef);

  if (!snapshot.exists()) return [];

  const transactions: BudgetTransaction[] = [];
  const data = snapshot.val();

  for (const txData of Object.values(data)) {
    const parsed = BudgetTransactionSchema.safeParse(txData);
    if (parsed.success) {
      transactions.push(parsed.data);
    }
  }

  // Ordina per data (più recenti prima)
  return transactions.sort((a, b) => b.createdAt - a.createdAt);
}

// ============================================
// WRITE OPERATIONS
// ============================================

export interface RecordTransactionParams {
  leagueId: string;
  userId: string;
  type: BudgetTransaction["type"];
  amount: number;
  description: string;
  relatedAuctionId?: string;
  relatedPlayerId?: number;
  playerName?: string;
}

/**
 * Registra una transazione budget e aggiorna saldo partecipante
 */
export async function recordTransaction(
  params: RecordTransactionParams
): Promise<BudgetTransaction> {
  const {
    leagueId,
    userId,
    type,
    amount,
    description,
    relatedAuctionId,
    relatedPlayerId,
    playerName,
  } = params;

  // 1. Recupera saldo attuale
  const participantRef = doc(firestore, "leagues", leagueId, "participants", userId);
  const participantSnap = await getDoc(participantRef);

  if (!participantSnap.exists()) {
    throw new Error("Participant not found");
  }

  const currentBudget = participantSnap.data().currentBudget ?? 0;
  const newBalance = currentBudget + amount;

  // 2. Aggiorna saldo in Firestore
  await updateDoc(participantRef, {
    currentBudget: newBalance,
  });

  // 3. Crea record transazione in Realtime DB
  const transactionsRef = getTransactionsRef(leagueId, userId);
  const transaction: BudgetTransaction = {
    userId,
    type,
    amount,
    description,
    balanceAfter: newBalance,
    createdAt: Date.now(),
    relatedAuctionId: relatedAuctionId ?? null,
    relatedPlayerId: relatedPlayerId ?? null,
    playerName: playerName ?? null,
  };

  await push(transactionsRef, transaction);

  console.log(`[BUDGET] Transaction recorded for ${userId}: ${type} ${amount}`);
  return transaction;
}

/**
 * Aggiorna solo i locked credits (senza transazione)
 */
export async function updateLockedCredits(
  leagueId: string,
  userId: string,
  lockedCredits: number
): Promise<void> {
  const participantRef = doc(firestore, "leagues", leagueId, "participants", userId);
  await updateDoc(participantRef, {
    lockedCredits,
  });
}

/**
 * Recupera budget e locked credits di un partecipante
 */
export async function getParticipantBudget(
  leagueId: string,
  userId: string
): Promise<{ currentBudget: number; lockedCredits: number; availableBudget: number }> {
  const participantRef = doc(firestore, "leagues", leagueId, "participants", userId);
  const participantSnap = await getDoc(participantRef);

  if (!participantSnap.exists()) {
    throw new Error("Participant not found");
  }

  const data = participantSnap.data();
  const currentBudget = data.currentBudget ?? 0;
  const lockedCredits = data.lockedCredits ?? 0;

  return {
    currentBudget,
    lockedCredits,
    availableBudget: currentBudget - lockedCredits,
  };
}
