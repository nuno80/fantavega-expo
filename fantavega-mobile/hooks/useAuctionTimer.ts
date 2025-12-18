// hooks/useAuctionTimer.ts
// Hook per timer sincronizzato con countdown
// Best Practice: Interval con cleanup, formattazione user-friendly

import { useEffect, useState } from "react";

interface UseAuctionTimerReturn {
  timeRemaining: number;      // Millisecondi rimanenti
  isExpired: boolean;
  isUrgent: boolean;          // < 5 minuti
  isCritical: boolean;        // < 1 minuto
  formattedTime: string;      // "HH:MM:SS" o "MM:SS"
}

/**
 * Hook per timer countdown sincronizzato
 * Aggiorna ogni secondo
 */
export const useAuctionTimer = (
  scheduledEndTime: number | null
): UseAuctionTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!scheduledEndTime) {
      setTimeRemaining(0);
      return;
    }

    // Calcola tempo rimanente iniziale
    const calculateRemaining = () => {
      const now = Date.now();
      return Math.max(0, scheduledEndTime - now);
    };

    setTimeRemaining(calculateRemaining());

    // Aggiorna ogni secondo
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);

      // Stop interval se scaduto
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, [scheduledEndTime]);

  // Calcola stati derivati
  const isExpired = timeRemaining <= 0;
  const isUrgent = timeRemaining > 0 && timeRemaining <= 5 * 60 * 1000;  // 5 min
  const isCritical = timeRemaining > 0 && timeRemaining <= 60 * 1000;     // 1 min

  // Formatta tempo
  const formatTime = (ms: number): string => {
    if (ms <= 0) return "00:00";

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  return {
    timeRemaining,
    isExpired,
    isUrgent,
    isCritical,
    formattedTime: formatTime(timeRemaining),
  };
};
