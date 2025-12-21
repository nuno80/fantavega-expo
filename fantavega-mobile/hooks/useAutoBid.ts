// hooks/useAutoBid.ts
// Hook per recuperare auto-bid attivi dell'utente

import { realtimeDb } from "@/lib/firebase";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";

interface UserAutoBid {
  auctionId: string;
  maxAmount: number;
  isActive: boolean;
  createdAt: number;
}

interface UseUserAutoBidResult {
  autoBid: UserAutoBid | null;
  maxAmount: number | null;
  isActive: boolean;
  isLoading: boolean;
}

/**
 * Hook per recuperare l'auto-bid dell'utente per una specifica asta
 */
export function useUserAutoBid(
  leagueId: string | null,
  auctionId: string | null,
  userId: string | null
): UseUserAutoBidResult {
  const [autoBid, setAutoBid] = useState<UserAutoBid | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!leagueId || !auctionId || !userId) {
      setAutoBid(null);
      setIsLoading(false);
      return;
    }

    const autoBidRef = ref(
      realtimeDb,
      `autoBids/${leagueId}/${auctionId}/${userId}`
    );

    const unsubscribe = onValue(autoBidRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setAutoBid({
          auctionId,
          maxAmount: data.maxAmount,
          isActive: data.isActive ?? true,
          createdAt: data.createdAt,
        });
      } else {
        setAutoBid(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [leagueId, auctionId, userId]);

  return {
    autoBid,
    maxAmount: autoBid?.maxAmount ?? null,
    isActive: autoBid?.isActive ?? false,
    isLoading,
  };
}

/**
 * Hook per recuperare tutti gli auto-bid attivi dell'utente in una lega
 */
export function useUserAutoBidsInLeague(
  leagueId: string | null,
  userId: string | null
): { autoBids: Map<string, number>; isLoading: boolean } {
  const [autoBids, setAutoBids] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!leagueId || !userId) {
      setAutoBids(new Map());
      setIsLoading(false);
      return;
    }

    // Listen to all auctions in this league for this user's auto-bids
    const autoBidsRef = ref(realtimeDb, `autoBids/${leagueId}`);

    const unsubscribe = onValue(autoBidsRef, (snapshot) => {
      const newAutoBids = new Map<string, number>();

      if (snapshot.exists()) {
        const data = snapshot.val();
        // data structure: { auctionId: { userId: { maxAmount, isActive, ... } } }
        for (const [auctionId, auctionData] of Object.entries(data)) {
          const userAutoBid = (auctionData as Record<string, unknown>)[userId];
          if (
            userAutoBid &&
            typeof userAutoBid === "object" &&
            (userAutoBid as { isActive?: boolean }).isActive !== false
          ) {
            newAutoBids.set(
              auctionId,
              (userAutoBid as { maxAmount: number }).maxAmount
            );
          }
        }
      }

      setAutoBids(newAutoBids);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [leagueId, userId]);

  return { autoBids, isLoading };
}
