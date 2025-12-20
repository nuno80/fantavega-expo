// app/(tabs)/index.tsx
// Dashboard home screen with leagues list

import { LeagueCard } from "@/components/leagues/LeagueCard";
import { useLeagues } from "@/hooks/useLeague";
import { useLeagueStore } from "@/stores/leagueStore";
import type { League } from "@/types/schemas";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View
} from "react-native";

export default function DashboardScreen() {
  const { data: leagues, isLoading, error, refetch, isRefetching } = useLeagues();
  const { setCurrentLeague } = useLeagueStore();

  const handleLeaguePress = (league: League) => {
    // Set current league in global store for use in other tabs (e.g., players)
    setCurrentLeague(league);

    router.push({
      pathname: "/league/[id]",
      params: { id: league.id },
    });
  };

  const handleCreateLeague = () => {
    router.push("/league/create");
  };

  return (
    <ScrollView
      className="flex-1 bg-dark-bg"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      {/* Header */}
      <View className="items-center p-6">
        <Text className="text-3xl font-bold text-white">Fantavega</Text>
        <Text className="mt-1 text-base text-gray-400">
          Sistema d'Asta Fantacalcio
        </Text>
      </View>

      {/* Quick Stats */}
      <View className="mx-4 mb-4 flex-row justify-around rounded-2xl bg-dark-card p-5">
        <View className="items-center">
          <Text className="text-2xl font-bold text-primary-500">
            {leagues?.length ?? 0}
          </Text>
          <Text className="text-xs text-gray-400">Leghe</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-primary-500">
            {leagues?.filter((l) => l.status === "draft_active").length ?? 0}
          </Text>
          <Text className="text-xs text-gray-400">Aste Attive</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-primary-500">543</Text>
          <Text className="text-xs text-gray-400">Giocatori</Text>
        </View>
      </View>

      {/* Leagues Section */}
      <View className="px-4 pb-2">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-white">🏆 Le Tue Leghe</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => router.push("/league/join")}
              className="rounded-lg bg-dark-card border border-primary-600 px-3 py-2 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-primary-500">🎟️ Unisciti</Text>
            </Pressable>
            <Pressable
              onPress={handleCreateLeague}
              className="rounded-lg bg-primary-600 px-4 py-2 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-white">+ Nuova</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="mt-4 text-gray-400">Caricamento leghe...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View className="mx-4 items-center rounded-2xl bg-dark-card p-8">
          <Text className="mb-2 text-4xl">❌</Text>
          <Text className="text-center text-white">Errore di caricamento</Text>
          <Text className="mt-1 text-center text-sm text-gray-400">
            {error.message}
          </Text>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !error && leagues?.length === 0 && (
        <View className="mx-4 items-center rounded-2xl bg-dark-card p-8">
          <Text className="mb-4 text-5xl">🏟️</Text>
          <Text className="text-center text-lg font-semibold text-white">
            Nessuna Lega
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-400">
            Crea una nuova lega o unisciti a una esistente
          </Text>
          <Pressable
            onPress={handleCreateLeague}
            className="mt-6 rounded-xl bg-primary-600 px-8 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-white">Crea Prima Lega</Text>
          </Pressable>
        </View>
      )}

      {/* Leagues List */}
      {!isLoading && !error && leagues && leagues.length > 0 && (
        <View>
          {leagues.map((league) => (
            <LeagueCard
              key={league.id}
              league={league}
              onPress={handleLeaguePress}
            />
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View className="mx-4 mb-8 mt-4 rounded-2xl bg-dark-card p-5">
        <Text className="mb-3 text-lg font-semibold text-white">
          ⚡ Azioni Rapide
        </Text>
        <Pressable className="mb-2 rounded-lg bg-dark-bg p-3 active:opacity-80">
          <Text className="text-gray-300">📋 Crea nuova lega</Text>
        </Pressable>
        <Pressable className="mb-2 rounded-lg bg-dark-bg p-3 active:opacity-80">
          <Text className="text-gray-300">🔍 Cerca giocatori</Text>
        </Pressable>
        <Pressable className="rounded-lg bg-dark-bg p-3 active:opacity-80">
          <Text className="text-gray-300">📊 Visualizza rose</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
