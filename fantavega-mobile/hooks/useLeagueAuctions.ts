// hooks/useLeagueAuctions.ts
// Hook per sottoscrizione real-time a tutte le aste di una lega
// Best Practice: Cleanup automatico, Map per lookup efficiente

import { subscribeToLeagueAuctions } from "@/services/auction.service";
import { LiveAuction } from "@/types/schemas";
import { useEffect, useState } from "react";

interface UseLeagueAuctionsReturn {
  auctions: Map<string, LiveAuction>;
  auctionsList: Array<{ id: string; auction: LiveAuction }>;  // Per rendering
  activeCount: number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook per sottoscriversi a tutte le aste di una lega
 * Filtra solo aste attive e fornisce utility per il rendering
 */
export const useLeagueAuctions = (
  leagueId: string | null
): UseLeagueAuctionsReturn => {
  const [auctions, setAuctions] = useState<Map<string, LiveAuction>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
  }, [leagueId]);

  // Converti Map in array per rendering, filtra solo attive
  const auctionsList = Array.from(auctions.entries())
    .filter(([, auction]) => auction.status === "active")
    .map(([id, auction]) => ({ id, auction }))
    .sort((a, b) => a.auction.scheduledEndTime - b.auction.scheduledEndTime); // Più urgenti prima

  const activeCount = auctionsList.length;

  return {
    auctions,
    auctionsList,
    activeCount,
    isLoading,
    error,
  };
};
