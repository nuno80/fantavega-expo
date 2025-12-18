// hooks/useAuction.ts
// Hook per sottoscrizione real-time a una singola asta
// Best Practice: Cleanup automatico con useEffect

import { subscribeToAuction } from "@/services/auction.service";
import { LiveAuction } from "@/types/schemas";
import { useEffect, useState } from "react";

interface UseAuctionReturn {
  auction: LiveAuction | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook per sottoscriversi a una singola asta in real-time
 * Si disconnette automaticamente al unmount
 */
export const useAuction = (
  leagueId: string | null,
  auctionId: string | null
): UseAuctionReturn => {
  const [auction, setAuction] = useState<LiveAuction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip se mancano i parametri
    if (!leagueId || !auctionId) {
      setAuction(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Sottoscrivi agli aggiornamenti real-time
    const unsubscribe = subscribeToAuction(
      leagueId,
      auctionId,
      (data) => {
        setAuction(data);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    // Cleanup: disconnetti al unmount o cambio parametri
    return () => {
      unsubscribe();
    };
  }, [leagueId, auctionId]);

  return { auction, isLoading, error };
};
