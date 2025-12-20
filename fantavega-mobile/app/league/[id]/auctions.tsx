// app/league/[id]/auctions.tsx
// Tab Aste: lista aste attive della lega

import { AuctionCard } from "@/components/auction/AuctionCard";
import { useLeague } from "@/hooks/useLeague";
import { useLeagueAuctions } from "@/hooks/useLeagueAuctions";
import { useUserStore } from "@/stores/userStore";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from "react-native";

export default function AuctionsTab() {
  const { id: leagueId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUserId } = useUserStore();

  const { data: league } = useLeague(leagueId ?? "");
  const { auctionsList, isLoading } = useLeagueAuctions(leagueId ?? "");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAdmin = league?.adminCreatorId === currentUserId;
  const canCallPlayer = isAdmin && (league?.status === "draft_active" || league?.status === "repair_active");

  const handleAuctionPress = (auctionId: string) => {
    router.push({
      pathname: "/auction/[id]",
      params: { id: auctionId, leagueId },
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 text-gray-400">Caricamento aste...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-bg">
      {/* Pulsante Chiama Giocatore - Admin only */}
      {canCallPlayer && (
        <View className="p-4">
          <Pressable
            onPress={() => router.push({
              pathname: "/(tabs)/players",
              params: { leagueId }
            })}
            className="flex-row items-center justify-center rounded-xl bg-primary-600 p-4 active:opacity-80"
          >
            <Plus size={20} color="white" />
            <Text className="ml-2 font-bold text-white">Chiama Giocatore all'Asta</Text>
          </Pressable>
        </View>
      )}

      {/* Lista Aste o Empty State */}
      {auctionsList.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">🎯</Text>
          <Text className="text-lg font-semibold text-white text-center">
            Nessuna asta attiva
          </Text>
          <Text className="mt-2 text-sm text-gray-400 text-center">
            {canCallPlayer
              ? "Chiama un giocatore per avviare un'asta"
              : "Attendi che l'admin chiami un giocatore"}
          </Text>
          <Pressable
            onPress={handleRefresh}
            className="mt-6 flex-row items-center rounded-xl bg-dark-card px-6 py-3"
          >
            <RefreshCw size={18} color="#818cf8" />
            <Text className="ml-2 text-primary-400">Aggiorna</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={auctionsList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AuctionCard
              auctionId={item.id}
              auction={item.auction}
              onPress={handleAuctionPress}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#818cf8"
            />
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
