// app/league/[id].tsx
// League detail screen

import { useLeague, useLeagueParticipants } from "@/hooks/useLeague";
import { useUserStore } from "@/stores/userStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

const STATUS_LABELS: Record<string, string> = {
  participants_joining: "Iscrizioni aperte",
  draft_active: "Asta in corso",
  repair_active: "Riparazioni",
  market_closed: "Mercato chiuso",
  completed: "Completata",
};

export default function LeagueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUserId } = useUserStore();

  const { data: league, isLoading, error } = useLeague(id ?? "");
  const { data: participants } = useLeagueParticipants(id ?? "");

  // Check if current user is admin
  const isAdmin = league?.adminCreatorId === currentUserId;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 text-gray-400">Caricamento lega...</Text>
      </View>
    );
  }

  if (error || !league) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg p-8">
        <Text className="mb-2 text-5xl">❌</Text>
        <Text className="text-center text-lg font-semibold text-white">
          Lega non trovata
        </Text>
        <Text className="mt-2 text-center text-sm text-gray-400">
          {error?.message ?? "ID non valido"}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="items-center p-6">
        <View className="w-full flex-row items-center justify-between mb-2">
          <View className="w-10" />
          <Text className="text-2xl font-bold text-white flex-1 text-center">
            {league.name}
          </Text>
          {isAdmin ? (
            <Pressable
              onPress={() => router.push(`/league/${id}/settings`)}
              className="w-10 h-10 items-center justify-center rounded-full bg-dark-card"
            >
              <Text className="text-lg">⚙️</Text>
            </Pressable>
          ) : (
            <View className="w-10" />
          )}
        </View>
        <View className="mt-2 rounded-full bg-primary-600 px-4 py-1">
          <Text className="text-sm font-semibold text-white">
            {STATUS_LABELS[league.status] ?? league.status}
          </Text>
        </View>
      </View>

      {/* Budget & Type */}
      <View className="mx-4 mb-4 flex-row justify-around rounded-2xl bg-dark-card p-5">
        <View className="items-center">
          <Text className="text-3xl font-bold text-primary-500">
            {league.initialBudgetPerManager}
          </Text>
          <Text className="text-xs text-gray-400">Budget Iniziale</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-semibold text-white">
            {league.leagueType === "classic" ? "Classic" : "Mantra"}
          </Text>
          <Text className="text-xs text-gray-400">Tipo Lega</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-white">
            {participants?.length ?? 0}
          </Text>
          <Text className="text-xs text-gray-400">Partecipanti</Text>
        </View>
      </View>

      {/* Slot Configuration */}
      <View className="mx-4 mb-4 rounded-2xl bg-dark-card p-5">
        <Text className="mb-4 text-lg font-semibold text-white">
          📋 Configurazione Rosa
        </Text>
        <View className="flex-row justify-around">
          <View className="items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-role-P">
              <Text className="text-xl font-bold text-white">{league.slotsP}</Text>
            </View>
            <Text className="mt-2 text-sm text-gray-400">Portieri</Text>
          </View>
          <View className="items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-role-D">
              <Text className="text-xl font-bold text-white">{league.slotsD}</Text>
            </View>
            <Text className="mt-2 text-sm text-gray-400">Difensori</Text>
          </View>
          <View className="items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-role-C">
              <Text className="text-xl font-bold text-white">{league.slotsC}</Text>
            </View>
            <Text className="mt-2 text-sm text-gray-400">Centrocampisti</Text>
          </View>
          <View className="items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-role-A">
              <Text className="text-xl font-bold text-white">{league.slotsA}</Text>
            </View>
            <Text className="mt-2 text-sm text-gray-400">Attaccanti</Text>
          </View>
        </View>
        <View className="mt-4 items-center rounded-xl bg-dark-bg p-3">
          <Text className="text-2xl font-bold text-primary-500">
            {league.slotsP + league.slotsD + league.slotsC + league.slotsA}
          </Text>
          <Text className="text-xs text-gray-400">Slot Totali</Text>
        </View>
      </View>

      {/* Participants */}
      <View className="mx-4 mb-8 rounded-2xl bg-dark-card p-5">
        <Text className="mb-4 text-lg font-semibold text-white">
          👥 Partecipanti ({participants?.length ?? 0})
        </Text>
        {(!participants || participants.length === 0) ? (
          <Text className="text-center text-gray-400">
            Nessun partecipante ancora
          </Text>
        ) : (
          participants.map((p, i) => (
            <View
              key={p.userId}
              className="mb-2 flex-row items-center justify-between rounded-xl bg-dark-bg p-3"
            >
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-600">
                  <Text className="font-bold text-white">{i + 1}</Text>
                </View>
                <Text className="font-semibold text-white">
                  {p.managerTeamName ?? `Manager ${i + 1}`}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-bold text-primary-500">
                  {p.currentBudget}
                </Text>
                <Text className="text-xs text-gray-500">crediti</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
