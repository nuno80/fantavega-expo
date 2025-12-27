// hooks/useLeagueAuctions.ts
// Hook per sottoscrizione real-time a tutte le aste di una lega
// Best Practice: Cleanup automatico, Map per lookup efficiente

import { subscribeToLeagueAuctions } from "@/services/auction.service";
import { closeAuctionAndAssign } from "@/services/bid.service";
import { LiveAuction } from "@/types/schemas";
import { useEffect, useRef, useState } from "react";

interface UseLeagueAuctionsReturn {
  auctions: Map<string, LiveAuction>;
  auctionsList: Array<{ id: string; auction: LiveAuction }>;
  activeCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isRefreshing: boolean;
}

/**
 * Hook per sottoscriversi a tutte le aste di una lega
 * Filtra solo aste attive e fornisce utility per il rendering
 * IMPORTANTE: Chiude automaticamente le aste scadute
 */
export const useLeagueAuctions = (
  leagueId: string | null
): UseLeagueAuctionsReturn => {
  const [auctions, setAuctions] = useState<Map<string, LiveAuction>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track aste già in chiusura per evitare chiamate duplicate
  const closingAuctionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!leagueId) {
      setAuctions(new Map());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToLeagueAuctions(
      leagueId,
      (data) => {
        setAuctions(data);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [leagueId, refreshKey]);

  // ============================================
  // AUTO-CLOSE: Chiudi aste scadute automaticamente
  // ============================================
  useEffect(() => {
    if (!leagueId || auctions.size === 0) return;

    const now = Date.now();

    for (const [auctionId, auction] of auctions) {
      // Controlla se asta è scaduta e non ancora in chiusura
      if (
        auction.status === "active" &&
        auction.scheduledEndTime <= now &&
        !closingAuctionsRef.current.has(auctionId)
      ) {
        // Marca come "in chiusura" per evitare chiamate duplicate
        closingAuctionsRef.current.add(auctionId);

        console.log(`[AUCTION-AUTO-CLOSE] Closing auction ${auctionId}...`);

        closeAuctionAndAssign(leagueId, auctionId)
          .then((result) => {
            console.log(`[AUCTION-AUTO-CLOSE] ${result.message}`);
            // Rimuovi dalla lista dopo completamento (successo o fallimento)
            closingAuctionsRef.current.delete(auctionId);
          })
          .catch((err) => {
            console.error(`[AUCTION-AUTO-CLOSE] Error closing ${auctionId}:`, err);
            closingAuctionsRef.current.delete(auctionId);
          });
      }
    }
  }, [leagueId, auctions]);

  // Converti Map in array per rendering, filtra solo attive
  const auctionsList = Array.from(auctions.entries())
    .filter(([, auction]) => auction.status === "active")
    .map(([id, auction]) => ({ id, auction }))
    .sort((a, b) => a.auction.scheduledEndTime - b.auction.scheduledEndTime); // Più urgenti prima

  const activeCount = auctionsList.length;

  const refetch = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return {
    auctions,
    auctionsList,
    activeCount,
    isLoading,
    error,
    refetch,
    isRefreshing,
  };
};
