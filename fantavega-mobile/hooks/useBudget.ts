// hooks/useBudget.ts
// Hook per ottenere i dati del budget utente in tempo reale da Firestore

import { useCurrentUser } from "@/contexts/AuthContext";
import { firestore } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

interface BudgetData {
  currentBudget: number;
  lockedCredits: number;
  spentCredits: number;
  availableBudget: number;
  availableForAutoBid: number;
  totalBlocked: number;
}

const DEFAULT_BUDGET: BudgetData = {
  currentBudget: 500,
  lockedCredits: 0,
  spentCredits: 0,
  availableBudget: 500,
  availableForAutoBid: 500,
  totalBlocked: 0,
};

/**
 * Hook per budget utente in tempo reale
 * @param leagueId - ID della lega
 * @param fallbackInitialBudget - Budget fallback se originalBudget non esiste (per retrocompatibilità)
 */
export function useUserBudget(leagueId: string | null, fallbackInitialBudget: number = 500): BudgetData {
  const { currentUserId } = useCurrentUser();
  const [budget, setBudget] = useState<BudgetData>(DEFAULT_BUDGET);

  useEffect(() => {
    if (!leagueId || !currentUserId) {
      setBudget(DEFAULT_BUDGET);
      return;
    }

    // Ascolta i dati del partecipante da Firestore (non RTDB!)
    const participantRef = doc(
      firestore,
      "leagues",
      leagueId,
      "participants",
      currentUserId
    );

    const unsubscribe = onSnapshot(participantRef, (snapshot) => {
      if (!snapshot.exists()) {
        setBudget(DEFAULT_BUDGET);
        return;
      }

      const data = snapshot.data();
      const currentBudget = data.currentBudget ?? fallbackInitialBudget;
      const lockedCredits = data.lockedCredits ?? 0;

      // Usa originalBudget dal documento, con fallback per utenti esistenti
      // originalBudget = budget con cui l'utente si è iscritto
      const originalBudget = data.originalBudget ?? fallbackInitialBudget;

      // spentCredits calcolato come differenza tra budget ORIGINALE e corrente
      // Questo include TUTTO: acquisti giocatori + penalità
      // Math.max(0, ...) per evitare negativi in casi edge
      const spentCredits = Math.max(0, originalBudget - currentBudget);

      // Calcoli derivati
      const availableBudget = currentBudget - lockedCredits;
      const availableForAutoBid = currentBudget - lockedCredits;
      const totalBlocked = lockedCredits;

      setBudget({
        currentBudget,
        lockedCredits,
        spentCredits,
        availableBudget,
        availableForAutoBid,
        totalBlocked,
      });
    });

    return () => unsubscribe();
  }, [leagueId, currentUserId, fallbackInitialBudget]);

  return budget;
}
