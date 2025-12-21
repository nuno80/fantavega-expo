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
