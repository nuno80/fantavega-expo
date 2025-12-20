// hooks/useUserRoster.ts
// Hook per sottoscrizione real-time alla rosa di un utente
// Best Practice: Cleanup automatico con useEffect

import { subscribeToUserRoster, UserRoster } from "@/services/roster.service";
import { useEffect, useState } from "react";

interface UseUserRosterReturn {
  roster: UserRoster | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook per sottoscriversi alla rosa di un utente in real-time
 * Si disconnette automaticamente al unmount
 */
export const useUserRoster = (
  leagueId: string | null,
  userId: string | null
): UseUserRosterReturn => {
  const [roster, setRoster] = useState<UserRoster | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip se mancano i parametri
    if (!leagueId || !userId) {
      setRoster(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Sottoscrivi agli aggiornamenti real-time
    const unsubscribe = subscribeToUserRoster(
      leagueId,
      userId,
      (data) => {
        setRoster(data);
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
  }, [leagueId, userId]);

  return { roster, isLoading, error };
};
