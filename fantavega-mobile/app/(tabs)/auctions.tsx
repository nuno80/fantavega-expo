// app/(tabs)/auctions.tsx
// Lista aste attive con selezione lega
// Best Practice: FlashList per performance, pull-to-refresh

import { AuctionCard } from "@/components/auction/AuctionCard";
import { useLeagues } from "@/hooks/useLeague";
import { useLeagueAuctions } from "@/hooks/useLeagueAuctions";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function AuctionsScreen() {
  const { data: leagues, isLoading: leaguesLoading } = useLeagues();
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  // Auto-seleziona la prima lega attiva se non selezionata
  const activeLeagues = leagues?.filter(
    (l) => l.status === "draft_active" || l.status === "repair_active"
  );

  // Usa la lega selezionata o la prima disponibile
  const leagueId = selectedLeagueId || activeLeagues?.[0]?.id || null;

  const {
    auctionsList,
    activeCount,
    isLoading: auctionsLoading,
    error,
  } = useLeagueAuctions(leagueId);

  const handleAuctionPress = (auctionId: string) => {
    if (leagueId) {
      router.push({
        pathname: "/auction/[id]",
        params: { id: auctionId, leagueId },
      });
    }
  };

  const handleRefresh = () => {
    // I dati sono real-time, ma per UX manteniamo pull-to-refresh
    // In futuro potremmo forzare un re-fetch qui
  };

  // Loading state
  if (leaguesLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 text-gray-400">Caricamento leghe...</Text>
      </View>
    );
  }

  // No active leagues
  if (!activeLeagues || activeLeagues.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg p-6">
        <View className="w-full items-center rounded-2xl bg-dark-card p-8">
          <Text className="mb-4 text-5xl">🏟️</Text>
          <Text className="mb-2 text-center text-xl font-semibold text-white">
            Nessuna Lega Attiva
          </Text>
          <Text className="text-center text-sm leading-5 text-gray-400">
            Non ci sono leghe in fase di asta al momento.
            {"\n"}Torna alla dashboard per vedere le tue leghe.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-bg">
      {/* League Selector (se più di una lega attiva) */}
      {activeLeagues.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="max-h-14 border-b border-gray-800"
          contentContainerClassName="px-4 py-2"
        >
          {activeLeagues.map((league) => (
            <Pressable
              key={league.id}
              onPress={() => setSelectedLeagueId(league.id)}
              className={`mr-2 rounded-full px-4 py-2 ${leagueId === league.id
                ? "bg-primary-600"
                : "bg-dark-card"
                }`}
            >
              <Text
                className={`font-medium ${leagueId === league.id ? "text-white" : "text-gray-400"
                  }`}
              >
                {league.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Header with count */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-lg font-semibold text-white">
          🎯 Aste Attive
        </Text>
        <View className="rounded-full bg-primary-600 px-3 py-1">
          <Text className="font-bold text-white">{activeCount}</Text>
        </View>
      </View>

      {/* Auctions List */}
      {auctionsLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center text-red-400">
            Errore: {error.message}
          </Text>
        </View>
      ) : auctionsList.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="items-center rounded-2xl bg-dark-card p-8">
            <Text className="mb-4 text-5xl">🎯</Text>
            <Text className="mb-2 text-center text-xl font-semibold text-white">
              Nessuna Asta Attiva
            </Text>
            <Text className="text-center text-sm text-gray-400">
              Le aste appariranno qui quando un giocatore viene messo in vendita
            </Text>
          </View>
        </View>
      ) : (
        <FlashList
          data={auctionsList}
          renderItem={({ item }) => (
            <AuctionCard
              auctionId={item.id}
              auction={item.auction}
              onPress={handleAuctionPress}
            />
          )}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor="#4f46e5"
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
