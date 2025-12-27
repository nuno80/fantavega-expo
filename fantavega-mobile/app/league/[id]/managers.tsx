// app/league/[id]/managers.tsx
// Tab Manager: mostra gli altri partecipanti della lega
// Visualizza budget, slot riempiti, info e stato compliance di ogni manager

import { ManagerRosterModal } from "@/components/auction/ManagerRosterModal";
import { OtherManagersTab } from "@/components/auction/OtherManagersTab";
import { useCurrentUser } from "@/contexts/AuthContext";
import { useComplianceCheck, useMultipleComplianceStatus } from "@/hooks/useCompliance";
import { useLeague, useLeagueParticipants } from "@/hooks/useLeague";
import { useLeagueAuctions } from "@/hooks/useLeagueAuctions";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";


// Grace period constant (deve matchare penalty.service.ts)
const GRACE_PERIOD_MS = 60 * 60 * 1000;

export default function ManagersTab() {
  const { id: leagueId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUserId } = useCurrentUser();

  const { data: participants, isLoading } = useLeagueParticipants(leagueId ?? "");
  const { data: league } = useLeague(leagueId ?? "");
  const { auctionsList } = useLeagueAuctions(leagueId ?? null);

  // Stato per modal rosa manager
  const [selectedManager, setSelectedManager] = useState<{
    id: string;
    name: string;
    budgetLeft: number;
    totalBudget: number;
  } | null>(null);

  // 🔴 TRIGGER COMPLIANCE CHECK all'accesso della pagina manager
  useComplianceCheck(leagueId ?? null, currentUserId, league?.status);

  // Estrai userIds degli altri partecipanti per fetch compliance

  const otherUserIds = useMemo(() => {
    if (!participants) return [];
    return participants
      .filter(p => p.userId !== currentUserId && p.userId)
      .map(p => p.userId as string);
  }, [participants, currentUserId]);

  // Hook per compliance real-time di tutti i manager
  const complianceMap = useMultipleComplianceStatus(leagueId ?? "", otherUserIds);

  // Calcola totalSlots dalla configurazione lega
  const totalSlots = useMemo(() => {
    if (!league) return 25;
    return (league.slotsP ?? 3) + (league.slotsD ?? 8) + (league.slotsC ?? 8) + (league.slotsA ?? 6);
  }, [league]);

  // Trasforma i partecipanti nel formato richiesto da OtherManagersTab
  const managers = useMemo(() => {
    if (!participants) return [];
    const now = Date.now();

    return participants
      .filter(p => p.userId !== currentUserId)
      .map((p, index) => {
        const compliance = p.userId ? complianceMap.get(p.userId) : null;

        // Calcola stato grazia
        let inGracePeriod = false;
        let gracePeriodEndsAt: number | undefined;

        if (compliance?.complianceTimerStartAt) {
          const timerStart = compliance.complianceTimerStartAt;
          const elapsedMs = now - timerStart;
          if (elapsedMs < GRACE_PERIOD_MS) {
            inGracePeriod = true;
            gracePeriodEndsAt = timerStart + GRACE_PERIOD_MS;
          }
        }

        return {
          id: p.userId ?? `manager-${index}`,
          name: p.managerTeamName ?? `Manager ${index + 1}`,
          teamName: p.managerTeamName ?? "Squadra",
          budgetLeft: p.currentBudget ?? 0,
          totalBudget: league?.initialBudgetPerManager ?? 500,
          slotsFilled: 0, // TODO: calculate from roster
          totalSlots,
          // Dati penalty
          penaltiesThisCycle: compliance?.penaltiesAppliedThisCycle ?? 0,
          inGracePeriod,
          gracePeriodEndsAt,
        };
      });
  }, [participants, currentUserId, complianceMap, league, totalSlots]);

  const handleManagerPress = (managerId: string) => {
    const manager = managers.find(m => m.id === managerId);
    if (manager) {
      setSelectedManager({
        id: manager.id,
        name: manager.teamName,
        budgetLeft: manager.budgetLeft,
        totalBudget: manager.totalBudget,
      });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (managers.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg p-8">
        <Text className="text-5xl mb-4">👥</Text>
        <Text className="text-lg font-semibold text-white text-center">
          Nessun altro partecipante
        </Text>
        <Text className="mt-2 text-sm text-gray-400 text-center">
          Sei l'unico nella lega per ora
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-bg">
      <OtherManagersTab
        managers={managers}
        onManagerPress={handleManagerPress}
      />

      {/* Modal Rosa Manager */}
      {selectedManager && (
        <ManagerRosterModal
          visible={!!selectedManager}
          onClose={() => setSelectedManager(null)}
          leagueId={leagueId ?? ""}
          managerId={selectedManager.id}
          managerName={selectedManager.name}
          availableCredits={selectedManager.budgetLeft}
          totalBudget={selectedManager.totalBudget}
          slotsConfig={{
            P: league?.slotsP ?? 3,
            D: league?.slotsD ?? 8,
            C: league?.slotsC ?? 8,
            A: league?.slotsA ?? 6,
          }}
          winningAuctions={auctionsList.map(a => ({ id: a.id, auction: a.auction }))}
        />
      )}
    </View>
  );
}
