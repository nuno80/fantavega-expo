// app/league/[id]/managers.tsx
// Tab Manager: mostra gli altri partecipanti della lega
// Visualizza budget, slot riempiti e info di ogni manager

import { OtherManagersTab } from "@/components/auction/OtherManagersTab";
import { useCurrentUser } from "@/contexts/AuthContext";
import { useLeagueParticipants } from "@/hooks/useLeague";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function ManagersTab() {
  const { id: leagueId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUserId } = useCurrentUser();

  const { data: participants, isLoading } = useLeagueParticipants(leagueId ?? "");

  // Trasforma i partecipanti nel formato richiesto da OtherManagersTab
  // Esclude l'utente corrente
  const managers = useMemo(() => {
    if (!participants) return [];

    return participants
      .filter(p => p.userId !== currentUserId)
      .map((p, index) => ({
        id: p.userId ?? `manager-${index}`,
        name: p.managerTeamName ?? `Manager ${index + 1}`,
        teamName: p.managerTeamName ?? "Squadra",
        budgetLeft: p.currentBudget ?? 0,
        totalBudget: 500, // TODO: get from league settings
        slotsFilled: 0, // TODO: calculate from roster
        totalSlots: 25, // TODO: get from league settings
      }));
  }, [participants, currentUserId]);

  const handleManagerPress = (managerId: string) => {
    // TODO: Naviga al dettaglio del manager
    console.log("View manager:", managerId);
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
    </View>
  );
}
