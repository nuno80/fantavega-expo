// hooks/useCompliance.ts
// Hook per stato compliance in tempo reale da Firebase Realtime DB

import { realtimeDb } from "@/lib/firebase";
import { ComplianceStatus, ComplianceStatusSchema } from "@/services/penalty.service";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";

interface UseComplianceStatusResult {
  data: ComplianceStatus | null;
  isLoading: boolean;
}

/**
 * Hook per recuperare stato compliance di un utente in una lega (real-time)
 */
export function useComplianceStatus(
  leagueId: string,
  userId: string
): UseComplianceStatusResult {
  const [data, setData] = useState<ComplianceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!leagueId || !userId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const complianceRef = ref(realtimeDb, `compliance/${leagueId}/${userId}`);

    const unsubscribe = onValue(
      complianceRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setData(null);
        } else {
          const parsed = ComplianceStatusSchema.safeParse(snapshot.val());
          setData(parsed.success ? parsed.data : null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Compliance listener error:", error);
        setData(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [leagueId, userId]);

  return { data, isLoading };
}

/**
 * Hook per recuperare stato compliance di più utenti in una lega
 */
export function useMultipleComplianceStatus(
  leagueId: string,
  userIds: string[]
): Map<string, ComplianceStatus | null> {
  const [dataMap, setDataMap] = useState<Map<string, ComplianceStatus | null>>(new Map());

  useEffect(() => {
    if (!leagueId || userIds.length === 0) {
      setDataMap(new Map());
      return;
    }

    const unsubscribes: (() => void)[] = [];

    for (const userId of userIds) {
      const complianceRef = ref(realtimeDb, `compliance/${leagueId}/${userId}`);

      const unsubscribe = onValue(
        complianceRef,
        (snapshot) => {
          setDataMap((prev) => {
            const newMap = new Map(prev);
            if (!snapshot.exists()) {
              newMap.set(userId, null);
            } else {
              const parsed = ComplianceStatusSchema.safeParse(snapshot.val());
              newMap.set(userId, parsed.success ? parsed.data : null);
            }
            return newMap;
          });
        },
        (error) => {
          console.error(`Compliance listener error for ${userId}:`, error);
          setDataMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(userId, null);
            return newMap;
          });
        }
      );

      unsubscribes.push(unsubscribe);
    }

    return () => {
      for (const unsub of unsubscribes) {
        unsub();
      }
    };
  }, [leagueId, userIds.join(",")]); // Re-subscribe when userIds change

  return dataMap;
}

// ============================================
// HOOK PER TRIGGER COMPLIANCE CHECK
// ============================================

export interface ComplianceCheckResult {
  appliedPenaltyAmount: number;
  isNowCompliant: boolean;
  message: string;
  gracePeriodEndTime?: number;
  totalPenaltiesThisCycle: number;
}

interface UseComplianceCheckResult {
  result: ComplianceCheckResult | null;
  isChecking: boolean;
  error: string | null;
  recheck: () => Promise<void>;
}

/**
 * Hook che triggera il controllo compliance al mount della pagina
 * Questo è il trigger "lazy" per verificare e applicare penalità
 *
 * Usare in: pagina asta, rosa, manager
 */
export function useComplianceCheck(
  leagueId: string | null,
  userId: string | null,
  leagueStatus: string | null | undefined,
  options?: { enabled?: boolean }
): UseComplianceCheckResult {
  const [result, setResult] = useState<ComplianceCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo trigger se la lega è in fase attiva
  const isActivePhase = leagueStatus === "draft_active" || leagueStatus === "repair_active";
  const enabled = options?.enabled !== false;

  const performCheck = async () => {
    if (!leagueId || !userId || !isActivePhase) {
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // Import dinamico per evitare circular dependency
      const { processComplianceAndPenalties } = await import("@/services/penalty.service");
      const checkResult = await processComplianceAndPenalties(leagueId, userId);

      setResult(checkResult);

      console.log("[COMPLIANCE_CHECK] Result:", {
        leagueId,
        userId,
        isCompliant: checkResult.isNowCompliant,
        penalty: checkResult.appliedPenaltyAmount,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore controllo compliance";
      setError(message);
      console.error("[COMPLIANCE_CHECK] Error:", err);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (enabled && leagueId && userId && isActivePhase) {
      performCheck();
    }
  }, [leagueId, userId, isActivePhase, enabled]);

  return {
    result,
    isChecking,
    error,
    recheck: performCheck,
  };
}
