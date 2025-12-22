// components/auction/ComplianceTimer.tsx
// Timer countdown per compliance - mostra tempo rimanente prima delle penalità

import { processComplianceAndPenalties } from "@/services/penalty.service";
import { useEffect, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";

interface ComplianceTimerProps {
  timerStartTimestamp: number | null; // Unix timestamp in ms
  leagueId: string;
  userId: string;
  onPenaltyApplied?: () => void;
}

const GRACE_PERIOD_MS = 60 * 60 * 1000; // 1 ora
const PENALTY_INTERVAL_MS = 60 * 60 * 1000; // 1 ora tra penalità

/**
 * Componente che mostra il countdown del timer di compliance
 * - Fase grazia: countdown fino alla prima penalità
 * - Dopo grazia: countdown fino alla prossima penalità oraria
 */
export function ComplianceTimer({
  timerStartTimestamp,
  leagueId,
  userId,
  onPenaltyApplied,
}: ComplianceTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [phase, setPhase] = useState<"grace" | "penalty">("grace");
  const lastPenaltyCheckRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  // Quando il timer scade, ricontrolla compliance
  const handleTimerExpiration = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      console.log("[COMPLIANCE_TIMER] Timer expired - checking compliance");
      const result = await processComplianceAndPenalties(leagueId, userId);

      if (result.appliedPenaltyAmount > 0) {
        Alert.alert(
          "⚠️ Penalità Applicata",
          `Hai perso ${result.appliedPenaltyAmount} crediti per rosa incompleta.`,
          [{ text: "OK" }]
        );
        onPenaltyApplied?.();
      }
    } catch (err) {
      console.error("[COMPLIANCE_TIMER] Error:", err);
    } finally {
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    if (!timerStartTimestamp || timerStartTimestamp <= 0) {
      setTimeLeft("");
      setIsExpired(false);
      lastPenaltyCheckRef.current = null;
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const gracePeriodEnd = timerStartTimestamp + GRACE_PERIOD_MS;

      // Ancora nella fase di grazia?
      if (now < gracePeriodEnd) {
        setPhase("grace");
        const remainingMs = gracePeriodEnd - now;
        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        setTimeLeft(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
        setIsExpired(false);
        return;
      }

      // Fase penalità - calcola countdown fino alla prossima penalità oraria
      setPhase("penalty");
      const hoursSinceGrace = Math.floor((now - gracePeriodEnd) / PENALTY_INTERVAL_MS);
      const nextPenaltyTime = gracePeriodEnd + (hoursSinceGrace + 1) * PENALTY_INTERVAL_MS;
      const remainingMs = Math.max(0, nextPenaltyTime - now);

      if (remainingMs === 0) {
        // Timer scaduto - trigger check
        const currentCycle = gracePeriodEnd + (hoursSinceGrace + 1) * PENALTY_INTERVAL_MS;
        if (lastPenaltyCheckRef.current !== currentCycle) {
          lastPenaltyCheckRef.current = currentCycle;
          handleTimerExpiration();
        }
        setTimeLeft("00:00");
        setIsExpired(true);
        return;
      }

      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      setTimeLeft(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
      setIsExpired(remainingMs < 60000); // Ultimo minuto = urgente
    };

    // Calcola subito e poi ogni secondo
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [timerStartTimestamp, leagueId, userId]);

  // Non mostrare nulla se non c'è timer attivo
  if (!timeLeft) {
    return null;
  }

  return (
    <View
      className={`flex-row items-center rounded-xl px-3 py-2 ${phase === "grace"
          ? "bg-yellow-900/40"
          : isExpired
            ? "bg-red-900/60"
            : "bg-orange-900/40"
        }`}
    >
      <Text className="text-lg mr-2">
        {phase === "grace" ? "⏰" : "⚠️"}
      </Text>
      <View className="flex-1">
        <Text
          className={`text-xs font-medium ${phase === "grace" ? "text-yellow-300" : "text-orange-300"
            }`}
        >
          {phase === "grace" ? "Completa la rosa entro:" : "Prossima penalità:"}
        </Text>
        <Text
          className={`text-lg font-mono font-bold ${isExpired ? "text-red-400" : phase === "grace" ? "text-yellow-400" : "text-orange-400"
            } ${isExpired ? "animate-pulse" : ""}`}
        >
          {timeLeft}
        </Text>
      </View>
    </View>
  );
}
